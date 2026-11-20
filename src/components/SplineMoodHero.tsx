import * as React from "react"
import * as THREE from "three"
import { motion, useReducedMotion } from "framer-motion"
import {
  ArrowDownRight,
  Compass,
  Flame,
  Layers,
  Radio,
  Sparkles,
} from "lucide-react"
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

// Retrofuturism liquid-glass & glowing amber solar core shader inspired by Spline references
const FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform vec2 uRes;
  uniform vec2 uMouse;
  uniform float uMode;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
    for (int i = 0; i < 4; i++) {
      v += a * noise(p);
      p = rot * p * 2.04 + vec2(1.7, 9.2);
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = vUv;
    vec2 aspect = vec2(uRes.x / max(uRes.y, 1.0), 1.0);
    vec2 p = (uv - 0.5) * aspect;
    vec2 m = (uMouse - 0.5) * aspect;

    // Position the glowing retrofuturist solar orb toward upper-right
    vec2 orbCenter = vec2(0.28 * aspect.x, 0.04) + m * 0.14;
    vec2 dp = p - orbCenter;
    float dist = length(dp);

    // Fluted glass refraction bars (vertical optical lenses like Spline Retrofuturism)
    float fluteFreq = 34.0;
    float flutePhase = sin(uv.x * fluteFreq * 3.14159 + m.x * 2.5);
    float glassMask = smoothstep(0.05, 0.48, uv.x) * smoothstep(0.98, 0.55, uv.x);
    vec2 refracted = dp + vec2(flutePhase * 0.022 * glassMask, cos(uv.y * 8.0 + uTime * 0.35) * 0.012);

    // Domain-warped nebula + glass caustics
    float t = uTime * 0.16;
    float w1 = fbm(refracted * 2.3 + vec2(t, -t * 0.7));
    float w2 = fbm(refracted * 3.6 + vec2(w1 * 1.6 - t * 0.5, w1 * 1.2 + t * 0.4));

    // Glowing solar core & chromatic halo
    float rDist = length(refracted + (vec2(w1, w2) - 0.5) * 0.16);
    float core = exp(-rDist * 4.4);
    float halo = exp(-rDist * 1.95) * 0.78;
    float ring = exp(-abs(rDist - 0.34 - sin(uTime * 0.6) * 0.015) * 26.0) * 0.85;
    float outerRing = exp(-abs(rDist - 0.52) * 18.0) * 0.32;

    // Palette shifts subtly between Combined (amber/coral) and Support (cyan/emerald)
    vec3 colObsidian = vec3(0.023, 0.027, 0.042);
    vec3 colWarmA = mix(vec3(1.00, 0.38, 0.14), vec3(0.10, 0.85, 0.76), uMode);
    vec3 colWarmB = mix(vec3(1.00, 0.78, 0.42), vec3(0.55, 0.96, 1.00), uMode);
    vec3 colCool = mix(vec3(0.18, 0.42, 0.88), vec3(0.38, 0.25, 0.92), uMode);

    vec3 col = colObsidian;
    col += colCool * (w2 * 0.28 + exp(-length(p - vec2(-0.35 * aspect.x, -0.25)) * 1.7) * 0.22);
    col += colWarmA * halo * (0.72 + 0.45 * w1);
    col += colWarmB * core * 1.25;
    col += mix(colWarmB, vec3(1.0), 0.45) * ring;
    col += colCool * outerRing * 1.4;

    // Specular ridges along fluted glass panes
    float ridge = pow(max(0.0, flutePhase), 6.0) * 0.14 * glassMask * (0.35 + halo * 1.8);
    col += vec3(1.0, 0.95, 0.9) * ridge;

    // Horizon grid whisper at bottom
    float gridFade = smoothstep(0.35, 0.0, uv.y) * 0.16;
    float gx = smoothstep(0.965, 1.0, abs(sin((p.x / max(0.12, 0.45 - uv.y)) * 18.0)));
    float gy = smoothstep(0.965, 1.0, abs(sin((1.0 / max(0.08, 0.42 - uv.y)) * 4.0 - uTime * 0.6)));
    col += mix(colWarmA, colCool, 0.6) * (gx + gy) * gridFade;

    // Subtle film vignette
    float vig = 1.0 - dot((uv - 0.5) * 1.25, (uv - 0.5) * 1.25);
    col *= clamp(vig + 0.22, 0.25, 1.0);

    gl_FragColor = vec4(col, 1.0);
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

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8))
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.domElement.className = "h-full w-full block"
    container.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const orthoCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

    const uniforms = {
      uTime: { value: 0 },
      uRes: { value: new THREE.Vector2(container.clientWidth, container.clientHeight) },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uMode: { value: modeTargetRef.current },
    }

    const bgQuad = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: FRAG,
        uniforms,
        depthWrite: false,
      })
    )
    scene.add(bgQuad)

    // Overlay 3D glass torus knot + orbital rings (Spline Creative Agency 3D depth)
    const scene3d = new THREE.Scene()
    const perspCam = new THREE.PerspectiveCamera(
      42,
      container.clientWidth / Math.max(container.clientHeight, 1),
      0.1,
      100
    )
    perspCam.position.set(0, 0, 6.6)

    const knotGeo = new THREE.TorusKnotGeometry(1.18, 0.34, 180, 32, 2, 3)
    const knotMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.14,
      metalness: 0.18,
      transmission: 0.62,
      thickness: 1.4,
      clearcoat: 1,
      clearcoatRoughness: 0.08,
      wireframe: false,
      transparent: true,
      opacity: 0.88,
    })
    const knotMesh = new THREE.Mesh(knotGeo, knotMat)
    knotMesh.position.set(1.85, 0.12, 0)
    scene3d.add(knotMesh)

    const wireGeo = new THREE.TorusGeometry(2.02, 0.012, 16, 120)
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0xffb380,
      transparent: true,
      opacity: 0.38,
    })
    const ringMesh = new THREE.Mesh(wireGeo, wireMat)
    ringMesh.position.set(1.85, 0.12, -0.3)
    ringMesh.rotation.set(1.1, 0.3, 0.2)
    scene3d.add(ringMesh)

    // Ambient & key lights for glossy glass reflections
    const keyLight = new THREE.PointLight(0xff6b35, 38, 16)
    keyLight.position.set(3.4, 2.2, 3.8)
    const rimLight = new THREE.PointLight(0x38bdf8, 28, 16)
    rimLight.position.set(-2.5, -1.8, 3.2)
    const topLight = new THREE.DirectionalLight(0xfff1e0, 2.4)
    topLight.position.set(0, 4, 5)
    scene3d.add(keyLight, rimLight, topLight, new THREE.AmbientLight(0xffffff, 0.45))

    const targetMouse = { x: 0.5, y: 0.5 }
    const onPointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect()
      targetMouse.x = (e.clientX - rect.left) / Math.max(rect.width, 1)
      targetMouse.y = 1 - (e.clientY - rect.top) / Math.max(rect.height, 1)
    }
    window.addEventListener("pointermove", onPointerMove, { passive: true })

    const onResize = () => {
      if (!renderer) return
      const w = container.clientWidth
      const h = Math.max(container.clientHeight, 1)
      renderer.setSize(w, h)
      uniforms.uRes.value.set(w, h)
      perspCam.aspect = w / h
      perspCam.updateProjectionMatrix()
      // Move 3D knot gracefully on smaller viewports
      const compact = w < 900
      knotMesh.position.x = compact ? 0.1 : 1.85
      knotMesh.position.y = compact ? -0.95 : 0.12
      knotMesh.scale.setScalar(compact ? 0.72 : 1)
      ringMesh.position.copy(knotMesh.position)
      ringMesh.scale.setScalar(compact ? 0.72 : 1)
    }
    onResize()
    const ro = new ResizeObserver(onResize)
    ro.observe(container)

    let raf = 0
    const start = performance.now()
    renderer.autoClear = false

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick)
      if (document.hidden || !renderer) return
      const elapsed = reduced ? 0 : (now - start) * 0.001
      uniforms.uTime.value = elapsed
      uniforms.uMouse.value.x += (targetMouse.x - uniforms.uMouse.value.x) * 0.06
      uniforms.uMouse.value.y += (targetMouse.y - uniforms.uMouse.value.y) * 0.06
      uniforms.uMode.value += (modeTargetRef.current - uniforms.uMode.value) * 0.06

      const isSupport = uniforms.uMode.value
      keyLight.color.setRGB(1.0 - isSupport * 0.85, 0.42 + isSupport * 0.48, 0.2 + isSupport * 0.65)
      wireMat.color.setRGB(1.0 - isSupport * 0.55, 0.7 + isSupport * 0.25, 0.5 + isSupport * 0.45)

      knotMesh.rotation.x = elapsed * 0.24 + (uniforms.uMouse.value.y - 0.5) * 0.9
      knotMesh.rotation.y = elapsed * 0.31 + (uniforms.uMouse.value.x - 0.5) * 1.1
      ringMesh.rotation.z = elapsed * 0.18
      ringMesh.rotation.x = 1.1 + (uniforms.uMouse.value.y - 0.5) * 0.4

      renderer.clear()
      renderer.render(scene, orthoCam)
      renderer.clearDepth()
      renderer.render(scene3d, perspCam)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener("pointermove", onPointerMove)
      knotGeo.dispose()
      knotMat.dispose()
      wireGeo.dispose()
      wireMat.dispose()
      bgQuad.geometry.dispose()
      ;(bgQuad.material as THREE.Material).dispose()
      renderer?.dispose()
      if (renderer?.domElement.parentNode === container) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [reduced])

  return (
    <section
      id="top"
      className="relative flex min-h-[100svh] w-full flex-col justify-between overflow-hidden bg-[#06070a]"
    >
      {/* WebGL 3D Retrofuturism & Glass Refraction Canvas */}
      <div
        ref={mountRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
      />
      {/* Fallback radial atmosphere & noise */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-[#06070a]"
      />
      <div
        aria-hidden="true"
        className="bg-noise pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-overlay"
      />

      {/* Floating Glass Header */}
      <header className="relative z-20 mx-auto flex w-full max-w-[1380px] items-center justify-between px-5 py-6 md:px-10">
        <a href="#top" className="group flex items-center gap-3">
          <span className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/8 backdrop-blur-md transition-transform group-hover:scale-105">
            <Flame className="h-4 w-4 text-orange-400" />
          </span>
          <div>
            <div className="text-sm font-bold tracking-tight text-white">
              대학 공시 레이스
            </div>
            <div className="font-mono text-[10px] tracking-[0.18em] text-zinc-400 uppercase">
              KOR UNI TELEMETRY
            </div>
          </div>
        </a>

        <nav className="hidden items-center gap-1 rounded-full border border-white/12 bg-black/35 p-1.5 backdrop-blur-xl md:flex">
          <a
            href="#showcase"
            className="rounded-full px-4 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
          >
            TOP 쇼케이스
          </a>
          <a
            href="#race"
            className="rounded-full px-4 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
          >
            순위 레이스
          </a>
          <a
            href="#ranking"
            className="rounded-full px-4 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
          >
            전체 순위표
          </a>
          <a
            href="#archive"
            className="rounded-full px-4 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
          >
            자료 아카이브
            {savedCount > 0 ? (
              <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-500/80 px-1 font-mono text-[10px] text-white">
                {savedCount}
              </span>
            ) : null}
          </a>
        </nav>

        <div className="flex items-center gap-2 rounded-full border border-white/12 bg-black/40 px-3.5 py-1.5 text-xs backdrop-blur-xl">
          <Radio
            className={cn(
              "h-3.5 w-3.5",
              status?.error ? "text-amber-400" : "animate-pulse text-emerald-400"
            )}
          />
          <span className="font-mono text-[11px] text-zinc-200">
            {status?.error ? "갱신 지연" : `${latestYear} LIVE`}
          </span>
        </div>
      </header>

      {/* Hero Center Content */}
      <div className="relative z-10 mx-auto grid w-full max-w-[1380px] flex-1 items-center px-5 py-12 md:px-10">
        <div className="max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-4 py-1.5 backdrop-blur-xl"
          >
            <Sparkles className="h-3.5 w-3.5 text-orange-400" />
            <span className="font-mono text-[11px] tracking-[0.14em] text-zinc-200 uppercase">
              대학알리미 × OpenAlex · 진학 참고용 자체 산정
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.08 }}
            className="text-5xl font-black leading-[1.02] tracking-[-0.04em] text-white sm:text-7xl lg:text-[84px]"
          >
            {mode === "combined" ? "국내 대학" : "학생 지원"}
            <span
              className={cn(
                "mt-1 block font-serif font-normal italic tracking-[-0.02em]",
                mode === "combined"
                  ? "bg-gradient-to-r from-orange-300 via-amber-200 to-white bg-clip-text text-transparent"
                  : "bg-gradient-to-r from-cyan-300 via-emerald-200 to-white bg-clip-text text-transparent"
              )}
            >
              Disclosure Race.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.16 }}
            className="mt-6 max-w-xl text-base leading-relaxed text-zinc-300 sm:text-lg"
          >
            {mode === "combined"
              ? "직전 3개년 연구활동 50점과 등록금·장학금·기숙사·글로컬대학 등 학생지원 50점을 결합해 전국 일반대학의 연도별 순위 흐름을 한눈에 비교합니다."
              : "등록금·장학금·기숙사 수용률·취업률·교원 여건·글로컬대학 지정까지, 학생 생활과 학비 부담에 집중한 9가지 공시 지표로 대학을 비교합니다."}
          </motion.p>

          {/* Mode Quick Toggle */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.24 }}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <div
              role="tablist"
              aria-label="비교 기준 선택"
              className="inline-flex rounded-2xl border border-white/15 bg-black/50 p-1 backdrop-blur-xl"
            >
              <button
                type="button"
                role="tab"
                aria-selected={mode === "combined"}
                onClick={() => onModeChange("combined")}
                className={cn(
                  "cursor-pointer rounded-xl px-4 py-2 text-xs font-semibold transition-all sm:text-sm",
                  mode === "combined"
                    ? "bg-gradient-to-r from-orange-500 to-amber-500 text-black shadow-lg shadow-orange-500/25"
                    : "text-zinc-300 hover:text-white"
                )}
              >
                종합 · 연구 50 + 학생지원 50
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === "support"}
                onClick={() => onModeChange("support")}
                className={cn(
                  "cursor-pointer rounded-xl px-4 py-2 text-xs font-semibold transition-all sm:text-sm",
                  mode === "support"
                    ? "bg-gradient-to-r from-cyan-400 to-emerald-400 text-black shadow-lg shadow-cyan-500/25"
                    : "text-zinc-300 hover:text-white"
                )}
              >
                학생지원만 · 100점
              </button>
            </div>
          </motion.div>

          {/* Primary CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.3 }}
            className="mt-6 flex flex-wrap items-center gap-3"
          >
            <a
              href="#race"
              className="group inline-flex items-center gap-2.5 rounded-2xl bg-white px-6 py-3.5 text-sm font-bold text-black transition-all hover:bg-orange-100"
            >
              순위 레이스 바로 보기
              <ArrowDownRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:translate-y-0.5" />
            </a>
            <a
              href="#showcase"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/[0.06] px-5 py-3.5 text-sm font-medium text-zinc-100 backdrop-blur-xl transition-colors hover:bg-white/12"
            >
              <Compass className="h-4 w-4 text-orange-300" />
              TOP 대학 쇼케이스
            </a>
          </motion.div>
        </div>
      </div>

      {/* Bottom Telemetry Strip */}
      <div className="relative z-10 mx-auto w-full max-w-[1380px] px-5 pb-8 md:px-10">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-black/45 px-5 py-4 backdrop-blur-xl">
            <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-[0.14em] text-zinc-400">
              <span>비교 산정 대학</span>
              <Layers className="h-3.5 w-3.5 text-orange-400" />
            </div>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="tabular-nums text-2xl font-bold text-white">
                {schoolCount}곳
              </span>
              <span className="text-xs text-zinc-400">
                {mode === "combined" ? "종합 산정" : "일반대학 공시 단위"}
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/45 px-5 py-4 backdrop-blur-xl">
            <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-[0.14em] text-zinc-400">
              <span>공시 타임라인</span>
              <span className="text-emerald-400">3개년 연속</span>
            </div>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="tabular-nums text-2xl font-bold text-white">
                {yearRange}
              </span>
              <span className="text-xs text-zinc-400">연도별 레이스 재생 지원</span>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/45 px-5 py-4 backdrop-blur-xl">
            <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-[0.14em] text-zinc-400">
              <span>자동 갱신 상태</span>
              <span className={status?.error ? "text-amber-400" : "text-emerald-400"}>
                {status?.error ? "지연" : "정상"}
              </span>
            </div>
            <div className="mt-1.5 font-mono text-xs leading-relaxed text-zinc-300">
              <div>확인 · {formatKst(status?.checked)}</div>
              <div className="text-zinc-500">반영 · {formatKst(status?.published)}</div>
            </div>
          </div>
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-zinc-500">
          * 진학 참고용입니다. 입시 합격선과 평판은 산식에 포함되지 않으며, 공개 자료에 자체 배점을 적용한 결과입니다.
        </p>
      </div>
    </section>
  )
}
