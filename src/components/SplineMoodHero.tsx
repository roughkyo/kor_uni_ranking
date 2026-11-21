import * as React from "react"
import * as THREE from "three"
import { motion, useReducedMotion } from "framer-motion"
import { ArrowDown, Moon, Sun } from "lucide-react"
import { cn } from "@/lib/utils"
import type { CompareMode, DisclosureStatus } from "@/types/ranking"
import { formatKst } from "@/types/ranking"

export type ThemeMode = "dark" | "light"

interface SplineMoodHeroProps {
  mode: CompareMode
  onModeChange: (mode: CompareMode) => void
  theme: ThemeMode
  onToggleTheme: () => void
  latestYear: number
  schoolCount: number
  yearRange: string
  status: DisclosureStatus | null
}

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`

// Retrofuturism diagonal fluted glass + interactive optical magnifier lens &
// chromatic spectrum hover shift, supporting smooth dark <-> light theme morphing.
const FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform vec2 uRes;
  uniform vec2 uMouse;
  uniform float uHover;
  uniform float uSpeed;
  uniform float uMode;
  uniform float uLight;

  float hash12(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }

  vec3 spectrum(float phase) {
    vec3 a = vec3(0.55, 0.52, 0.62);
    vec3 b = vec3(0.45, 0.44, 0.42);
    vec3 c = vec3(1.0, 1.0, 1.0);
    vec3 d = vec3(0.05, 0.34, 0.68);
    return a + b * cos(6.28318 * (c * phase + d));
  }

  vec3 evalSunsetField(vec2 uvRot, vec2 orbPos, float t, float modeMix) {
    vec2 d = uvRot - orbPos;
    float dist = length(d * vec2(1.18, 1.12));
    float intensity = exp(-dist * dist * 7.8) * 1.32 + exp(-dist * 4.2) * 0.16;

    float grad = clamp((d.x * 1.95 + 0.48) + 0.14 * sin(t * 0.3), 0.0, 1.0);

    vec3 crimsonA   = vec3(0.58, 0.03, 0.03);
    vec3 scarletA   = vec3(0.86, 0.17, 0.08);
    vec3 tangerineA = vec3(0.98, 0.43, 0.11);
    vec3 amberA     = vec3(1.00, 0.74, 0.34);

    vec3 crimsonB   = vec3(0.06, 0.20, 0.44);
    vec3 scarletB   = vec3(0.08, 0.48, 0.66);
    vec3 tangerineB = vec3(0.18, 0.76, 0.74);
    vec3 amberB     = vec3(0.68, 0.95, 0.88);

    vec3 c1 = mix(crimsonA, crimsonB, modeMix * 0.75);
    vec3 c2 = mix(scarletA, scarletB, modeMix * 0.75);
    vec3 c3 = mix(tangerineA, tangerineB, modeMix * 0.75);
    vec3 c4 = mix(amberA, amberB, modeMix * 0.75);

    vec3 hue = mix(c1, c2, smoothstep(0.0, 0.38, grad));
    hue = mix(hue, c3, smoothstep(0.32, 0.72, grad));
    hue = mix(hue, c4, smoothstep(0.65, 1.0, grad));

    return hue * intensity;
  }

  vec3 evalCursorField(vec2 uvRot, vec2 mouseRot, vec2 mouseUv, float t, float hover) {
    if (hover <= 0.001) return vec3(0.0);
    vec2 dm = uvRot - mouseRot;
    float md = length(dm);
    float spot = exp(-md * md * 11.5) * 1.35 + exp(-md * 4.8) * 0.25;

    float phase = mouseUv.x * 0.95 + mouseUv.y * 0.42 + t * 0.08 + dm.x * 0.65;
    vec3 colA = spectrum(phase);
    vec3 colB = spectrum(phase + 0.18);
    vec3 col = mix(colA, colB, smoothstep(-0.25, 0.25, dm.y));

    return col * spot * hover * 1.15;
  }

  vec3 sampleGlassScene(vec2 p, float aspect, vec2 mouseP, vec2 mouseUv, float t, float hover, float modeMix, float lightMix, float chromaBoost, out float outLight) {
    float anchorX = aspect > 1.05 ? 0.16 * aspect : 0.04;
    vec2 q = p - vec2(anchorX, 0.04);

    const float cs = 0.70710678;
    vec2 rot = vec2(q.x * cs + q.y * cs, -q.x * cs + q.y * cs);

    float slatW = 0.118;
    float slatPos = rot.x / slatW;
    float slatIdx = floor(slatPos);
    float f = fract(slatPos);

    vec2 mouseOff = (mouseUv - 0.5) * vec2(0.12, 0.09) * hover;
    vec2 orbWorld = vec2(
      0.06 + sin(t * 0.42) * 0.13 + cos(t * 0.23) * 0.05,
      0.04 + cos(t * 0.34) * 0.11 + sin(t * 0.19) * 0.04
    ) + mouseOff;
    vec2 orbRot = vec2(orbWorld.x * cs + orbWorld.y * cs, -orbWorld.x * cs + orbWorld.y * cs);

    vec2 mQ = mouseP - vec2(anchorX, 0.04);
    vec2 mouseRot = vec2(mQ.x * cs + mQ.y * cs, -mQ.x * cs + mQ.y * cs);

    float barCenterU = (slatIdx + 0.5) * slatW;
    float lensCurve = (f - 0.5) * 2.0;
    float refractU = barCenterU + lensCurve * slatW * 0.24 - pow(max(0.0, f), 2.2) * slatW * 0.52;
    float refractV = rot.y * (1.0 - 0.08 * (1.0 - lensCurve * lensCurve)) + (f - 0.5) * 0.032;

    float disp = 0.008 + chromaBoost * 0.016;

    vec2 uvR = vec2(refractU + disp, refractV);
    vec2 uvG = vec2(refractU,        refractV);
    vec2 uvB = vec2(refractU - disp, refractV);

    vec3 sunR = evalSunsetField(uvR, orbRot, t, modeMix);
    vec3 sunG = evalSunsetField(uvG, orbRot, t, modeMix);
    vec3 sunB = evalSunsetField(uvB, orbRot, t, modeMix);
    vec3 sunRefracted = vec3(sunR.r, sunG.g, sunB.b);

    vec3 curR = evalCursorField(uvR, mouseRot, mouseUv, t, hover);
    vec3 curG = evalCursorField(uvG, mouseRot, mouseUv, t, hover);
    vec3 curB = evalCursorField(uvB, mouseRot, mouseUv, t, hover);
    vec3 curRefracted = vec3(curR.r, curG.g, curB.b);

    float curProx = exp(-length(rot - mouseRot) * 4.4) * hover;
    vec3 refracted = mix(sunRefracted, sunRefracted * 0.35 + curRefracted * 1.15, clamp(curProx * 1.15, 0.0, 0.92));

    float softLeft = smoothstep(0.015, 0.24, f);
    float sharpRight = 1.0 - smoothstep(0.972, 0.996, f);
    float barMask = softLeft * sharpRight;

    float bodyShade = mix(0.46, 1.08, pow(f, 0.72));
    float bevelRim = exp(-pow((f - 0.945) / 0.042, 2.0)) * (0.85 + curProx * 0.55);
    float microHighlight = exp(-pow((f - 0.968) / 0.014, 2.0)) * (0.55 + curProx * 0.65);

    float sunAlong = exp(-pow((rot.y - orbRot.y * 0.72) / 0.38, 2.0));
    float curAlong = exp(-pow((rot.y - mouseRot.y) / 0.34, 2.0)) * hover;
    float alongFade = max(sunAlong, curAlong);

    float totalLight = length(refracted);
    outLight = totalLight;

    vec3 darkGlass = refracted * bodyShade * barMask * (0.2 + 0.8 * alongFade);
    vec3 rimTint = mix(refracted * 1.5, vec3(1.0, 0.96, 0.92), 0.45);
    darkGlass += rimTint * (bevelRim + microHighlight) * sharpRight * smoothstep(0.04, 0.34, totalLight) * alongFade;
    darkGlass += (evalSunsetField(rot, orbRot, t, modeMix) + evalCursorField(rot, mouseRot, mouseUv, t, hover) * 0.65) * 0.035 * alongFade;

    // In light mode: warm alabaster paper canvas with luminous coral/amber/teal frosted glass ribs
    vec3 lightPaper = vec3(0.962, 0.959, 0.945);
    float barPresence = clamp(totalLight * 0.72, 0.0, 1.0) * (0.2 + 0.8 * alongFade);
    vec3 lightTint = mix(vec3(0.94, 0.48, 0.28), normalize(refracted + 0.001) * 0.95, 0.78);
    vec3 lightGlass = mix(lightPaper, lightTint, barPresence * barMask * 0.72 * mix(0.65, 1.0, f));
    // Crisp white specular edge on sunlit glass bars + soft architectural groove shadow
    lightGlass += vec3(1.0) * (bevelRim * 0.45 + microHighlight * 0.35) * barPresence;
    lightGlass -= vec3(0.11, 0.09, 0.08) * (1.0 - sharpRight) * barPresence * 0.85;

    return mix(vec3(0.043, 0.043, 0.046) + darkGlass, lightGlass, lightMix);
  }

  void main() {
    float aspect = uRes.x / max(uRes.y, 1.0);
    vec2 p = (vUv - 0.5) * vec2(aspect, 1.0);
    vec2 mouseP = (uMouse - 0.5) * vec2(aspect, 1.0);

    vec2 dLens = p - mouseP;
    float distLens = length(dLens);
    float lensRadius = 0.25;
    float normR = clamp(distLens / lensRadius, 0.0, 1.0);

    float inside = smoothstep(1.0, 0.0, normR) * uHover;
    float pinch = 1.0 - inside * (0.30 + uSpeed * 0.08) * (1.0 - normR * normR * 0.45);
    vec2 lensP = mouseP + dLens * pinch;

    float rimZone = exp(-pow((normR - 0.88) / 0.14, 2.0)) * uHover;
    vec2 radialDir = distLens > 0.0001 ? dLens / distLens : vec2(0.0);
    float lensSplit = (0.0045 + uSpeed * 0.004) * rimZone;

    float lightVal = 0.0;
    float tmpL = 0.0;
    vec3 color;
    if (rimZone > 0.01) {
      vec3 cR = sampleGlassScene(lensP + radialDir * lensSplit, aspect, mouseP, uMouse, uTime, uHover, uMode, uLight, inside + rimZone, lightVal);
      vec3 cG = sampleGlassScene(lensP,                         aspect, mouseP, uMouse, uTime, uHover, uMode, uLight, inside,           tmpL);
      vec3 cB = sampleGlassScene(lensP - radialDir * lensSplit, aspect, mouseP, uMouse, uTime, uHover, uMode, uLight, inside + rimZone, tmpL);
      color = vec3(cR.r, cG.g, cB.b);
      lightVal = max(lightVal, tmpL);
    } else {
      color = sampleGlassScene(lensP, aspect, mouseP, uMouse, uTime, uHover, uMode, uLight, inside, lightVal);
    }

    float ringSharp = exp(-pow((normR - 0.985) / 0.022, 2.0)) * uHover;
    float ringSoft  = exp(-pow((normR - 0.96) / 0.09, 2.0)) * uHover;
    vec3 lensHue = spectrum(uMouse.x * 0.95 + uMouse.y * 0.42 + uTime * 0.08);
    float rimGlint = pow(max(0.0, dot(radialDir, normalize(vec2(-0.65, 0.75)))), 3.0);

    vec3 darkRimOverlay =
      mix(lensHue, vec3(1.0), 0.55) * ringSharp * (0.28 + 0.55 * rimGlint) +
      lensHue * ringSoft * 0.09;
    vec3 lightRimOverlay =
      mix(lensHue * 0.7, vec3(0.15), 0.4) * ringSharp * 0.35;

    vec2 gridUv = fract(lensP * 14.0);
    float dotGrid = smoothstep(0.12, 0.03, length(gridUv - 0.5));
    vec3 darkGrid = mix(lensHue, vec3(1.0), 0.35) * dotGrid * inside * 0.14;
    vec3 lightGrid = -vec3(0.14) * dotGrid * inside * 0.65;

    color += mix(darkRimOverlay + darkGrid, -lightRimOverlay + lightGrid, uLight);

    // Filmic tone mapping mainly for dark HDR highlights
    vec3 mappedDark = color / (1.0 + max(color, 0.0) * 0.40);
    mappedDark = pow(max(mappedDark, 0.0), vec3(0.96));
    color = mix(mappedDark, clamp(color, 0.0, 1.0), uLight);

    float g1 = hash12(gl_FragCoord.xy + fract(uTime * 0.07) * 100.0);
    float g2 = hash12(gl_FragCoord.xy * 0.5 + 17.3);
    float grainAmp = mix(0.074, 0.036, uLight);
    float grain = ((g1 * 0.72 + g2 * 0.28) - 0.5) * grainAmp;
    color += grain * (0.75 + 0.45 * clamp(lightVal + inside * 0.4, 0.0, 1.0));

    float vig = 1.0 - dot((vUv - 0.5) * 1.05, (vUv - 0.5) * 1.05) * mix(0.35, 0.08, uLight);
    color *= clamp(vig, 0.65, 1.0);

    gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
  }
`

export function SplineMoodHero({
  mode,
  onModeChange,
  theme,
  onToggleTheme,
  latestYear,
  schoolCount,
  yearRange,
  status,
}: SplineMoodHeroProps) {
  const sectionRef = React.useRef<HTMLElement>(null)
  const mountRef = React.useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const modeTargetRef = React.useRef(mode === "combined" ? 0 : 1)
  const lightTargetRef = React.useRef(theme === "light" ? 1 : 0)

  React.useEffect(() => {
    modeTargetRef.current = mode === "combined" ? 0 : 1
  }, [mode])

  React.useEffect(() => {
    lightTargetRef.current = theme === "light" ? 1 : 0
  }, [theme])

  React.useEffect(() => {
    const container = mountRef.current
    const section = sectionRef.current
    if (!container || !section) return

    let renderer: THREE.WebGLRenderer | null = null
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: "high-performance",
        alpha: false,
      })
    } catch {
      return
    }

    const getDpr = () => Math.min(window.devicePixelRatio || 1, 2)
    const dpr = getDpr()
    renderer.setPixelRatio(dpr)
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.domElement.className = "block h-full w-full"
    container.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

    const uniforms = {
      uTime: { value: 0 },
      uRes: {
        value: new THREE.Vector2(
          container.clientWidth * dpr,
          container.clientHeight * dpr
        ),
      },
      uMouse: { value: new THREE.Vector2(0.62, 0.52) },
      uHover: { value: 0 },
      uSpeed: { value: 0 },
      uMode: { value: modeTargetRef.current },
      uLight: { value: lightTargetRef.current },
    }

    const geometry = new THREE.PlaneGeometry(2, 2)
    const material = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms,
      depthWrite: false,
    })
    scene.add(new THREE.Mesh(geometry, material))

    const targetMouse = { x: 0.62, y: 0.52 }
    let hoverTarget = 0
    let speedTarget = 0

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return
      const rect = section.getBoundingClientRect()
      const nx = (e.clientX - rect.left) / Math.max(rect.width, 1)
      const ny = 1 - (e.clientY - rect.top) / Math.max(rect.height, 1)
      const inside = nx >= 0 && nx <= 1 && ny >= 0 && ny <= 1
      if (inside) {
        const dx = nx - targetMouse.x
        const dy = ny - targetMouse.y
        speedTarget = Math.min(1.5, Math.hypot(dx, dy) * 28)
        targetMouse.x = nx
        targetMouse.y = ny
        hoverTarget = 1
      } else {
        hoverTarget = 0
      }
    }

    const onPointerLeave = () => {
      hoverTarget = 0
    }

    window.addEventListener("pointermove", onPointerMove, { passive: true })
    section.addEventListener("pointerleave", onPointerLeave)

    const onResize = () => {
      if (!renderer) return
      const nextDpr = getDpr()
      const w = container.clientWidth
      const h = Math.max(container.clientHeight, 1)
      renderer.setPixelRatio(nextDpr)
      renderer.setSize(w, h)
      uniforms.uRes.value.set(w * nextDpr, h * nextDpr)
    }
    const ro = new ResizeObserver(onResize)
    ro.observe(container)

    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick)
      if (document.hidden || !renderer) return
      uniforms.uTime.value = reduced ? 1.2 : (now - start) * 0.001
      uniforms.uMouse.value.x += (targetMouse.x - uniforms.uMouse.value.x) * 0.11
      uniforms.uMouse.value.y += (targetMouse.y - uniforms.uMouse.value.y) * 0.11
      uniforms.uHover.value += (hoverTarget - uniforms.uHover.value) * 0.075
      uniforms.uSpeed.value += (speedTarget - uniforms.uSpeed.value) * 0.1
      speedTarget *= 0.88
      uniforms.uMode.value += (modeTargetRef.current - uniforms.uMode.value) * 0.055
      uniforms.uLight.value += (lightTargetRef.current - uniforms.uLight.value) * 0.08
      renderer.render(scene, camera)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener("pointermove", onPointerMove)
      section.removeEventListener("pointerleave", onPointerLeave)
      geometry.dispose()
      material.dispose()
      renderer?.dispose()
      if (renderer?.domElement.parentNode === container) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [reduced])

  return (
    <section
      ref={sectionRef}
      id="top"
      className="relative flex min-h-[80svh] w-full flex-col justify-between overflow-hidden bg-[#f5f5f2] transition-colors duration-300 dark:bg-[#0b0b0c]"
    >
      {/* Full-bleed Diagonal Fluted Glass + Interactive Magnifier Loupe */}
      <div
        ref={mountRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
      />

      {/* Minimal Top Bar */}
      <header className="relative z-20 mx-auto flex w-full max-w-[1440px] items-center justify-between px-6 py-5 md:px-12 md:py-6">
        <a
          href="#top"
          className="flex items-center gap-2.5 text-sm font-medium tracking-[-0.02em] text-zinc-900 transition-opacity hover:opacity-80 dark:text-white/90"
        >
          <span className="inline-block h-2 w-2 rounded-full bg-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.8)]" />
          <span>대학 공시 레이스</span>
          <span className="font-mono text-[11px] text-zinc-400 dark:text-white/35">
            / {latestYear}
          </span>
        </a>

        <nav className="hidden items-center gap-7 text-xs font-medium tracking-tight text-zinc-600 dark:text-white/60 md:flex">
          <a href="#race" className="transition-colors hover:text-zinc-950 dark:hover:text-white">
            순위 레이스
          </a>
          <a href="#ranking" className="transition-colors hover:text-zinc-950 dark:hover:text-white">
            전체 순위표
          </a>
          <a href="#archive" className="transition-colors hover:text-zinc-950 dark:hover:text-white">
            자료 아카이브
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 font-mono text-[11px] text-zinc-600 dark:text-white/55 sm:flex">
            <span
              className={cn(
                "inline-block h-1.5 w-1.5 rounded-full",
                status?.error ? "bg-amber-500" : "bg-emerald-500 dark:bg-emerald-400"
              )}
            />
            <span>{status?.error ? "갱신 지연" : "실시간 공시"}</span>
          </div>

          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={theme === "dark" ? "화이트 모드로 전환" : "다크 모드로 전환"}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-zinc-900/15 bg-white/75 px-3 py-1.5 text-xs font-medium text-zinc-800 shadow-sm backdrop-blur-md transition-all hover:bg-white dark:border-white/15 dark:bg-black/45 dark:text-zinc-100 dark:hover:bg-white/15"
          >
            {theme === "dark" ? (
              <>
                <Sun className="h-3.5 w-3.5 text-amber-300" />
                <span>화이트</span>
              </>
            ) : (
              <>
                <Moon className="h-3.5 w-3.5 text-indigo-600" />
                <span>다크</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Lower-Left Editorial Typography */}
      <div className="relative z-10 mx-auto flex w-full max-w-[1440px] flex-1 flex-col justify-end px-6 pb-10 md:px-12 md:pb-12">
        <div className="max-w-xl">
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="text-4xl font-semibold leading-[1.08] tracking-[-0.04em] text-zinc-950 dark:font-medium dark:text-[#f5f5f5] sm:text-6xl lg:text-[68px]"
          >
            {mode === "combined" ? "대학 공시 레이스" : "학생 Support 지수 랭킹"}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="mt-5 max-w-md text-sm leading-[1.65] font-normal text-zinc-700 dark:text-white/70 sm:text-[17px]"
          >
            {mode === "combined" ? (
              <>
                연구활동 50점과 학생 Support 지수 50점으로 비교하는
                <br />
                {yearRange} 전국 일반대학 {schoolCount}곳의 순위 흐름.
              </>
            ) : (
              <>
                교육비·실부담 등록금·환원율·교원확보율 등 10개 지표로 비교하는
                <br />
                {yearRange} 전국 일반대학 {schoolCount}곳의 학생 Support 지수 랭킹.
              </>
            )}
          </motion.p>

          {/* Subtle Mode Switch & Direct Action */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="mt-8 flex flex-wrap items-center gap-4"
          >
            <a
              href="#race"
              className="group inline-flex items-center gap-2 rounded-full bg-zinc-950 px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-orange-100 sm:text-sm"
            >
              순위 레이스 보기
              <ArrowDown className="h-3.5 w-3.5 transition-transform group-hover:translate-y-0.5" />
            </a>

            <div
              role="tablist"
              aria-label="비교 기준 선택"
              className="inline-flex rounded-full border border-zinc-900/12 bg-white/70 p-1 backdrop-blur-md dark:border-white/15 dark:bg-black/40"
            >
              <button
                type="button"
                role="tab"
                aria-selected={mode === "combined"}
                onClick={() => onModeChange("combined")}
                className={cn(
                  "cursor-pointer rounded-full px-3.5 py-1.5 text-xs transition-colors",
                  mode === "combined"
                    ? "bg-zinc-900 font-medium text-white dark:bg-white/18 dark:text-white"
                    : "text-zinc-600 hover:text-zinc-950 dark:text-white/50 dark:hover:text-white/85"
                )}
              >
                종합 50:50
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === "support"}
                onClick={() => onModeChange("support")}
                className={cn(
                  "cursor-pointer rounded-full px-3.5 py-1.5 text-xs transition-colors",
                  mode === "support"
                    ? "bg-zinc-900 font-medium text-white dark:bg-white/18 dark:text-white"
                    : "text-zinc-600 hover:text-zinc-950 dark:text-white/50 dark:hover:text-white/85"
                )}
              >
                학생 Support 지수
              </button>
            </div>
          </motion.div>

          {/* Minimal Footer Metadata Line */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.28 }}
            className="mt-7 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] text-zinc-500 dark:text-white/38"
          >
            <span>진학 참고용 · 자체 산정</span>
            <span>·</span>
            <span>확인 {formatKst(status?.checked)}</span>
            <span>·</span>
            <span>커서를 움직여 유리 굴절·스펙트럼 탐색</span>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
