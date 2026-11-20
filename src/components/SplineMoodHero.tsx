import * as React from "react"
import * as THREE from "three"
import { motion, useReducedMotion } from "framer-motion"
import { ArrowDown } from "lucide-react"
import { cn } from "@/lib/utils"
import type { CompareMode, DisclosureStatus } from "@/types/ranking"
import { formatKst } from "@/types/ranking"

interface SplineMoodHeroProps {
  mode: CompareMode
  onModeChange: (mode: CompareMode) => void
  latestYear: number
  schoolCount: number
  yearRange: string
  status: DisclosureStatus | null
  savedCount: number
}

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`

// Faithful GLSL optical recreation of Spline "Retrofuturism - BG animation" (fba5a24b):
// Matte obsidian charcoal canvas + diagonal -45° fluted glass slats + drifting sunset orb
// with crimson -> vermilion -> tangerine -> amber-gold bevel refraction + fine analog film grain.
const FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform vec2 uRes;
  uniform vec2 uMouse;
  uniform float uMode;

  float hash12(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash12(i + vec2(0.0, 0.0)), hash12(i + vec2(1.0, 0.0)), u.x),
      mix(hash12(i + vec2(0.0, 1.0)), hash12(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  // Evaluate the glowing sunset light field behind the fluted glass at point (u, v)
  // in the rotated slat coordinate space.
  vec3 evalLightField(vec2 uvRot, vec2 orbPos, float t, float modeMix) {
    vec2 d = uvRot - orbPos;

    // Slightly elongated soft emissive solar body + tight sculptural falloff
    float dist = length(d * vec2(1.18, 1.12));
    float intensity = exp(-dist * dist * 7.8) * 1.32 + exp(-dist * 4.2) * 0.16;

    // Positional color temperature across the orb (lower-left crimson -> core amber-gold)
    float grad = clamp((d.x * 1.95 + 0.48) + 0.14 * sin(t * 0.3), 0.0, 1.0);

    // Combined mode: faithful Retrofuturism sunset palette
    vec3 crimsonA  = vec3(0.58, 0.03, 0.03);
    vec3 scarletA  = vec3(0.86, 0.17, 0.08);
    vec3 tangerineA = vec3(0.98, 0.43, 0.11);
    vec3 amberA    = vec3(1.00, 0.74, 0.34);

    // Support mode: subtle cool-sunset shift (deep ruby -> coral -> warm gold)
    // Keeping the exact Spline aesthetic while subtly acknowledging mode switch
    vec3 crimsonB  = vec3(0.06, 0.20, 0.44);
    vec3 scarletB  = vec3(0.08, 0.48, 0.66);
    vec3 tangerineB = vec3(0.18, 0.76, 0.74);
    vec3 amberB    = vec3(0.68, 0.95, 0.88);

    vec3 c1 = mix(crimsonA, crimsonB, modeMix * 0.75);
    vec3 c2 = mix(scarletA, scarletB, modeMix * 0.75);
    vec3 c3 = mix(tangerineA, tangerineB, modeMix * 0.75);
    vec3 c4 = mix(amberA, amberB, modeMix * 0.75);

    vec3 hue = mix(c1, c2, smoothstep(0.0, 0.38, grad));
    hue = mix(hue, c3, smoothstep(0.32, 0.72, grad));
    hue = mix(hue, c4, smoothstep(0.65, 1.0, grad));

    return hue * intensity;
  }

  void main() {
    float aspect = uRes.x / max(uRes.y, 1.0);
    vec2 p = (vUv - 0.5) * vec2(aspect, 1.0);

    // Anchor the glass array toward upper-center-right just like the Spline composition
    float anchorX = aspect > 1.05 ? 0.16 * aspect : 0.04;
    vec2 q = p - vec2(anchorX, 0.04);

    // Rotate by +45 deg so each glass bar runs top-left to bottom-right (\)
    // and bars stack cleanly from bottom-left (low u) to top-right (high u).
    const float cs = 0.70710678;
    vec2 rot = vec2(q.x * cs + q.y * cs, -q.x * cs + q.y * cs);

    // Bold fluted glass slat pitch (about 7–8 major visible bars across the lit area)
    float slatW = 0.118;
    float slatPos = rot.x / slatW;
    float slatIdx = floor(slatPos);
    float f = fract(slatPos); // 0 = lower-left edge of bar, 1 = razor-sharp upper-right edge

    // Smoothly orbiting sunset light source behind the glass + gentle mouse parallax
    float t = uTime;
    vec2 mouseOff = (uMouse - 0.5) * vec2(0.14, 0.10);
    vec2 orbWorld = vec2(
      0.06 + sin(t * 0.42) * 0.13 + cos(t * 0.23) * 0.05,
      0.04 + cos(t * 0.34) * 0.11 + sin(t * 0.19) * 0.04
    ) + mouseOff;
    vec2 orbRot = vec2(orbWorld.x * cs + orbWorld.y * cs, -orbWorld.x * cs + orbWorld.y * cs);

    // Cylindrical / prismatic optical refraction through each thick glass bar:
    // Light bends asymmetrically toward the sharp upper-right bevel (f -> 1)
    float barCenterU = (slatIdx + 0.5) * slatW;
    float lensCurve = (f - 0.5) * 2.0; // -1 .. +1
    float refractU = barCenterU + lensCurve * slatW * 0.24 - pow(max(0.0, f), 2.2) * slatW * 0.52;
    float refractV = rot.y * (1.0 - 0.08 * (1.0 - lensCurve * lensCurve)) + (f - 0.5) * 0.032;

    // Chromatic micro-dispersion for realistic thick glass feel
    vec3 colR = evalLightField(vec2(refractU + 0.008, refractV), orbRot, t, uMode);
    vec3 colG = evalLightField(vec2(refractU,         refractV), orbRot, t, uMode);
    vec3 colB = evalLightField(vec2(refractU - 0.008, refractV), orbRot, t, uMode);
    vec3 refracted = vec3(colR.r, colG.g, colB.b);

    // Sculpted shading across each individual glass bar:
    // - Soft dark shadow falloff on the lower-left edge (f near 0)
    // - Smooth luminous body across the middle
    // - Crisp bright beveled specular ridge along the upper-right edge (f near 0.94..0.985)
    // - Razor-sharp dark seam between adjacent bars (f > 0.985 or f < 0.025)
    float softLeft = smoothstep(0.015, 0.24, f);
    float sharpRight = 1.0 - smoothstep(0.972, 0.996, f);
    float barMask = softLeft * sharpRight;

    float bodyShade = mix(0.46, 1.08, pow(f, 0.72));
    float bevelRim = exp(-pow((f - 0.945) / 0.042, 2.0)) * 0.85;
    float microHighlight = exp(-pow((f - 0.968) / 0.014, 2.0)) * 0.55;

    // Taper the bars cleanly along their length (v) so tips dissolve like glass sculptures into black
    float alongFade = exp(-pow((rot.y - orbRot.y * 0.72) / 0.38, 2.0));
    float totalLight = length(refracted);

    // Combine glass body refraction + hot bevel highlight
    vec3 glassColor = refracted * bodyShade * barMask * (0.2 + 0.8 * alongFade);
    vec3 rimTint = mix(refracted * 1.45, vec3(1.0, 0.90, 0.72), 0.48);
    glassColor += rimTint * (bevelRim + microHighlight) * sharpRight * smoothstep(0.05, 0.36, totalLight) * alongFade;

    // Subtle ambient bleed behind the dark gaps so transitions remain organic
    vec3 deepAmbient = evalLightField(rot, orbRot, t, uMode) * 0.032 * alongFade;

    // Base deep matte charcoal-obsidian canvas (#0B0B0C)
    vec3 baseBg = vec3(0.043, 0.043, 0.046);
    vec3 color = baseBg + deepAmbient + glassColor;

    // Tone mapping (ACES-like soft roll-off so highlights glow warmly without harsh clipping)
    color = color / (1.0 + color * 0.42);
    color = pow(max(color, 0.0), vec3(0.96));

    // Pervasive fine analog film grain (Signature #retro #grain texture from Spline scene)
    float g1 = hash12(gl_FragCoord.xy + fract(t * 0.07) * 100.0);
    float g2 = hash12(gl_FragCoord.xy * 0.5 + 17.3);
    float grain = ((g1 * 0.72 + g2 * 0.28) - 0.5) * 0.078;
    color += grain * (0.75 + 0.55 * clamp(totalLight, 0.0, 1.0));

    // Subtle edge vignette
    float vig = 1.0 - dot((vUv - 0.5) * 1.05, (vUv - 0.5) * 1.05) * 0.35;
    color *= clamp(vig, 0.65, 1.0);

    gl_FragColor = vec4(max(color, 0.0), 1.0);
  }
`

export function SplineMoodHero({
  mode,
  onModeChange,
  latestYear,
  schoolCount,
  yearRange,
  status,
  savedCount,
}: SplineMoodHeroProps) {
  const mountRef = React.useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const modeTargetRef = React.useRef(mode === "combined" ? 0 : 1)

  React.useEffect(() => {
    modeTargetRef.current = mode === "combined" ? 0 : 1
  }, [mode])

  React.useEffect(() => {
    const container = mountRef.current
    if (!container) return

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

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.domElement.className = "block h-full w-full"
    container.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

    const uniforms = {
      uTime: { value: 0 },
      uRes: {
        value: new THREE.Vector2(
          container.clientWidth * Math.min(window.devicePixelRatio || 1, 2),
          container.clientHeight * Math.min(window.devicePixelRatio || 1, 2)
        ),
      },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uMode: { value: modeTargetRef.current },
    }

    const geometry = new THREE.PlaneGeometry(2, 2)
    const material = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms,
      depthWrite: false,
    })
    scene.add(new THREE.Mesh(geometry, material))

    const targetMouse = { x: 0.5, y: 0.5 }
    const onPointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect()
      targetMouse.x = (e.clientX - rect.left) / Math.max(rect.width, 1)
      targetMouse.y = 1 - (e.clientY - rect.top) / Math.max(rect.height, 1)
    }
    window.addEventListener("pointermove", onPointerMove, { passive: true })

    const onResize = () => {
      if (!renderer) return
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = container.clientWidth
      const h = Math.max(container.clientHeight, 1)
      renderer.setPixelRatio(dpr)
      renderer.setSize(w, h)
      uniforms.uRes.value.set(w * dpr, h * dpr)
    }
    const ro = new ResizeObserver(onResize)
    ro.observe(container)

    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick)
      if (document.hidden || !renderer) return
      uniforms.uTime.value = reduced ? 1.2 : (now - start) * 0.001
      uniforms.uMouse.value.x += (targetMouse.x - uniforms.uMouse.value.x) * 0.045
      uniforms.uMouse.value.y += (targetMouse.y - uniforms.uMouse.value.y) * 0.045
      uniforms.uMode.value += (modeTargetRef.current - uniforms.uMode.value) * 0.055
      renderer.render(scene, camera)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener("pointermove", onPointerMove)
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
      id="top"
      className="relative flex min-h-[100svh] w-full flex-col justify-between overflow-hidden bg-[#0b0b0c]"
    >
      {/* Full-bleed Diagonal Fluted Glass & Sunset Refraction Shader Canvas */}
      <div
        ref={mountRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
      />

      {/* Minimal Top Bar */}
      <header className="relative z-20 mx-auto flex w-full max-w-[1440px] items-center justify-between px-6 py-7 md:px-12">
        <a
          href="#top"
          className="flex items-center gap-2.5 text-sm font-medium tracking-[-0.02em] text-white/90 transition-opacity hover:opacity-100"
        >
          <span className="inline-block h-2 w-2 rounded-full bg-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.9)]" />
          <span>대학 공시 레이스</span>
          <span className="font-mono text-[11px] text-white/35">
            / {latestYear}
          </span>
        </a>

        <nav className="hidden items-center gap-7 text-xs font-normal tracking-tight text-white/60 md:flex">
          <a href="#race" className="transition-colors hover:text-white">
            순위 레이스
          </a>
          <a href="#ranking" className="transition-colors hover:text-white">
            전체 순위표
          </a>
          <a href="#archive" className="transition-colors hover:text-white">
            자료 아카이브
            {savedCount > 0 ? (
              <span className="ml-1.5 font-mono text-[10px] text-orange-400">
                ({savedCount})
              </span>
            ) : null}
          </a>
        </nav>

        <div className="flex items-center gap-2 font-mono text-[11px] text-white/55">
          <span
            className={cn(
              "inline-block h-1.5 w-1.5 rounded-full",
              status?.error ? "bg-amber-400" : "bg-emerald-400"
            )}
          />
          <span>{status?.error ? "갱신 지연" : "실시간 공시"}</span>
        </div>
      </header>

      {/* Lower-Left Editorial Typography (faithful to Spline Retrofuturism layout) */}
      <div className="relative z-10 mx-auto flex w-full max-w-[1440px] flex-1 flex-col justify-end px-6 pb-14 md:px-12 md:pb-16">
        <div className="max-w-xl">
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="text-4xl font-medium leading-[1.08] tracking-[-0.04em] text-[#f5f5f5] sm:text-6xl lg:text-[68px]"
          >
            {mode === "combined" ? "대학 공시 레이스" : "학생지원 레이스"}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="mt-5 max-w-md text-sm leading-[1.65] font-normal text-white/70 sm:text-[17px]"
          >
            {mode === "combined" ? (
              <>
                연구활동 50점과 학생지원 50점으로 비교하는
                <br />
                {yearRange} 전국 일반대학 {schoolCount}곳의 순위 흐름.
              </>
            ) : (
              <>
                등록금·장학금·기숙사·글로컬대학 9가지 지표로 비교하는
                <br />
                {yearRange} 전국 일반대학 {schoolCount}곳의 학생지원 순위.
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
              className="group inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-xs font-semibold text-black transition-colors hover:bg-orange-100 sm:text-sm"
            >
              순위 레이스 보기
              <ArrowDown className="h-3.5 w-3.5 transition-transform group-hover:translate-y-0.5" />
            </a>

            <div
              role="tablist"
              aria-label="비교 기준 선택"
              className="inline-flex rounded-full border border-white/15 bg-black/40 p-1 backdrop-blur-md"
            >
              <button
                type="button"
                role="tab"
                aria-selected={mode === "combined"}
                onClick={() => onModeChange("combined")}
                className={cn(
                  "cursor-pointer rounded-full px-3.5 py-1.5 text-xs transition-colors",
                  mode === "combined"
                    ? "bg-white/18 font-medium text-white"
                    : "text-white/50 hover:text-white/85"
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
                    ? "bg-white/18 font-medium text-white"
                    : "text-white/50 hover:text-white/85"
                )}
              >
                학생지원만
              </button>
            </div>
          </motion.div>

          {/* Minimal Footer Metadata Line */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.28 }}
            className="mt-10 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] text-white/38"
          >
            <span>진학 참고용 · 자체 산정</span>
            <span>·</span>
            <span>확인 {formatKst(status?.checked)}</span>
            <span>·</span>
            <span>대학알리미 × OpenAlex</span>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
