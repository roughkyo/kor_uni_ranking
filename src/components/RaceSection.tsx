import * as React from "react"
import { animate, motion, useMotionValue } from "framer-motion"
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Pause,
  Play,
  RotateCcw,
  Search,
  SkipBack,
  Sparkles,
  TrendingUp,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  type CompareMode,
  type EditionSlice,
  type ExcludedRow,
  type UniversityRow,
  SEARCH_ALIASES,
  formatExclusionReason,
  getMetricMeta,
  getRankDelta,
} from "@/types/ranking"

interface RaceSectionProps {
  editions: EditionSlice[]
  edition: EditionSlice
  mode: CompareMode
  onModeChange: (mode: CompareMode) => void
  selectedId: string
  onSelectSchool: (row: UniversityRow, jumpPage?: boolean) => void
  page: number
  pageSize: number
  onPageSizeChange: (size: number) => void
  onPageChange: (page: number) => void
  playing: boolean
  onTogglePlay: () => void
  onReplay: () => void
  onSelectYear: (year: number) => void
  searchTerm: string
  onSearchChange: (term: string) => void
}

const GLOCAL_LINKS: Record<number, string> = {
  2023: "https://www.moe.go.kr/boardCnts/viewRenew.do?boardID=294&boardSeq=97030",
  2024: "https://www.korea.kr/news/policyNewsView.do?newsId=156647660",
  2025: "https://csu.chosun.ac.kr/bbs/chosun/72/271857/artclView.do",
}

// Curated editorial racing bar palette inspired by reference video (deep ocean teal, mint, slate blue, coral, amber gold, rose, indigo...)
const BAR_PALETTE = [
  {
    bg: "linear-gradient(90deg, #165466 0%, #1f7a8c 65%, #2a9bb0 100%)",
    glow: "rgba(38, 152, 174, 0.42)",
    badgeBg: "rgba(31, 122, 140, 0.25)",
    badgeBorder: "rgba(56, 189, 212, 0.55)",
    badgeText: "#7dd3fc",
  },
  {
    bg: "linear-gradient(90deg, #1d7a6e 0%, #2aa191 65%, #3dc4b0 100%)",
    glow: "rgba(45, 168, 151, 0.40)",
    badgeBg: "rgba(42, 161, 145, 0.24)",
    badgeBorder: "rgba(61, 196, 176, 0.55)",
    badgeText: "#6ee7b7",
  },
  {
    bg: "linear-gradient(90deg, #c74720 0%, #ea5d2b 65%, #fb7c47 100%)",
    glow: "rgba(234, 93, 43, 0.42)",
    badgeBg: "rgba(234, 93, 43, 0.24)",
    badgeBorder: "rgba(251, 124, 71, 0.58)",
    badgeText: "#fdba74",
  },
  {
    bg: "linear-gradient(90deg, #c98a09 0%, #eba912 65%, #fcc636 100%)",
    glow: "rgba(235, 169, 18, 0.40)",
    badgeBg: "rgba(235, 169, 18, 0.22)",
    badgeBorder: "rgba(252, 198, 54, 0.55)",
    badgeText: "#fde047",
  },
  {
    bg: "linear-gradient(90deg, #275b91 0%, #3678bd 65%, #559ae0 100%)",
    glow: "rgba(54, 120, 189, 0.42)",
    badgeBg: "rgba(54, 120, 189, 0.24)",
    badgeBorder: "rgba(96, 165, 250, 0.55)",
    badgeText: "#93c5fd",
  },
  {
    bg: "linear-gradient(90deg, #b83358 0%, #df4671 65%, #f56c93 100%)",
    glow: "rgba(223, 70, 113, 0.40)",
    badgeBg: "rgba(223, 70, 113, 0.24)",
    badgeBorder: "rgba(244, 114, 182, 0.55)",
    badgeText: "#f9a8d4",
  },
  {
    bg: "linear-gradient(90deg, #5342ad 0%, #705cd4 65%, #907ef0 100%)",
    glow: "rgba(112, 92, 212, 0.42)",
    badgeBg: "rgba(112, 92, 212, 0.24)",
    badgeBorder: "rgba(167, 139, 250, 0.55)",
    badgeText: "#c4b5fd",
  },
  {
    bg: "linear-gradient(90deg, #cf6713 0%, #ef8322 65%, #fca144 100%)",
    glow: "rgba(239, 131, 34, 0.40)",
    badgeBg: "rgba(239, 131, 34, 0.24)",
    badgeBorder: "rgba(251, 146, 60, 0.55)",
    badgeText: "#fed7aa",
  },
  {
    bg: "linear-gradient(90deg, #23784e 0%, #309b65 65%, #46bf81 100%)",
    glow: "rgba(48, 155, 101, 0.40)",
    badgeBg: "rgba(48, 155, 101, 0.24)",
    badgeBorder: "rgba(74, 222, 128, 0.55)",
    badgeText: "#86efac",
  },
  {
    bg: "linear-gradient(90deg, #0f6d82 0%, #1790aa 65%, #2cb4cf 100%)",
    glow: "rgba(23, 144, 170, 0.42)",
    badgeBg: "rgba(23, 144, 170, 0.24)",
    badgeBorder: "rgba(34, 211, 238, 0.55)",
    badgeText: "#67e8f9",
  },
] as const

const SHORT_MONOGRAMS: Record<string, string> = {
  서울대학교: "SNU",
  한국과학기술원: "KA",
  포항공과대학교: "PO",
  연세대학교: "YS",
  울산과학기술원: "UN",
  성균관대학교: "SK",
  고려대학교: "KU",
  경북대학교: "KN",
  전남대학교: "CN",
  부산대학교: "PN",
  한양대학교: "HY",
  경희대학교: "KH",
  서강대학교: "SG",
  중앙대학교: "CA",
  이화여자대학교: "EW",
}

function getUniversitySwatch(id: string) {
  let h = 2166136261
  for (let i = 0; i < id.length; i++) {
    h = Math.imul(h ^ id.charCodeAt(i), 16777619)
  }
  return BAR_PALETTE[(h >>> 0) % BAR_PALETTE.length]
}

function getUniversityMonogram(name: string): string {
  const base = name.split(" · ")[0]
  if (SHORT_MONOGRAMS[base]) return SHORT_MONOGRAMS[base]
  const clean = base.replace(/^국립/, "")
  return clean.slice(0, 2)
}

function searchAll(edition: EditionSlice, term: string): (UniversityRow | ExcludedRow)[] {
  const raw = term.trim().toLowerCase().replace(/\s/g, "")
  if (!raw) return []
  const q = SEARCH_ALIASES[raw] || raw
  return [...edition.rows, ...edition.excluded].filter((r) =>
    r.name.toLowerCase().replace(/\s/g, "").includes(q.toLowerCase())
  )
}

function isRankedRow(r: UniversityRow | ExcludedRow): r is UniversityRow {
  return "rank" in r && typeof r.rank === "number"
}

function AnimatedScore({ value }: { value: number }) {
  const mv = useMotionValue(value)
  const [display, setDisplay] = React.useState(value)

  React.useEffect(() => {
    const controls = animate(mv, value, {
      duration: 0.72,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest) => setDisplay(latest),
    })
    return () => controls.stop()
  }, [mv, value])

  return <>{display.toFixed(1)}점</>
}

export function RaceSection({
  editions,
  edition,
  mode,
  onModeChange,
  selectedId,
  onSelectSchool,
  page,
  pageSize,
  onPageSizeChange,
  onPageChange,
  playing,
  onTogglePlay,
  onReplay,
  onSelectYear,
  searchTerm,
  onSearchChange,
}: RaceSectionProps) {
  const pages = Math.max(1, Math.ceil(edition.rows.length / pageSize))
  const safePage = Math.min(page, pages - 1)
  const visible = edition.rows.slice(safePage * pageSize, (safePage + 1) * pageSize)
  const selectedRow =
    edition.rows.find((r) => r.id === selectedId) ?? visible[0] ?? edition.rows[0]

  const yearIndex = Math.max(
    0,
    editions.findIndex((e) => e.year === edition.year)
  )

  // Scale bars relative to the leading score of the current edition so the top bar fills ~88% of track width
  // while leaving room for the score number immediately to its right (just like the reference video!)
  const maxVisibleScore = React.useMemo(() => {
    const top = Math.max(...visible.map((r) => r.score), 60)
    return top * 1.04
  }, [visible])

  const { labels, units, caps } = React.useMemo(() => getMetricMeta(mode), [mode])

  const searchMatches = React.useMemo(
    () => (searchTerm.trim() ? searchAll(edition, searchTerm) : []),
    [edition, searchTerm]
  )

  const topMover = React.useMemo(() => {
    const prev = editions.find((e) => e.year === edition.year - 1)
    if (!prev) return null
    let best: { row: UniversityRow; gain: number } | null = null
    for (const row of visible) {
      const old = prev.rows.find((p) => p.id === row.id)
      if (!old) continue
      const gain = old.rank - row.rank
      if (gain > 0 && (!best || gain > best.gain)) {
        best = { row, gain }
      }
    }
    return best
  }, [editions, edition.year, visible])

  const trendPoints = React.useMemo(() => {
    if (!selectedRow) return []
    return editions.map((ed) => {
      const found = ed.rows.find((r) => r.id === selectedRow.id)
      return {
        year: ed.year,
        score: found ? found.score : null,
        rank: found ? found.rank : null,
      }
    })
  }, [editions, selectedRow])

  const selectedDelta = selectedRow
    ? getRankDelta(editions, edition.year, selectedRow)
    : { label: "—", diff: null, kind: "none" as const }

  // Assign each university a stable, non-colliding signature swatch based on its latest ranking order
  // so top-10 neighbours always have 10 completely distinct colors while preserving identity across years.
  const swatchById = React.useMemo(() => {
    const map = new Map<string, (typeof BAR_PALETTE)[number]>()
    const latest = editions.at(-1) ?? edition
    latest.rows.forEach((row, idx) => {
      map.set(row.id, BAR_PALETTE[idx % BAR_PALETTE.length])
    })
    return map
  }, [editions, edition])

  const getSwatch = React.useCallback(
    (id: string) => swatchById.get(id) ?? getUniversitySwatch(id),
    [swatchById]
  )

  const selectedSwatch = selectedRow
    ? getSwatch(selectedRow.id)
    : BAR_PALETTE[0]

  return (
    <section
      id="race"
      className="relative mx-auto w-full max-w-[1380px] px-5 py-20 md:px-10"
    >
      {/* Section Header + Mode & Search */}
      <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 font-mono text-[11px] uppercase tracking-[0.18em] text-orange-400">
            RANK IS THE STORY · 01 / LIVE RACING CHART
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            서로 추월하는 연도별 대학 레이스
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            {edition.year} 공시 · 일반대학 {edition.rows.length}개 단위 비교 · 재생 버튼을 누르거나 하단 타임라인을 움직여 순위 변화를 확인하세요.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="inline-flex rounded-xl border border-white/10 bg-white/[0.04] p-1">
            <button
              type="button"
              onClick={() => onModeChange("combined")}
              className={cn(
                "cursor-pointer rounded-lg px-3.5 py-2 text-xs font-semibold transition-all",
                mode === "combined"
                  ? "bg-orange-500 text-black shadow-sm"
                  : "text-zinc-400 hover:text-white"
              )}
            >
              종합 50:50
            </button>
            <button
              type="button"
              onClick={() => onModeChange("support")}
              className={cn(
                "cursor-pointer rounded-lg px-3.5 py-2 text-xs font-semibold transition-all",
                mode === "support"
                  ? "bg-teal-400 text-black shadow-sm"
                  : "text-zinc-400 hover:text-white"
              )}
            >
              학생지원만
            </button>
          </div>

          <div className="relative min-w-[260px] flex-1 sm:w-80">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && searchMatches.length > 0) {
                  const first = searchMatches.find(isRankedRow)
                  if (first) onSelectSchool(first, true)
                }
              }}
              placeholder="대학명 검색 (예: 서울대, 카이스트, 포스텍)"
              aria-label="대학 찾기"
              className="w-full rounded-xl border border-white/12 bg-white/[0.04] py-2.5 pr-4 pl-10 text-sm text-white placeholder:text-zinc-500 outline-none transition-colors focus:border-orange-400/70 focus:bg-white/[0.07]"
            />
          </div>
        </div>
      </div>

      {/* Instant Search Match Chips */}
      {searchTerm.trim() ? (
        <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-md">
          <div className="mb-2.5 font-mono text-[11px] text-zinc-400">
            {searchMatches.length > 0
              ? `검색 결과 ${searchMatches.length}곳 — 클릭하면 레이스 트랙으로 이동합니다`
              : "일치하는 대학이 없습니다."}
          </div>
          <div className="flex flex-wrap gap-2">
            {searchMatches.slice(0, 18).map((item) =>
              isRankedRow(item) ? (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectSchool(item, true)}
                  className={cn(
                    "cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                    item.id === selectedRow?.id
                      ? "border-orange-400 bg-orange-500/20 text-orange-100"
                      : "border-white/12 bg-white/[0.05] text-zinc-200 hover:border-white/30 hover:bg-white/10"
                  )}
                >
                  <span className="mr-1.5 font-mono text-orange-300">
                    #{item.rank}
                  </span>
                  {item.name}
                  <span className="ml-1.5 font-mono text-zinc-400">
                    {item.score.toFixed(1)}
                  </span>
                </button>
              ) : (
                <span
                  key={item.id}
                  className="rounded-full border border-white/8 bg-white/[0.02] px-3 py-1.5 text-xs text-zinc-500"
                >
                  {item.name} · 미산정 ({formatExclusionReason(item)})
                </span>
              )
            )}
          </div>
        </div>
      ) : null}

      {/* Main Split: Sculpted Bar Race Card (Left) + Inspector (Right) */}
      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1.62fr)_minmax(340px,1fr)]">
        {/* LEFT: SCULPTED BAR RACE CARD */}
        <article className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#0d1017]/95 p-5 shadow-[0_32px_90px_-30px_rgba(0,0,0,0.85)] backdrop-blur-xl sm:p-8">
          {/* Subtle Top Card Header (like reference: Title Left / Edition Date Right) */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-lg font-bold tracking-tight text-white sm:text-xl">
                  {mode === "combined" ? "종합 순위 레이스" : "학생지원 순위 레이스"}
                </h3>
                <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-0.5 font-mono text-[11px] text-zinc-300">
                  {visible[0]?.rank ?? 1}–{visible.at(-1)?.rank ?? pageSize}위
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-2 text-xs text-zinc-400">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                {topMover ? (
                  <span>
                    <strong className="text-zinc-100">{topMover.row.name}</strong>{" "}
                    <span className="font-mono font-semibold text-emerald-400">
                      ▲ {topMover.gain}계단
                    </span>{" "}
                    구간 내 최대 상승
                  </span>
                ) : (
                  <span>대학 행을 클릭하면 우측에서 세부 공시 지표를 확인할 수 있습니다</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* 10 / 20 rows toggle */}
              <div className="hidden items-center rounded-lg border border-white/10 bg-white/[0.03] p-0.5 text-[11px] sm:inline-flex">
                {[10, 20].map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => onPageSizeChange(sz)}
                    className={cn(
                      "cursor-pointer rounded-md px-2.5 py-1 font-mono transition-colors",
                      pageSize === sz
                        ? "bg-white/14 font-semibold text-white"
                        : "text-zinc-500 hover:text-zinc-200"
                    )}
                  >
                    {sz}곳
                  </button>
                ))}
              </div>
              <div className="text-right">
                <div className="font-mono text-2xl font-bold tracking-tight tabular-nums text-white sm:text-3xl">
                  {edition.year}
                </div>
                <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500">
                  공시연도
                </div>
              </div>
            </div>
          </div>

          {/* Sculpted Overtaking Bars */}
          <div className="relative space-y-1.5">
            {visible.map((row) => {
              const active = row.id === selectedRow?.id
              const delta = getRankDelta(editions, edition.year, row)
              const swatch = getSwatch(row.id)
              const monogram = getUniversityMonogram(row.name)
              const barPct = Math.min(100, Math.max(10, (row.score / maxVisibleScore) * 100))

              return (
                <motion.button
                  key={row.id}
                  layout
                  transition={{
                    layout: { type: "spring", stiffness: 210, damping: 26, mass: 0.9 },
                  }}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onSelectSchool(row, false)}
                  className={cn(
                    "group relative grid w-full cursor-pointer grid-cols-[26px_34px_minmax(96px,148px)_1fr_52px] items-center gap-2.5 rounded-2xl px-2.5 py-1 text-left transition-colors sm:grid-cols-[28px_36px_minmax(126px,168px)_1fr_62px] sm:gap-3.5 sm:px-3",
                    active
                      ? "bg-white/[0.075] ring-1 ring-white/25"
                      : "hover:bg-white/[0.035]"
                  )}
                >
                  {/* 1. Rank Number */}
                  <span
                    className={cn(
                      "text-center font-mono text-sm font-semibold tabular-nums",
                      row.rank <= 3
                        ? "text-white"
                        : active
                          ? "text-orange-300"
                          : "text-zinc-500"
                    )}
                  >
                    {row.rank}
                  </span>

                  {/* 2. Distinct Circular University Avatar Badge */}
                  <span
                    className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-mono text-[10.5px] font-bold tracking-tight text-white shadow-inner sm:h-9 sm:w-9"
                    style={{
                      background: swatch.badgeBg,
                      border: `1.5px solid ${swatch.badgeBorder}`,
                      color: swatch.badgeText,
                    }}
                  >
                    {monogram}
                    {row.designation ? (
                      <span
                        title={`글로컬대학 ${row.designation}`}
                        className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-[#0d1017] bg-amber-400"
                      />
                    ) : null}
                  </span>

                  {/* 3. University Name & Region Sublabel */}
                  <div className="min-w-0">
                    <div
                      className={cn(
                        "truncate text-[13px] font-semibold tracking-tight sm:text-[14px]",
                        active ? "text-white" : "text-zinc-100 group-hover:text-white"
                      )}
                    >
                      {row.name}
                    </div>
                    <div className="truncate font-mono text-[10px] text-zinc-500">
                      {row.region}
                    </div>
                  </div>

                  {/* 4. Thick Sculpted Rounded Bar + Inline Moving Score */}
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="relative flex flex-1 items-center">
                      <motion.div
                        className="relative h-7 overflow-hidden rounded-[9px] sm:h-8 sm:rounded-[10px]"
                        style={{
                          background: swatch.bg,
                          boxShadow: active
                            ? `0 10px 26px -6px ${swatch.glow}, inset 0 1px 0 rgba(255,255,255,0.34)`
                            : `0 6px 18px -8px ${swatch.glow}, inset 0 1px 0 rgba(255,255,255,0.22)`,
                        }}
                        initial={false}
                        animate={{ width: `${barPct}%` }}
                        transition={{ duration: 0.78, ease: [0.22, 1, 0.36, 1] }}
                      >
                        {/* Glossy top sheen for physical volume */}
                        <div
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/18 to-transparent"
                        />
                        {active ? (
                          <div
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-white/45 ring-inset"
                          />
                        ) : null}
                      </motion.div>

                      {/* Score sits right next to the moving end of the bar */}
                      <span
                        className={cn(
                          "ml-3 shrink-0 font-mono text-xs font-bold tracking-tight tabular-nums sm:text-[13.5px]",
                          active ? "text-white" : "text-zinc-200"
                        )}
                      >
                        <AnimatedScore value={row.score} />
                      </span>
                    </div>
                  </div>

                  {/* 5. Soft Pill Delta Badge (exactly like the reference ▲1 / ▼1 pills) */}
                  <div className="flex justify-end">
                    {delta.kind === "up" ? (
                      <span className="inline-flex items-center justify-center rounded-full bg-emerald-500/18 px-2.5 py-1 font-mono text-[11px] font-bold tabular-nums text-emerald-300 ring-1 ring-emerald-400/25">
                        {delta.label}
                      </span>
                    ) : delta.kind === "down" ? (
                      <span className="inline-flex items-center justify-center rounded-full bg-amber-500/18 px-2.5 py-1 font-mono text-[11px] font-bold tabular-nums text-amber-300 ring-1 ring-amber-400/25">
                        {delta.label}
                      </span>
                    ) : delta.kind === "new" ? (
                      <span className="inline-flex items-center justify-center rounded-full bg-sky-500/18 px-2 py-1 font-mono text-[10px] font-bold text-sky-300 ring-1 ring-sky-400/25">
                        NEW
                      </span>
                    ) : (
                      <span className="font-mono text-[11px] text-zinc-600">—</span>
                    )}
                  </div>
                </motion.button>
              )
            })}
          </div>

          {/* Interactive Timeline Scrubber Bar (Signature control from reference video) */}
          <div className="mt-7 flex flex-wrap items-center gap-4 border-t border-white/[0.08] pt-5">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (editions[0]) onSelectYear(editions[0].year)
                }}
                aria-label="첫 연도로 이동"
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-white/12 bg-white/[0.04] text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
              >
                <SkipBack className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={onTogglePlay}
                aria-label={playing ? "일시정지" : "연도 재생"}
                className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-white text-black shadow-lg shadow-white/15 transition-transform hover:scale-105 active:scale-95"
              >
                {playing ? (
                  <Pause className="h-4 w-4 fill-current" />
                ) : (
                  <Play className="ml-0.5 h-4 w-4 fill-current" />
                )}
              </button>
            </div>

            {/* Scrubber Track */}
            <div className="flex min-w-[180px] flex-1 flex-col gap-1.5">
              <div className="relative flex h-6 items-center">
                {/* Base Rail */}
                <div className="h-1.5 w-full rounded-full bg-white/10" />
                {/* Active Progress Fill */}
                <motion.div
                  className="pointer-events-none absolute left-0 h-1.5 rounded-full bg-gradient-to-r from-teal-400 via-cyan-300 to-orange-400"
                  initial={false}
                  animate={{
                    width:
                      editions.length > 1
                        ? `${(yearIndex / (editions.length - 1)) * 100}%`
                        : "100%",
                  }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                />
                {/* Interactive Range Input */}
                <input
                  type="range"
                  min={0}
                  max={Math.max(0, editions.length - 1)}
                  step={1}
                  value={yearIndex}
                  onChange={(e) => {
                    const target = editions[Number(e.target.value)]
                    if (target) onSelectYear(target.year)
                  }}
                  aria-label="공시연도 타임라인 탐색"
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
                {/* Visual Thumb */}
                <motion.div
                  className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 rounded-full border-2 border-[#0d1017] bg-teal-300 shadow-[0_0_12px_rgba(45,212,191,0.8)]"
                  initial={false}
                  animate={{
                    left:
                      editions.length > 1
                        ? `${(yearIndex / (editions.length - 1)) * 100}%`
                        : "100%",
                  }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>

              <div className="flex items-center justify-between font-mono text-[11px]">
                {editions.map((ed) => (
                  <button
                    key={ed.year}
                    type="button"
                    onClick={() => onSelectYear(ed.year)}
                    className={cn(
                      "cursor-pointer transition-colors",
                      ed.year === edition.year
                        ? "font-bold text-white"
                        : "text-zinc-500 hover:text-zinc-300"
                    )}
                  >
                    {ed.year}
                  </button>
                ))}
              </div>
            </div>

            {/* Step Counter & Replay */}
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs tabular-nums text-zinc-400">
                {yearIndex + 1} / {editions.length}
              </span>
              <button
                type="button"
                onClick={onReplay}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.04] px-3.5 py-1.5 text-xs font-medium text-zinc-200 transition-colors hover:bg-white/10"
              >
                <RotateCcw className="h-3.5 w-3.5" /> 다시 재생
              </button>
            </div>
          </div>

          {/* Pagination Footer */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] pt-4 text-xs">
            <div className="font-mono text-zinc-500">
              전체 {edition.rows.length}개 단위 · {editions.length}개 공시연도
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={safePage === 0}
                onClick={() => onPageChange(safePage - 1)}
                aria-label="이전 구간"
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-white/12 bg-white/[0.04] text-zinc-200 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-35"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <select
                value={safePage}
                onChange={(e) => onPageChange(Number(e.target.value))}
                aria-label="순위 구간"
                className="h-8 cursor-pointer rounded-lg border border-white/12 bg-[#121621] px-2.5 font-mono text-xs text-zinc-200 outline-none focus:border-teal-400"
              >
                {Array.from({ length: pages }, (_, i) => (
                  <option key={i} value={i}>
                    {i * pageSize + 1}–{Math.min(edition.rows.length, (i + 1) * pageSize)}위
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={safePage >= pages - 1}
                onClick={() => onPageChange(safePage + 1)}
                aria-label="다음 구간"
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-white/12 bg-white/[0.04] text-zinc-200 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-35"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </article>

        {/* RIGHT: SELECTED UNIVERSITY INSPECTOR */}
        {selectedRow ? (
          <aside className="sticky top-6 rounded-[28px] border border-white/10 bg-[#0d1017]/95 p-6 shadow-2xl backdrop-blur-xl">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span
                  className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl font-mono text-xs font-bold"
                  style={{
                    background: selectedSwatch.badgeBg,
                    border: `1.5px solid ${selectedSwatch.badgeBorder}`,
                    color: selectedSwatch.badgeText,
                  }}
                >
                  {getUniversityMonogram(selectedRow.name)}
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-orange-300">
                    <span>{edition.year} 공시</span>
                    <span>·</span>
                    <span>{selectedRow.rank}위</span>
                    {selectedRow.designation ? (
                      <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] text-amber-200">
                        글로컬 {selectedRow.designation}
                      </span>
                    ) : null}
                  </div>
                  <h3 className="mt-1 text-xl font-extrabold tracking-tight text-white sm:text-2xl">
                    {selectedRow.name}
                  </h3>
                  <p className="mt-0.5 text-xs text-zinc-400">
                    {selectedRow.region} · 전년 대비{" "}
                    <span
                      className={cn(
                        "font-mono font-semibold",
                        selectedDelta.kind === "up"
                          ? "text-emerald-400"
                          : selectedDelta.kind === "down"
                            ? "text-amber-300"
                            : "text-zinc-300"
                      )}
                    >
                      {selectedDelta.label}
                    </span>
                  </p>
                </div>
              </div>

              <div className="text-right">
                <div className="font-mono text-3xl font-black tracking-tight tabular-nums text-white">
                  {selectedRow.score.toFixed(2)}
                </div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                  / 100 PTS
                </div>
              </div>
            </div>

            {/* Metric Breakdown */}
            <div className="mt-5 space-y-3 border-t border-white/10 pt-5">
              {labels.map((label, i) => {
                const pts = selectedRow.points[i] ?? 0
                const cap = caps[i] ?? 1
                const ratio = Math.min(100, (pts / cap) * 100)
                const val = selectedRow.values[i]
                const direction = i === 8 ? "" : i === 0 || i === 4 ? "↓" : "↑"
                const isResearch = i >= 9

                return (
                  <div key={label} className="space-y-1.5">
                    <div className="flex items-baseline justify-between gap-2 text-xs">
                      <span className="font-medium text-zinc-200">
                        {label}{" "}
                        {direction ? (
                          <span className="font-mono text-[10px] text-zinc-500">
                            {direction}
                          </span>
                        ) : null}
                      </span>
                      <span className="font-mono text-[11px] tabular-nums text-zinc-300">
                        <strong className="text-white">{pts.toFixed(2)}</strong>
                        <span className="text-zinc-500"> / {cap}</span>
                      </span>
                    </div>

                    <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
                      <motion.div
                        className={cn(
                          "h-full rounded-full",
                          isResearch
                            ? "bg-gradient-to-r from-orange-500 to-amber-300"
                            : "bg-gradient-to-r from-teal-500 to-emerald-300"
                        )}
                        initial={false}
                        animate={{ width: `${ratio}%` }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                      />
                    </div>

                    <div className="font-mono text-[10px] text-zinc-500">
                      {i === 8
                        ? pts > 0
                          ? `${selectedRow.designation}년 본지정 (+${cap}점 반영)`
                          : selectedRow.designation
                            ? "해당 연도 가점 없음"
                            : "본지정 가점 없음"
                        : val !== null && val !== undefined
                          ? `${selectedRow.years[i]} · ${val.toLocaleString("ko-KR", {
                              maximumFractionDigits: 2,
                            })}${units[i]}`
                          : "—"}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Yearly Trend SVG Chart */}
            <div className="mt-6 border-t border-white/10 pt-5">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-300">
                  연도별 점수 추이
                </span>
                <span className="font-mono text-[10px] text-zinc-500">
                  {trendPoints
                    .map((p) => `${p.year}·${p.score !== null ? p.score.toFixed(1) : "—"}`)
                    .join("  ")}
                </span>
              </div>

              <TrendSparkline
                points={trendPoints}
                activeYear={edition.year}
                accent={selectedSwatch.badgeText}
                onSelectYear={onSelectYear}
              />
            </div>

            {/* Source Links */}
            <div className="mt-5 flex flex-wrap gap-2 border-t border-white/10 pt-4 text-xs">
              {selectedRow.source ? (
                <a
                  href={selectedRow.source}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-zinc-300 transition-colors hover:border-orange-400/40 hover:text-white"
                >
                  OpenAlex 기관 원문 <ExternalLink className="h-3 w-3" />
                </a>
              ) : null}
              {selectedRow.points[8] && selectedRow.designation && GLOCAL_LINKS[selectedRow.designation] ? (
                <a
                  href={GLOCAL_LINKS[selectedRow.designation]}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-zinc-300 transition-colors hover:border-orange-400/40 hover:text-white"
                >
                  글로컬 본지정 자료 <ExternalLink className="h-3 w-3" />
                </a>
              ) : null}
              {selectedRow.name === "서울대학교" ? (
                <a
                  href="https://www.timeshighereducation.com/student/best-universities/best-universities-south-korea"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-zinc-300 transition-colors hover:border-orange-400/40 hover:text-white"
                >
                  <Sparkles className="h-3 w-3 text-amber-300" />
                  THE 2027 한국 1위 · 세계 56위 <ExternalLink className="h-3 w-3" />
                </a>
              ) : null}
            </div>
          </aside>
        ) : null}
      </div>
    </section>
  )
}

function TrendSparkline({
  points,
  activeYear,
  accent,
  onSelectYear,
}: {
  points: { year: number; score: number | null; rank: number | null }[]
  activeYear: number
  accent: string
  onSelectYear: (year: number) => void
}) {
  const width = 320
  const height = 84
  const padX = 24
  const padY = 16
  const valid = points.filter((p) => p.score !== null) as {
    year: number
    score: number
    rank: number | null
  }[]

  if (valid.length === 0) {
    return (
      <div className="flex h-20 items-center justify-center rounded-xl bg-white/[0.03] text-xs text-zinc-500">
        추이 데이터가 없습니다.
      </div>
    )
  }

  const coords = points.map((p, idx) => {
    const x =
      points.length === 1
        ? width / 2
        : padX + (idx / (points.length - 1)) * (width - padX * 2)
    const y =
      p.score === null
        ? null
        : height - padY - (Math.min(100, Math.max(0, p.score)) / 100) * (height - padY * 2)
    return { ...p, x, y }
  })

  const lineCoords = coords.filter((c): c is typeof c & { y: number } => c.y !== null)
  const linePath = lineCoords
    .map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(1)},${c.y.toFixed(1)}`)
    .join(" ")
  const areaPath =
    lineCoords.length >= 2
      ? `${linePath} L${lineCoords.at(-1)!.x.toFixed(1)},${height - 6} L${lineCoords[0].x.toFixed(1)},${height - 6} Z`
      : ""

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-[88px] w-full overflow-visible rounded-xl border border-white/8 bg-black/35"
      role="img"
      aria-label="연도별 점수 추이 차트"
    >
      <defs>
        <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.32" />
          <stop offset="100%" stopColor={accent} stopOpacity="0.0" />
        </linearGradient>
      </defs>

      {[25, 50, 75].map((v) => {
        const gy = height - padY - (v / 100) * (height - padY * 2)
        return (
          <line
            key={v}
            x1={10}
            x2={width - 10}
            y1={gy}
            y2={gy}
            stroke="rgba(255,255,255,0.06)"
            strokeDasharray="2 4"
          />
        )
      })}

      {areaPath ? <path d={areaPath} fill="url(#trendFill)" /> : null}
      {linePath ? (
        <path
          d={linePath}
          fill="none"
          stroke={accent}
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : null}

      {coords.map((c) =>
        c.y !== null ? (
          <g
            key={c.year}
            className="cursor-pointer"
            onClick={() => onSelectYear(c.year)}
          >
            {c.year === activeYear ? (
              <circle cx={c.x} cy={c.y} r="9" fill={accent} opacity="0.22" />
            ) : null}
            <circle
              cx={c.x}
              cy={c.y}
              r={c.year === activeYear ? 4.5 : 3.2}
              fill={c.year === activeYear ? "#ffffff" : accent}
              stroke={accent}
              strokeWidth="1.8"
            />
            <text
              x={c.x}
              y={height - 2}
              textAnchor="middle"
              fill={c.year === activeYear ? "#ffffff" : "#71717a"}
              fontSize="9"
              fontFamily="JetBrains Mono, monospace"
            >
              {c.year}
            </text>
          </g>
        ) : null
      )}
    </svg>
  )
}
