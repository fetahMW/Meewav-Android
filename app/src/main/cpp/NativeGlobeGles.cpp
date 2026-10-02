// Native GLES3 execution for the globe's existing render graph and GLSL.
// Resource uploads are persistent; a frame crosses JNI once as a binary batch.
#include <jni.h>
#include <GLES3/gl3.h>
#include <android/log.h>
#include <algorithm>
#include <cmath>
#include <cstring>
#include <sstream>
#include <stdexcept>
#include <string>
#include <unordered_map>
#include <vector>

namespace {
struct Globe {
    std::unordered_map<int, GLuint> objects;
    std::unordered_map<int, int> types;
    int width = 1, height = 1;
    GLuint draw = 0, resolved = 0, color = 0, depth = 0, resolveColor = 0;
    GLuint readBinding = 0, drawBinding = 0;
    GLuint presentation = 0, presentationVao = 0;
    bool failed = false;
    uint64_t frames = 0, batches = 0, bytes = 0;
    GLuint object(int id) { return id ? objects.at(id) : 0; }
    void targets(int w, int h) {
        if (w == width && h == height && draw) return;
        GLint savedTexture=0,savedRenderbuffer=0;
        glGetIntegerv(GL_TEXTURE_BINDING_2D,&savedTexture);glGetIntegerv(GL_RENDERBUFFER_BINDING,&savedRenderbuffer);
        width = std::max(1, w); height = std::max(1, h);
        if (draw) { glDeleteFramebuffers(1, &draw); glDeleteFramebuffers(1, &resolved);
            glDeleteRenderbuffers(1, &color); glDeleteRenderbuffers(1, &depth); glDeleteTextures(1, &resolveColor); }
        GLint maxSamples = 0; glGetIntegerv(GL_MAX_SAMPLES, &maxSamples);
        const int samples = std::min(4, maxSamples);
        glGenFramebuffers(1, &draw); glBindFramebuffer(GL_FRAMEBUFFER, draw);
        glGenRenderbuffers(1, &color); glBindRenderbuffer(GL_RENDERBUFFER, color);
        glRenderbufferStorageMultisample(GL_RENDERBUFFER, samples, GL_RGBA8, width, height);
        glFramebufferRenderbuffer(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, GL_RENDERBUFFER, color);
        glGenRenderbuffers(1, &depth); glBindRenderbuffer(GL_RENDERBUFFER, depth);
        glRenderbufferStorageMultisample(GL_RENDERBUFFER, samples, GL_DEPTH24_STENCIL8, width, height);
        glFramebufferRenderbuffer(GL_FRAMEBUFFER, GL_DEPTH_STENCIL_ATTACHMENT, GL_RENDERBUFFER, depth);
        if (glCheckFramebufferStatus(GL_FRAMEBUFFER) != GL_FRAMEBUFFER_COMPLETE) throw std::runtime_error("Native MSAA framebuffer incomplete");
        glGenFramebuffers(1, &resolved); glBindFramebuffer(GL_FRAMEBUFFER, resolved);
        glGenTextures(1, &resolveColor); glBindTexture(GL_TEXTURE_2D, resolveColor);
        glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA8, width, height, 0, GL_RGBA, GL_UNSIGNED_BYTE, nullptr);
        glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_NEAREST);
        glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_NEAREST);
        glFramebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, GL_TEXTURE_2D, resolveColor, 0);
        if (glCheckFramebufferStatus(GL_FRAMEBUFFER) != GL_FRAMEBUFFER_COMPLETE) throw std::runtime_error("Native resolve framebuffer incomplete");
        glBindTexture(GL_TEXTURE_2D, savedTexture); glBindRenderbuffer(GL_RENDERBUFFER, savedRenderbuffer);
        glBindFramebuffer(GL_READ_FRAMEBUFFER, readBinding?object(readBinding):draw);
        glBindFramebuffer(GL_DRAW_FRAMEBUFFER, drawBinding?object(drawBinding):draw);
    }
    void bind(GLenum target, int id) {
        const GLuint native = id ? object(id) : draw;
        glBindFramebuffer(target, native);
        if (target != GL_DRAW_FRAMEBUFFER) readBinding = id;
        if (target != GL_READ_FRAMEBUFFER) drawBinding = id;
    }
    void resolve() {
        const bool scissor=glIsEnabled(GL_SCISSOR_TEST);
        if(scissor)glDisable(GL_SCISSOR_TEST);
        glBindFramebuffer(GL_READ_FRAMEBUFFER, draw);
        glBindFramebuffer(GL_DRAW_FRAMEBUFFER, resolved);
        glBlitFramebuffer(0, 0, width, height, 0, 0, width, height, GL_COLOR_BUFFER_BIT, GL_NEAREST);
        if(scissor)glEnable(GL_SCISSOR_TEST);
    }
    void copySource() {
        if (!readBinding) { resolve(); glBindFramebuffer(GL_READ_FRAMEBUFFER, resolved);
            glBindFramebuffer(GL_DRAW_FRAMEBUFFER, drawBinding ? object(drawBinding) : draw); }
    }
    void restoreRead() { glBindFramebuffer(GL_READ_FRAMEBUFFER, readBinding ? object(readBinding) : draw); }
    void present() {
        const GLenum tests[]={GL_SCISSOR_TEST,GL_DEPTH_TEST,GL_STENCIL_TEST,GL_BLEND,GL_CULL_FACE};GLboolean enabled[5];
        for(int i=0;i<5;i++){enabled[i]=glIsEnabled(tests[i]);glDisable(tests[i]);}
        GLint program=0,vao=0,active=0,texture=0,viewport[4];GLboolean mask[4];
        glGetIntegerv(GL_CURRENT_PROGRAM,&program);glGetIntegerv(GL_VERTEX_ARRAY_BINDING,&vao);glGetIntegerv(GL_ACTIVE_TEXTURE,&active);
        glActiveTexture(GL_TEXTURE0);glGetIntegerv(GL_TEXTURE_BINDING_2D,&texture);glGetIntegerv(GL_VIEWPORT,viewport);glGetBooleanv(GL_COLOR_WRITEMASK,mask);
        resolve(); glBindFramebuffer(GL_READ_FRAMEBUFFER, resolved); glBindFramebuffer(GL_DRAW_FRAMEBUFFER, 0);
        if(!presentation){
            const char* vs="#version 300 es\nprecision highp float;out vec2 uv;void main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);uv=p;gl_Position=vec4(p*2.0-1.0,0.0,1.0);}";
            const char* fs="#version 300 es\nprecision highp float;in vec2 uv;uniform sampler2D image;out vec4 color;void main(){vec4 scene=texture(image,uv);vec2 radii=vec2(0.55,0.52)*sqrt(2.0);float r=length((uv-vec2(0.55,0.52))/radii);vec3 a=vec3(26.,16.,40.)/255.,b=vec3(12.,11.,18.)/255.,c=vec3(8.,9.,13.)/255.;vec3 bg=r<0.47?mix(a,b,r/0.47):mix(b,c,clamp((r-0.47)/0.33,0.,1.));color=vec4(scene.rgb+bg*(1.-scene.a),1.);}";
            GLuint v=glCreateShader(GL_VERTEX_SHADER),f=glCreateShader(GL_FRAGMENT_SHADER);glShaderSource(v,1,&vs,nullptr);glShaderSource(f,1,&fs,nullptr);glCompileShader(v);glCompileShader(f);
            presentation=glCreateProgram();glAttachShader(presentation,v);glAttachShader(presentation,f);glLinkProgram(presentation);glDeleteShader(v);glDeleteShader(f);
            GLint linked=0;glGetProgramiv(presentation,GL_LINK_STATUS,&linked);if(!linked)throw std::runtime_error("Native presentation shader failed");
            glGenVertexArrays(1,&presentationVao);
        }
        glViewport(0,0,width,height);glColorMask(GL_TRUE,GL_TRUE,GL_TRUE,GL_TRUE);glUseProgram(presentation);glBindVertexArray(presentationVao);
        glBindTexture(GL_TEXTURE_2D,resolveColor);glUniform1i(glGetUniformLocation(presentation,"image"),0);glDrawArrays(GL_TRIANGLES,0,3);
        glBindTexture(GL_TEXTURE_2D,texture);glActiveTexture(active);glUseProgram(program);glBindVertexArray(vao);
        glViewport(viewport[0],viewport[1],viewport[2],viewport[3]);glColorMask(mask[0],mask[1],mask[2],mask[3]);
        glBindFramebuffer(GL_READ_FRAMEBUFFER, readBinding ? object(readBinding) : draw);
        glBindFramebuffer(GL_DRAW_FRAMEBUFFER, drawBinding ? object(drawBinding) : draw);
        for(int i=0;i<5;i++)if(enabled[i])glEnable(tests[i]);
        frames++;
    }
    ~Globe() {
        // Reload/context recovery must release resources as well as the normal
        // Three disposal path. Context lifetime is not used as a memory cache.
        for(const auto& entry:objects){const GLuint v=entry.second;switch(types[entry.first]){
            case 1:glDeleteBuffers(1,&v);break;case 2:glDeleteTextures(1,&v);break;case 3:glDeleteFramebuffers(1,&v);break;
            case 4:glDeleteRenderbuffers(1,&v);break;case 5:glDeleteVertexArrays(1,&v);break;case 6:glDeleteProgram(v);break;case 7:glDeleteShader(v);break;
            case 8:glDeleteQueries(1,&v);break;case 9:glDeleteSamplers(1,&v);break;}}
        if (draw) { glDeleteFramebuffers(1, &draw); glDeleteFramebuffers(1, &resolved);
            glDeleteRenderbuffers(1, &color); glDeleteRenderbuffers(1, &depth); glDeleteTextures(1, &resolveColor); }
        if(presentation)glDeleteProgram(presentation);if(presentationVao)glDeleteVertexArrays(1,&presentationVao);
    }
};
std::string quote(const std::string& value) {
    std::string out = "\"";
    for (unsigned char c : value) { if (c == '"' || c == '\\') { out += '\\'; out += char(c); }
        else if (c == '\n') out += "\\n"; else if (c == '\r') out += "\\r";
        else if (c == '\t') out += "\\t"; else if (c >= 32) out += char(c); }
    return out + "\"";
}
void fail(JNIEnv* env, const char* message) { env->ThrowNew(env->FindClass("java/lang/IllegalStateException"), message); }
struct Words {
    const uint8_t* data; size_t size; size_t at = 0;
    uint32_t u() { if (at + 4 > size) throw std::runtime_error("Truncated native globe batch"); uint32_t v; std::memcpy(&v, data + at, 4); at += 4; return v; }
    int i() { return static_cast<int>(u()); }
    float f() { const uint32_t v = u(); float result; std::memcpy(&result, &v, 4); return result; }
    const void* rest() const { return data + at; }
    std::string text() { const size_t n = u(); if (at + n > size) throw std::runtime_error("Truncated native GLSL"); return std::string(reinterpret_cast<const char*>(data + at), n); }
};
void execute(Globe& g, const uint8_t* data, size_t size) {
    Words batch{data, size};
    while (batch.at < size) {
        const uint32_t op = batch.u(), length = batch.u();
        if (length % 4 || batch.at + length > size) throw std::runtime_error("Invalid native globe packet size");
        Words a{data + batch.at, length}; batch.at += length;
        const auto obj = [&]() { return g.object(a.i()); };
        switch (op) {
        case 1: { const int type=a.i(), id=a.i(); GLuint v=0;
            switch(type) { case 1:glGenBuffers(1,&v);break; case 2:glGenTextures(1,&v);break;
                case 3:glGenFramebuffers(1,&v);break; case 4:glGenRenderbuffers(1,&v);break;
                case 5:glGenVertexArrays(1,&v);break; case 6:v=glCreateProgram();break;
                case 7:v=glCreateShader(a.u());break; case 8:glGenQueries(1,&v);break;
                case 9:glGenSamplers(1,&v);break; default:throw std::runtime_error("Unknown GLES object"); }
            g.objects[id]=v;g.types[id]=type; break; }
        case 2: { const int type=a.i(), id=a.i(); const GLuint v=g.object(id);
            switch(type) { case 1:glDeleteBuffers(1,&v);break;case 2:glDeleteTextures(1,&v);break;
                case 3:glDeleteFramebuffers(1,&v);break;case 4:glDeleteRenderbuffers(1,&v);break;
                case 5:glDeleteVertexArrays(1,&v);break;case 6:glDeleteProgram(v);break;case 7:glDeleteShader(v);break;
                case 8:glDeleteQueries(1,&v);break;case 9:glDeleteSamplers(1,&v);break; }
            g.objects.erase(id);g.types.erase(id);break; }
        case 3: { const GLuint shader=obj(); const auto source=a.text(); const char* s=source.c_str(); glShaderSource(shader,1,&s,nullptr);break; }
        case 4:glCompileShader(obj());break;
        case 5:{const GLuint p=obj(),s=obj();glAttachShader(p,s);break;}
        case 6:glLinkProgram(obj());break;
        case 7:glUseProgram(obj());break;
        case 8:{const GLuint p=obj();const GLuint index=a.u();auto name=a.text();glBindAttribLocation(p,index,name.c_str());break;}
        case 9:glBindVertexArray(obj());break;
        case 10:{const GLenum target=a.u();glBindBuffer(target,obj());break;}
        case 11:{const GLenum target=a.u(),usage=a.u();const size_t n=a.u();const bool present=a.u();
            if(present && a.at+n>a.size)throw std::runtime_error("Truncated GPU buffer");
            glBufferData(target,n,present?a.rest():nullptr,usage);break;}
        case 12:{const GLenum target=a.u();const size_t offset=a.u(),n=a.u();if(a.at+n>a.size)throw std::runtime_error("Truncated GPU sub-buffer");glBufferSubData(target,offset,n,a.rest());break;}
        case 13:glEnableVertexAttribArray(a.u());break;
        case 14:glDisableVertexAttribArray(a.u());break;
        case 15:{const GLuint index=a.u();const GLint n=a.i();const GLenum t=a.u();const GLboolean norm=a.u();const int stride=a.i();const uintptr_t offset=a.u();glVertexAttribPointer(index,n,t,norm,stride,reinterpret_cast<void*>(offset));break;}
        case 16:{const GLuint index=a.u();const GLint n=a.i();const GLenum t=a.u();const int stride=a.i();const uintptr_t offset=a.u();glVertexAttribIPointer(index,n,t,stride,reinterpret_cast<void*>(offset));break;}
        case 17:{const GLuint index=a.u(),divisor=a.u();glVertexAttribDivisor(index,divisor);break;}
        case 18:{const GLuint i=a.u();const float x=a.f(),y=a.f(),z=a.f(),w=a.f();glVertexAttrib4f(i,x,y,z,w);break;}
        case 19:{const GLint loc=a.i(),kind=a.i(),n=a.i();if(loc<0)break;
            const auto* f=static_cast<const GLfloat*>(a.rest());const auto* i=static_cast<const GLint*>(a.rest());const auto* u=static_cast<const GLuint*>(a.rest());
            switch(kind) {case 1:glUniform1fv(loc,n,f);break;case 2:glUniform2fv(loc,n,f);break;case 3:glUniform3fv(loc,n,f);break;case 4:glUniform4fv(loc,n,f);break;
                case 5:glUniform1iv(loc,n,i);break;case 6:glUniform2iv(loc,n,i);break;case 7:glUniform3iv(loc,n,i);break;case 8:glUniform4iv(loc,n,i);break;
                case 9:glUniformMatrix2fv(loc,n,GL_FALSE,f);break;case 10:glUniformMatrix3fv(loc,n,GL_FALSE,f);break;case 11:glUniformMatrix4fv(loc,n,GL_FALSE,f);break;
                case 12:glUniform1uiv(loc,n,u);break;case 13:glUniform2uiv(loc,n,u);break;case 14:glUniform3uiv(loc,n,u);break;case 15:glUniform4uiv(loc,n,u);break;}
            break;}
        case 20:glActiveTexture(a.u());break;
        case 21:{const GLenum target=a.u();glBindTexture(target,obj());break;}
        case 22:{const GLenum t=a.u(),p=a.u();const GLint v=a.i();glTexParameteri(t,p,v);break;}
        case 23:{const GLenum t=a.u(),p=a.u();glTexParameterf(t,p,a.f());break;}
        case 24:{const GLenum p=a.u();glPixelStorei(p,a.i());break;}
        case 25:{const GLenum target=a.u();const GLint level=a.i(),internal=a.i(),w=a.i(),h=a.i(),border=a.i();const GLenum format=a.u(),type=a.u();const size_t n=a.u();if(a.at+n>a.size)throw std::runtime_error("Truncated texture");glTexImage2D(target,level,internal,w,h,border,format,type,n?a.rest():nullptr);break;}
        case 26:{const GLenum target=a.u();const GLint level=a.i(),x=a.i(),y=a.i(),w=a.i(),h=a.i();const GLenum format=a.u(),type=a.u();const size_t n=a.u();if(a.at+n>a.size)throw std::runtime_error("Truncated texture update");glTexSubImage2D(target,level,x,y,w,h,format,type,n?a.rest():nullptr);break;}
        case 27:{const GLenum target=a.u();const GLint level=a.i(),internal=a.i(),w=a.i(),h=a.i(),d=a.i(),border=a.i();const GLenum format=a.u(),type=a.u();const size_t n=a.u();if(a.at+n>a.size)throw std::runtime_error("Truncated texture array");glTexImage3D(target,level,internal,w,h,d,border,format,type,n?a.rest():nullptr);break;}
        case 28:{const GLenum target=a.u();const GLint level=a.i(),x=a.i(),y=a.i(),z=a.i(),w=a.i(),h=a.i(),d=a.i();const GLenum format=a.u(),type=a.u();const size_t n=a.u();if(a.at+n>a.size)throw std::runtime_error("Truncated texture array update");glTexSubImage3D(target,level,x,y,z,w,h,d,format,type,n?a.rest():nullptr);break;}
        case 29:{const GLenum t=a.u();const GLint l=a.i();const GLenum internal=a.u();const int w=a.i(),h=a.i();glTexStorage2D(t,l,internal,w,h);break;}
        case 30:{const GLenum t=a.u();const GLint l=a.i();const GLenum internal=a.u();const int w=a.i(),h=a.i(),d=a.i();glTexStorage3D(t,l,internal,w,h,d);break;}
        case 31:glGenerateMipmap(a.u());break;
        case 32:{const GLenum target=a.u();g.bind(target,a.i());break;}
        case 33:{const GLenum t=a.u(),att=a.u(),tt=a.u();const GLuint texture=obj();glFramebufferTexture2D(t,att,tt,texture,a.i());break;}
        case 34:{const GLenum t=a.u(),att=a.u();const GLuint texture=obj();const int level=a.i(),layer=a.i();glFramebufferTextureLayer(t,att,texture,level,layer);break;}
        case 35:{const GLenum t=a.u();glBindRenderbuffer(t,obj());break;}
        case 36:{const GLenum t=a.u(),format=a.u();const int w=a.i(),h=a.i();glRenderbufferStorage(t,format,w,h);break;}
        case 37:{const GLenum t=a.u();const int samples=a.i();const GLenum format=a.u();const int w=a.i(),h=a.i();glRenderbufferStorageMultisample(t,samples,format,w,h);break;}
        case 38:{const GLenum t=a.u(),att=a.u(),rt=a.u();glFramebufferRenderbuffer(t,att,rt,obj());break;}
        case 39:{const int n=a.i();std::vector<GLenum> buffers(n);for(int i=0;i<n;i++){buffers[i]=a.u();if(!g.drawBinding && buffers[i]==GL_BACK)buffers[i]=GL_COLOR_ATTACHMENT0;}glDrawBuffers(n,buffers.data());break;}
        case 40:{GLenum buffer=a.u();if(!g.readBinding && buffer==GL_BACK)buffer=GL_COLOR_ATTACHMENT0;glReadBuffer(buffer);break;}
        case 41:{const int x0=a.i(),y0=a.i(),x1=a.i(),y1=a.i(),dx0=a.i(),dy0=a.i(),dx1=a.i(),dy1=a.i();const GLbitfield mask=a.u();glBlitFramebuffer(x0,y0,x1,y1,dx0,dy0,dx1,dy1,mask,a.u());break;}
        case 42:{const GLenum t=a.u();const int level=a.i(),xoff=a.i(),yoff=a.i(),x=a.i(),y=a.i(),w=a.i(),h=a.i();g.copySource();glCopyTexSubImage2D(t,level,xoff,yoff,x,y,w,h);g.restoreRead();break;}
        case 43:{const GLenum t=a.u();const int level=a.i(),internal=a.i(),x=a.i(),y=a.i(),w=a.i(),h=a.i(),border=a.i();g.copySource();glCopyTexImage2D(t,level,internal,x,y,w,h,border);g.restoreRead();break;}
        case 44:glEnable(a.u());break;
        case 45:glDisable(a.u());break;
        case 46:{const float r=a.f(),b=a.f(),c=a.f(),d=a.f();glClearColor(r,b,c,d);break;}
        case 47:glClearDepthf(a.f());break;
        case 48:glClearStencil(a.i());break;
        case 49:glClear(a.u());break;
        case 50:{const int x=a.i(),y=a.i(),w=a.i(),h=a.i();glViewport(x,y,w,h);break;}
        case 51:{const int x=a.i(),y=a.i(),w=a.i(),h=a.i();glScissor(x,y,w,h);break;}
        case 52:glDepthFunc(a.u());break;
        case 53:glDepthMask(a.u());break;
        case 54:{const int r=a.i(),g=a.i(),b=a.i(),alpha=a.i();glColorMask(r,g,b,alpha);break;}
        case 55:glCullFace(a.u());break;
        case 56:glFrontFace(a.u());break;
        case 57:{const GLenum r=a.u(),alpha=a.u();glBlendEquationSeparate(r,alpha);break;}
        case 58:{const GLenum sr=a.u(),dr=a.u(),sa=a.u(),da=a.u();glBlendFuncSeparate(sr,dr,sa,da);break;}
        case 59:{const float r=a.f(),g=a.f(),b=a.f(),alpha=a.f();glBlendColor(r,g,b,alpha);break;}
        case 60:{const float f=a.f(),u=a.f();glPolygonOffset(f,u);break;}
        case 61:glLineWidth(a.f());break;
        case 62:glStencilMask(a.u());break;
        case 63:{const GLenum func=a.u();const int ref=a.i();glStencilFunc(func,ref,a.u());break;}
        case 64:{const GLenum fail=a.u(),zfail=a.u(),zpass=a.u();glStencilOp(fail,zfail,zpass);break;}
        case 65:{const GLenum mode=a.u();const int first=a.i(),n=a.i();glDrawArrays(mode,first,n);break;}
        case 66:{const GLenum mode=a.u();const int n=a.i();const GLenum type=a.u();glDrawElements(mode,n,type,reinterpret_cast<void*>(uintptr_t(a.u())));break;}
        case 67:{const GLenum mode=a.u();const int first=a.i(),n=a.i(),instances=a.i();glDrawArraysInstanced(mode,first,n,instances);break;}
        case 68:{const GLenum mode=a.u();const int n=a.i();const GLenum type=a.u();const uintptr_t offset=a.u();glDrawElementsInstanced(mode,n,type,reinterpret_cast<void*>(offset),a.i());break;}
        case 69:{const GLenum t=a.u(),fmt=a.u();const int level=a.i(),w=a.i(),h=a.i(),border=a.i(),n=a.i();glCompressedTexImage2D(t,level,fmt,w,h,border,n,a.rest());break;}
        case 70:{const GLenum t=a.u();const int level=a.i(),x=a.i(),y=a.i(),w=a.i(),h=a.i();const GLenum fmt=a.u();const int n=a.i();glCompressedTexSubImage2D(t,level,x,y,w,h,fmt,n,a.rest());break;}
        case 71:glFlush();break;
        case 72:{const GLenum buffer=a.u();const int draw=a.i();glClearBufferfv(buffer,draw,static_cast<const float*>(a.rest()));break;}
        case 73:{const GLenum buffer=a.u();const int draw=a.i();glClearBufferiv(buffer,draw,static_cast<const int*>(a.rest()));break;}
        case 74:{const GLenum buffer=a.u();const int draw=a.i();const float depth=a.f();glClearBufferfi(buffer,draw,depth,a.i());break;}
        case 75:{const int w=a.i(),h=a.i();g.targets(w,h);break;}
        case 76:{const GLenum t=a.u(),rt=a.u();const intptr_t ro=a.u(),wo=a.u(),n=a.u();glCopyBufferSubData(t,rt,ro,wo,n);break;}
        case 77:{const GLenum t=a.u();const int n=a.i();std::vector<GLenum> attachments(n);for(int i=0;i<n;i++){attachments[i]=a.u();if((t==GL_READ_FRAMEBUFFER?!g.readBinding:!g.drawBinding)){if(attachments[i]==GL_COLOR)attachments[i]=GL_COLOR_ATTACHMENT0;if(attachments[i]==GL_DEPTH)attachments[i]=GL_DEPTH_ATTACHMENT;if(attachments[i]==GL_STENCIL)attachments[i]=GL_STENCIL_ATTACHMENT;}}glInvalidateFramebuffer(t,n,attachments.data());break;}
        default: throw std::runtime_error("Unsupported native globe opcode " + std::to_string(op));
        }
    }
    g.batches++; g.bytes += size;
    const GLenum error=glGetError();if(error!=GL_NO_ERROR)throw std::runtime_error("Native GLES error "+std::to_string(error)+" in batch "+std::to_string(g.batches));
}
std::string query(Globe& g, int kind, int id, int argument, const std::string& name) {
    GLint value = 0;
    switch(kind) {
    case 1: {
        if(argument==GL_VERSION) return quote("WebGL 2.0 (native GLES3)");
        if(argument==GL_SHADING_LANGUAGE_VERSION) return quote("WebGL GLSL ES 3.00 (native GLES3)");
        if(argument==GL_VENDOR || argument==GL_RENDERER) { const auto s=glGetString(argument);return quote(s?reinterpret_cast<const char*>(s):""); }
        if(argument==GL_ALIASED_LINE_WIDTH_RANGE || argument==GL_ALIASED_POINT_SIZE_RANGE) { GLfloat v[2];glGetFloatv(argument,v);return "["+std::to_string(v[0])+","+std::to_string(v[1])+"]"; }
        if(argument==GL_MAX_VIEWPORT_DIMS) { GLint v[2];glGetIntegerv(argument,v);return "["+std::to_string(v[0])+","+std::to_string(v[1])+"]"; }
        if(argument==GL_VIEWPORT || argument==GL_SCISSOR_BOX) { GLint v[4];glGetIntegerv(argument,v);return "["+std::to_string(v[0])+","+std::to_string(v[1])+","+std::to_string(v[2])+","+std::to_string(v[3])+"]"; }
        if(argument==GL_COLOR_CLEAR_VALUE) { GLfloat v[4];glGetFloatv(argument,v);return "["+std::to_string(v[0])+","+std::to_string(v[1])+","+std::to_string(v[2])+","+std::to_string(v[3])+"]"; }
        if(argument==GL_COMPRESSED_TEXTURE_FORMATS) { GLint n=0;glGetIntegerv(GL_NUM_COMPRESSED_TEXTURE_FORMATS,&n);std::vector<GLint> v(n);glGetIntegerv(argument,v.data());std::string out="[";for(int i=0;i<n;i++){if(i)out+=",";out+=std::to_string(v[i]);}return out+"]"; }
        glGetIntegerv(argument,&value);return std::to_string(value);
    }
    case 2: glGetShaderiv(g.object(id),argument,&value);return std::to_string(value);
    case 3: glGetProgramiv(g.object(id),argument,&value);return std::to_string(value);
    case 4: { glGetShaderiv(g.object(id),GL_INFO_LOG_LENGTH,&value);std::string log(std::max(1,value),'\0');glGetShaderInfoLog(g.object(id),log.size(),&value,log.data());log.resize(value);return quote(log); }
    case 5: { glGetProgramiv(g.object(id),GL_INFO_LOG_LENGTH,&value);std::string log(std::max(1,value),'\0');glGetProgramInfoLog(g.object(id),log.size(),&value,log.data());log.resize(value);return quote(log); }
    case 6: case 7: { glGetProgramiv(g.object(id),kind==6?GL_ACTIVE_UNIFORM_MAX_LENGTH:GL_ACTIVE_ATTRIBUTE_MAX_LENGTH,&value);
        std::string n(std::max(1,value),'\0');GLsizei len=0;GLint size=0;GLenum type=0;
        if(kind==6)glGetActiveUniform(g.object(id),argument,n.size(),&len,&size,&type,n.data());else glGetActiveAttrib(g.object(id),argument,n.size(),&len,&size,&type,n.data());
        n.resize(len);return "{\"name\":"+quote(n)+",\"size\":"+std::to_string(size)+",\"type\":"+std::to_string(type)+"}"; }
    case 8: return std::to_string(glGetUniformLocation(g.object(id),name.c_str()));
    case 9: return std::to_string(glGetAttribLocation(g.object(id),name.c_str()));
    case 10: { GLint range[2],p;glGetShaderPrecisionFormat(id,argument,range,&p);return "{\"rangeMin\":"+std::to_string(range[0])+",\"rangeMax\":"+std::to_string(range[1])+",\"precision\":"+std::to_string(p)+"}"; }
    case 11: { GLint n=0;glGetIntegerv(GL_NUM_EXTENSIONS,&n);std::string out="[";for(int i=0;i<n;i++){if(i)out+=",";out+=quote(reinterpret_cast<const char*>(glGetStringi(GL_EXTENSIONS,i)));}return out+"]"; }
    case 12: return std::to_string(glGetError());
    case 13: return std::to_string(glCheckFramebufferStatus(argument));
    case 14: {int programs=0,textures=0,buffers=0;for(const auto& entry:g.types){programs+=entry.second==6;textures+=entry.second==2;buffers+=entry.second==1;}
        return "{\"frames\":"+std::to_string(g.frames)+",\"batches\":"+std::to_string(g.batches)+",\"bytes\":"+std::to_string(g.bytes)+",\"programs\":"+std::to_string(programs)+",\"textures\":"+std::to_string(textures)+",\"buffers\":"+std::to_string(buffers)+"}";}
    default: throw std::runtime_error("Unsupported native globe query");
    }
}
}
extern "C" JNIEXPORT jlong JNICALL Java_com_meewav_android_features_globe_NativeGlobeSurface_nativeCreate(JNIEnv* env,jobject) {
    try { auto* g=new Globe();g->targets(1,1);return reinterpret_cast<jlong>(g); }catch(const std::exception& e){fail(env,e.what());return 0;}
}
extern "C" JNIEXPORT void JNICALL Java_com_meewav_android_features_globe_NativeGlobeSurface_nativeDestroy(JNIEnv*,jobject,jlong handle) { delete reinterpret_cast<Globe*>(handle); }
extern "C" JNIEXPORT void JNICALL Java_com_meewav_android_features_globe_NativeGlobeSurface_nativeExecute(JNIEnv* env,jobject,jlong handle,jbyteArray bytes,jboolean present) {
    if(!handle)return;auto* g=reinterpret_cast<Globe*>(handle);
    const auto n=env->GetArrayLength(bytes);auto* p=n?env->GetByteArrayElements(bytes,nullptr):nullptr;
    if(n && !p)return;
    try { execute(*g,reinterpret_cast<uint8_t*>(p),n); if(present)g->present(); }
    catch(const std::exception& e){g->failed=true;fail(env,e.what());}
    if(p)env->ReleaseByteArrayElements(bytes,p,JNI_ABORT);
}
extern "C" JNIEXPORT jstring JNICALL Java_com_meewav_android_features_globe_NativeGlobeSurface_nativeQuery(JNIEnv* env,jobject,jlong handle,jint kind,jint id,jint argument,jstring name) {
    if(!handle)return env->NewStringUTF("null");const char* p=env->GetStringUTFChars(name,nullptr);std::string n(p);env->ReleaseStringUTFChars(name,p);
    try { return env->NewStringUTF(query(*reinterpret_cast<Globe*>(handle),kind,id,argument,n).c_str()); }
    catch(const std::exception& e){fail(env,e.what());return nullptr;}
}
