package com.meewav.android.features.globe

import android.content.Context
import android.graphics.SurfaceTexture
import android.opengl.EGL14
import android.opengl.EGLConfig
import android.opengl.EGLContext
import android.opengl.EGLDisplay
import android.opengl.EGLSurface
import android.os.Handler
import android.os.HandlerThread
import android.util.Base64
import android.util.Log
import android.view.TextureView
import android.view.ViewGroup
import android.webkit.JavascriptInterface
import android.webkit.WebView
import android.widget.FrameLayout
import java.util.concurrent.CountDownLatch
import java.util.concurrent.Semaphore
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicBoolean
import org.json.JSONObject

/** GLES3 runs on its own EGL thread and TextureView surface. Chromium renders
 * controls only. TextureView supports the exact canvas transform during a
 * display rotation; frame acknowledgements follow eglSwapBuffers. */
internal class NativeGlobeSurface(context: Context) : TextureView(context), TextureView.SurfaceTextureListener, AutoCloseable {
    private val gpuThread = HandlerThread("MeewavGlobeGLES").apply { start() }
    private val gpu = Handler(gpuThread.looper)
    private val initialized = CountDownLatch(1)
    private val closed = AtomicBoolean(false)
    private val frameSlots = Semaphore(2)
    private var display: EGLDisplay = EGL14.EGL_NO_DISPLAY
    private var eglContext: EGLContext = EGL14.EGL_NO_CONTEXT
    private var window: EGLSurface = EGL14.EGL_NO_SURFACE
    private var pbuffer: EGLSurface = EGL14.EGL_NO_SURFACE
    private var config: EGLConfig? = null
    private var texture: SurfaceTexture? = null
    private var nativeHandle = 0L
    private var bufferWidth = 0
    private var bufferHeight = 0
    @Volatile private var requestedWidth = 1
    @Volatile private var requestedHeight = 1
    @Volatile private var active = true
    @Volatile private var failure: String? = null
    @Volatile private var submitted = 0L
    @Volatile private var rendered = 0L
    @Volatile private var presented = 0L
    @Volatile private var layoutGeneration = 0L
    @Volatile private var appliedLayoutGeneration = 0L
    private var web: WebView? = null

    init {
        System.loadLibrary("meewav_globe")
        isOpaque = true
        importantForAccessibility = IMPORTANT_FOR_ACCESSIBILITY_NO
        surfaceTextureListener = this
        gpu.post {
            try {
                display = EGL14.eglGetDisplay(EGL14.EGL_DEFAULT_DISPLAY)
                check(display != EGL14.EGL_NO_DISPLAY)
                val version = IntArray(2)
                check(EGL14.eglInitialize(display,version,0,version,1)) { "EGL initialization failed" }
                val attributes = intArrayOf(EGL14.EGL_RED_SIZE,8,EGL14.EGL_GREEN_SIZE,8,EGL14.EGL_BLUE_SIZE,8,EGL14.EGL_ALPHA_SIZE,8,
                    EGL14.EGL_RENDERABLE_TYPE,0x40,EGL14.EGL_SURFACE_TYPE,EGL14.EGL_WINDOW_BIT or EGL14.EGL_PBUFFER_BIT,EGL14.EGL_NONE)
                val configs = arrayOfNulls<EGLConfig>(1)
                val count = IntArray(1)
                check(EGL14.eglChooseConfig(display,attributes,0,configs,0,1,count,0) && count[0]>0) { "GLES3 EGL config unavailable" }
                config = configs[0]
                eglContext = EGL14.eglCreateContext(display,config,EGL14.EGL_NO_CONTEXT,intArrayOf(EGL14.EGL_CONTEXT_CLIENT_VERSION,3,EGL14.EGL_NONE),0)
                check(eglContext != EGL14.EGL_NO_CONTEXT) { "GLES3 context unavailable" }
                pbuffer = EGL14.eglCreatePbufferSurface(display,config,intArrayOf(EGL14.EGL_WIDTH,1,EGL14.EGL_HEIGHT,1,EGL14.EGL_NONE),0)
                check(EGL14.eglMakeCurrent(display,pbuffer,pbuffer,eglContext)) { "EGL offscreen binding failed" }
                nativeHandle = nativeCreate()
            } catch (error: Throwable) { reject(error) }
            finally { initialized.countDown() }
        }
    }

    fun attach(view: WebView) { web = view; view.addJavascriptInterface(Bridge(),"MeewavNativeGl") }
    fun setActive(value: Boolean) { active = value }
    private fun reject(error: Throwable) {
        failure = error.message ?: error.javaClass.simpleName
        Log.e("MeewavNativeGlobe",failure,error)
    }
    private fun prepareWindow(): Boolean {
        val currentTexture = texture ?: return false
        if (window == EGL14.EGL_NO_SURFACE || bufferWidth != requestedWidth || bufferHeight != requestedHeight) {
            EGL14.eglMakeCurrent(display,pbuffer,pbuffer,eglContext)
            if (window != EGL14.EGL_NO_SURFACE) EGL14.eglDestroySurface(display,window)
            currentTexture.setDefaultBufferSize(requestedWidth,requestedHeight)
            window = EGL14.eglCreateWindowSurface(display,config,currentTexture,intArrayOf(EGL14.EGL_NONE),0)
            check(window != EGL14.EGL_NO_SURFACE) { "EGL window creation failed" }
            bufferWidth=requestedWidth; bufferHeight=requestedHeight
        }
        check(EGL14.eglMakeCurrent(display,window,window,eglContext)) { "EGL window binding failed" }
        return true
    }
    private fun <T> onGpu(ignoreFailure: Boolean = false, block: () -> T): T {
        check(!closed.get()) { "Native globe released" }
        check(initialized.await(5,TimeUnit.SECONDS)) { "Native GLES initialization timed out" }
        if (!ignoreFailure) failure?.let { error(it) }
        var result: T? = null
        var cause: Throwable? = null
        val completed = CountDownLatch(1)
        val canceled = AtomicBoolean(false)
        gpu.post {
            try { if (!canceled.get() && !closed.get()) result=block() }
            catch (error: Throwable) { cause=error }
            finally { completed.countDown() }
        }
        if (!completed.await(5,TimeUnit.SECONDS)) { canceled.set(true); error("Native GLES query timed out") }
        cause?.let { throw it }
        @Suppress("UNCHECKED_CAST") return result as T
    }
    override fun onSurfaceTextureAvailable(surface: SurfaceTexture,width: Int,height: Int) {
        if (closed.get()) return
        gpu.post { if (!closed.get()) { texture=surface; if (nativeHandle!=0L) prepareWindow() } }
    }
    override fun onSurfaceTextureSizeChanged(surface: SurfaceTexture,width: Int,height: Int) = Unit
    override fun onSurfaceTextureUpdated(surface: SurfaceTexture) = Unit
    override fun onSurfaceTextureDestroyed(surface: SurfaceTexture): Boolean {
        val accepted = gpu.post {
            if (texture===surface && eglContext!=EGL14.EGL_NO_CONTEXT) {
                EGL14.eglMakeCurrent(display,pbuffer,pbuffer,eglContext)
                if (window!=EGL14.EGL_NO_SURFACE) EGL14.eglDestroySurface(display,window)
                window=EGL14.EGL_NO_SURFACE; texture=null; bufferWidth=0; bufferHeight=0
            }
            surface.release()
        }
        if (!accepted) return true
        return false // The EGL thread releases it after retiring its window.
    }

    inner class Bridge {
        @JavascriptInterface fun send(encoded: String,frame: Boolean): String {
            try {
                check(!closed.get()) { "Native globe released" }; failure?.let { error(it) }
                check(encoded.length<=96*1024*1024) { "GPU batch exceeds limit" }
                val bytes=Base64.decode(encoded,Base64.NO_WRAP)
                if (!frame) onGpu { nativeExecute(nativeHandle,bytes,false) }
                else {
                    check(frameSlots.tryAcquire(5,TimeUnit.SECONDS)) { "GPU frame queue stalled" }
                    val sequence=++submitted
                    gpu.post {
                        try {
                            if (!closed.get()) {
                                val visible=active && prepareWindow()
                                nativeExecute(nativeHandle,bytes,false); rendered=sequence
                                if (visible) {
                                    nativeExecute(nativeHandle,ByteArray(0),true)
                                    check(EGL14.eglSwapBuffers(display,window)) { "Native frame swap failed: ${EGL14.eglGetError()}" }
                                    presented=sequence
                                }
                            }
                        } catch (error: Throwable) { reject(error) }
                        finally { frameSlots.release() }
                    }
                }
                return ""
            } catch (error: Throwable) { reject(error); return failure ?: "GPU submission failed" }
        }
        @JavascriptInterface fun query(kind: Int,id: Int,argument: Int,name: String): String =
            try { onGpu { nativeQuery(nativeHandle,kind,id,argument,name) } }
            catch (error: Throwable) { reject(error); JSONObject().put("error",failure).toString() }
        @JavascriptInterface fun layout(width: Int,height: Int,x: Double,y: Double,canvasWidth: Double,canvasHeight: Double,angle: Double,viewportWidth: Double) {
            if (width<=0 || height<=0 || width>16384 || height>16384) return
            requestedWidth=width; requestedHeight=height
            val generation=++layoutGeneration
            post {
                val view=web ?: return@post
                if (viewportWidth<=0 || canvasWidth<=0 || canvasHeight<=0) return@post
                val ratio=view.width / viewportWidth.toFloat()
                val physicalWidth=(canvasWidth*ratio).toInt().coerceAtLeast(1)
                val physicalHeight=(canvasHeight*ratio).toInt().coerceAtLeast(1)
                layoutParams=FrameLayout.LayoutParams(physicalWidth,physicalHeight)
                translationX=(x*ratio-physicalWidth/2f).toFloat()
                translationY=(y*ratio-physicalHeight/2f).toFloat()
                rotation=angle.toFloat()
                appliedLayoutGeneration=generation
            }
        }
        @JavascriptInterface fun status(): String = JSONObject().put("backend","native-gles3")
            .put("submitted",submitted).put("rendered",rendered).put("presented",presented)
            .put("layout",layoutGeneration).put("appliedLayout",appliedLayoutGeneration)
            .put("error",failure ?: JSONObject.NULL).toString()
        @JavascriptInterface fun reset() {
            onGpu(ignoreFailure = true) {
                check(eglContext!=EGL14.EGL_NO_CONTEXT) { "GLES3 context unavailable" }
                nativeDestroy(nativeHandle); nativeHandle=nativeCreate(); submitted=0; rendered=0; presented=0; failure=null
            }
        }
    }
    override fun close() {
        if (!closed.compareAndSet(false,true)) return
        web?.removeJavascriptInterface("MeewavNativeGl"); web=null
        // This thread stays alive while paused, so destruction executes even
        // after the feature or window has been detached.
        gpu.post {
            try {
                if (eglContext!=EGL14.EGL_NO_CONTEXT) {
                    EGL14.eglMakeCurrent(display,pbuffer,pbuffer,eglContext)
                    if (nativeHandle!=0L) nativeDestroy(nativeHandle)
                    nativeHandle=0
                    if (window!=EGL14.EGL_NO_SURFACE) EGL14.eglDestroySurface(display,window)
                    EGL14.eglDestroySurface(display,pbuffer)
                    EGL14.eglMakeCurrent(display,EGL14.EGL_NO_SURFACE,EGL14.EGL_NO_SURFACE,EGL14.EGL_NO_CONTEXT)
                    EGL14.eglDestroyContext(display,eglContext); EGL14.eglTerminate(display)
                    window=EGL14.EGL_NO_SURFACE; pbuffer=EGL14.EGL_NO_SURFACE
                    eglContext=EGL14.EGL_NO_CONTEXT; display=EGL14.EGL_NO_DISPLAY
                    texture?.release(); texture=null
                }
            } finally { gpuThread.quitSafely() }
        }
    }
    private external fun nativeCreate(): Long
    private external fun nativeDestroy(handle: Long)
    private external fun nativeExecute(handle: Long,bytes: ByteArray,present: Boolean)
    private external fun nativeQuery(handle: Long,kind: Int,id: Int,argument: Int,name: String): String
}
