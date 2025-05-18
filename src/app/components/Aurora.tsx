'use client';

import { useEffect, useRef } from 'react';
import { Renderer, Program, Mesh, Color, Triangle } from 'ogl';
import './Aurora.css';

/* =====================  GLSL  ===================== */
const VERT = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

/* ---- 完整 Fragment Shader（與你最初提供版本一致） ---- */
const FRAG = `#version 300 es
precision highp float;

uniform float uTime;
uniform float uAmplitude;
uniform vec3  uColorStops[3];
uniform vec2  uResolution;
uniform float uBlend;

out vec4 fragColor;

/* --- noise 與輔助函式...（略）--- */
/* 這裡貼回你原本的 snoise、permute、COLOR_RAMP 等完整程式碼 */

vec3 permute(vec3 x) {
  return mod(((x * 34.0) + 1.0) * x, 289.0);
}
float snoise(vec2 v){
  const vec4 C = vec4(
      0.211324865405187, 0.366025403784439,
      -0.577350269189626, 0.024390243902439
  );
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);

  vec3 p = permute(
      permute(i.y + vec3(0.0, i1.y, 1.0))
    + i.x + vec3(0.0, i1.x, 1.0)
  );

  vec3 m = max(
      0.5 - vec3(
          dot(x0, x0),
          dot(x12.xy, x12.xy),
          dot(x12.zw, x12.zw)
      ), 
      0.0
  );
  m = m * m;
  m = m * m;

  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);

  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

struct ColorStop {
  vec3  color;
  float position;
};

#define COLOR_RAMP(colors, factor, finalColor) {                    \
  int index = 0;                                                    \
  for (int i = 0; i < 2; i++) {                                     \
     ColorStop currentColor = colors[i];                            \
     bool isInBetween = currentColor.position <= factor;            \
     index = int(mix(float(index), float(i), float(isInBetween)));  \
  }                                                                 \
  ColorStop currentColor = colors[index];                           \
  ColorStop nextColor    = colors[index + 1];                       \
  float range      = nextColor.position - currentColor.position;    \
  float lerpFactor = (factor - currentColor.position) / range;      \
  finalColor = mix(currentColor.color, nextColor.color, lerpFactor);\
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  
  ColorStop colors[3];
  colors[0] = ColorStop(uColorStops[0], 0.0);
  colors[1] = ColorStop(uColorStops[1], 0.5);
  colors[2] = ColorStop(uColorStops[2], 1.0);
  
  vec3 rampColor;
  COLOR_RAMP(colors, uv.x, rampColor);
  
  float height = snoise(vec2(uv.x * 2.0 + uTime * 0.1, uTime * 0.25)) * 0.5 * uAmplitude;
  height = exp(height);
  height = (uv.y * 2.0 - height + 0.2);
  float intensity = 0.6 * height;
  intensity = max(intensity, 0.0);
  
  float midPoint    = 0.20;
  float auroraAlpha = smoothstep(midPoint - uBlend * 0.5, midPoint + uBlend * 0.5, intensity);
  
  vec3 minLight    = vec3(0.80);
  vec3 auroraColor = mix(minLight, rampColor, intensity);
  
  fragColor = vec4(auroraColor * auroraAlpha, auroraAlpha);
}
`;

/* ==================  React ================== */
interface AuroraProps {
  colorStops?: string[];
  amplitude?: number;
  blend?: number;
  time?: number;
  speed?: number;
}

export default function Aurora({
  colorStops = ['#00d8ff', '#7cff67', '#00d8ff'],
  amplitude = 1,
  blend = 0.5,
  time,
  speed = 1,
}: AuroraProps) {
  /* 保存最新 props 供動畫讀取 */
  const latest = useRef<AuroraProps>({
    colorStops,
    amplitude,
    blend,
    time,
    speed,
  });
  latest.current = { colorStops, amplitude, blend, time, speed };

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    /* ---------- Renderer ---------- */
    const renderer = new Renderer({ alpha: true, premultipliedAlpha: true, antialias: true });
    const { gl } = renderer;
    gl.clearColor(0, 0, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    /* ---------- Geometry ---------- */
    const geometry = new Triangle(gl);
    delete (geometry.attributes as Record<string, unknown>).uv; // 刪除不用的 uv

    /* ---------- Uniform helpers ---------- */
    const toRGB = (hex: string) => {
      const c = new Color(hex);
      return [c.r, c.g, c.b];
    };

    const program = new Program(gl, {
      vertex: VERT,
      fragment: FRAG,
      uniforms: {
        uTime:        { value: 0 },
        uAmplitude:   { value: amplitude },
        uBlend:       { value: blend },
        uColorStops:  { value: colorStops.map(toRGB) },
        uResolution:  { value: [container.offsetWidth, container.offsetHeight] },
      },
    });

    /* ---------- Resize ---------- */
    const resize = () => {
      const w = container.offsetWidth;
      const h = container.offsetHeight;
      renderer.setSize(w, h);
      program.uniforms.uResolution.value = [w, h];
    };
    window.addEventListener('resize', resize);
    resize();

    /* ---------- Mesh & mount ---------- */
    const mesh = new Mesh(gl, { geometry, program });
    container.appendChild(gl.canvas);

    /* ---------- Animation loop ---------- */
    let raf = 0;
    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);

      const { time: tm = t * 0.01, speed: sp = 1, amplitude: amp = 1, blend: bl = 0.5, colorStops: cs } =
        latest.current;

      program.uniforms.uTime.value       = tm * sp * 0.1;
      program.uniforms.uAmplitude.value  = amp;
      program.uniforms.uBlend.value      = bl;
      program.uniforms.uColorStops.value = cs?.map(toRGB);

      renderer.render({ scene: mesh });
    };
    raf = requestAnimationFrame(loop);

    /* ---------- Cleanup ---------- */
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      if (gl.canvas.parentNode === container) container.removeChild(gl.canvas);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, []); // 初始化一次即可

  return <div ref={containerRef} className="aurora-container" />;
}
