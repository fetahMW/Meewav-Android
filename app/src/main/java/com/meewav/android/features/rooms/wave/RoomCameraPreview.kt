package com.meewav.android.features.rooms.wave

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Matrix
import android.graphics.SurfaceTexture
import android.hardware.camera2.*
import android.os.Handler
import android.os.Looper
import android.view.Surface
import android.view.TextureView
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.lifecycle.*
import androidx.lifecycle.compose.LocalLifecycleOwner

@Composable
internal fun RoomCameraPreview(front: Boolean) {
    val lifecycle = LocalLifecycleOwner.current.lifecycle
    var error by remember { mutableStateOf<String?>(null) }
    var view by remember { mutableStateOf<RoomCameraView?>(null) }
    DisposableEffect(lifecycle, view) {
        val observer = LifecycleEventObserver { _, event ->
            if (event == Lifecycle.Event.ON_RESUME) view?.resume()
            if (event == Lifecycle.Event.ON_PAUSE) view?.pause()
        }
        lifecycle.addObserver(observer)
        onDispose { lifecycle.removeObserver(observer) }
    }
    Box(Modifier.fillMaxSize().background(Color.Black), contentAlignment = Alignment.Center) {
        AndroidView(factory = { context -> RoomCameraView(context) { error = it }.also {
            it.front = front; view = it
        } }, update = { it.switchTo(front) }, onRelease = { it.pause() }, modifier = Modifier.fillMaxSize())
        error?.let { Text(it, color = Color.LightGray, fontSize = 12.sp) }
    }
}

@SuppressLint("MissingPermission")
private class RoomCameraView(context: Context, val report: (String?) -> Unit) : TextureView(context), TextureView.SurfaceTextureListener {
    var front = true
    private var paused = false
    private var generation = 0
    private var camera: CameraDevice? = null
    private var session: CameraCaptureSession? = null
    private var output: Surface? = null
    private val main = Handler(Looper.getMainLooper())
    init { surfaceTextureListener = this }
    fun switchTo(value: Boolean) { if (value != front) { pause(); front = value; resume() } }
    fun resume() { paused = false; if (isAvailable && camera == null) open() }
    fun pause() { paused = true; generation++; session?.close(); session = null; camera?.close(); camera = null; output?.release(); output = null }
    override fun onSurfaceTextureAvailable(texture: SurfaceTexture, width: Int, height: Int) { resume() }
    override fun onSurfaceTextureSizeChanged(texture: SurfaceTexture, width: Int, height: Int) { pause(); resume() }
    override fun onSurfaceTextureDestroyed(texture: SurfaceTexture): Boolean { pause(); return true }
    override fun onSurfaceTextureUpdated(texture: SurfaceTexture) = Unit
    private fun open() {
        if (paused || !isAvailable) return
        val ticket = ++generation
        try {
            val manager = context.getSystemService(CameraManager::class.java)
            val facing = if (front) CameraCharacteristics.LENS_FACING_FRONT else CameraCharacteristics.LENS_FACING_BACK
            val id = manager.cameraIdList.firstOrNull { manager.getCameraCharacteristics(it).get(CameraCharacteristics.LENS_FACING) == facing }
            if (id == null) { report("Caméra indisponible"); return }
            val info = manager.getCameraCharacteristics(id)
            val sizes = info.get(CameraCharacteristics.SCALER_STREAM_CONFIGURATION_MAP)?.getOutputSizes(SurfaceTexture::class.java).orEmpty()
            val size = sizes.filter { it.width in 640..1280 }.minByOrNull { kotlin.math.abs(it.width.toFloat() / it.height - 16f / 9f) }
                ?: sizes.firstOrNull() ?: return
            surfaceTexture?.setDefaultBufferSize(size.width, size.height)
            val sensor = info.get(CameraCharacteristics.SENSOR_ORIENTATION) ?: 90
            val rotation = when (display?.rotation) { Surface.ROTATION_90 -> 90; Surface.ROTATION_180 -> 180; Surface.ROTATION_270 -> 270; else -> 0 }
            val angle = if (front) (sensor + rotation) % 360 else (sensor - rotation + 360) % 360
            // Map normalized texture corners into a centered, aspect-preserving preview.
            val swapped = angle == 90 || angle == 270
            val sourceW = if (swapped) size.height.toFloat() else size.width.toFloat()
            val sourceH = if (swapped) size.width.toFloat() else size.height.toFloat()
            val fit = minOf(width / sourceW, height / sourceH)
            val matrix = Matrix().apply {
                setScale(size.width.toFloat() / width, size.height.toFloat() / height, width / 2f, height / 2f)
                postRotate(angle.toFloat(), width / 2f, height / 2f)
                postScale(fit * if (front) -1f else fit, fit, width / 2f, height / 2f)
            }
            setTransform(matrix)
            manager.openCamera(id, object : CameraDevice.StateCallback() {
                override fun onOpened(device: CameraDevice) {
                    if (paused || ticket != generation || !isAvailable) { device.close(); return }
                    camera = device
                    val surface = Surface(surfaceTexture).also { output = it }
                    try {
                        @Suppress("DEPRECATION")
                        device.createCaptureSession(listOf(surface), object : CameraCaptureSession.StateCallback() {
                            override fun onConfigured(value: CameraCaptureSession) {
                                if (paused || ticket != generation) { value.close(); return }
                                session = value
                                try {
                                    val request = device.createCaptureRequest(CameraDevice.TEMPLATE_PREVIEW).apply {
                                        addTarget(surface); set(CaptureRequest.CONTROL_AF_MODE, CaptureRequest.CONTROL_AF_MODE_CONTINUOUS_VIDEO)
                                    }.build()
                                    value.setRepeatingRequest(request, null, main); report(null)
                                } catch (_: Exception) { pause(); report("Caméra indisponible · réessaie") }
                            }
                            override fun onConfigureFailed(value: CameraCaptureSession) { value.close(); pause(); report("Impossible d’afficher la caméra") }
                        }, main)
                    } catch (_: Exception) { pause(); report("Caméra indisponible · réessaie") }
                }
                override fun onDisconnected(device: CameraDevice) { device.close(); if (ticket == generation) { pause(); report("Caméra déconnectée") } }
                override fun onError(device: CameraDevice, error: Int) { device.close(); if (ticket == generation) { pause(); report("Caméra occupée ou indisponible") } }
            }, main)
        } catch (_: Exception) { report("Autorise la caméra ou réessaie") }
    }
}
