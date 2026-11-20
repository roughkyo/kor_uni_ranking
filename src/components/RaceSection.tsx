import * as React from "react"
import { motion } from "framer-motion"
import {
  Bookmark,
  BookmarkCheck,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Pause,
  Play,
  RotateCcw,
  Search,
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
  onPageChange: (page: number) => void
  playing: boolean
  onTogglePlay: () => void
  onSelectYear: (year: number) => void
  isLatest: boolean
  onJumpLatest: () => void
  searchTerm: string
  onSearchChange: (term: string) => void
  savedIds: Set<string>
  onToggleSave: (row: UniversityRow) => void
}

const GROUP_SIZE = 20

const GLOCAL_LINKS: Record<number, string> = {
  2023: "https://www.moe.go.kr/boardCnts/viewRenew.do?boardID=294&boardSeq=97030",
  2024: "https://www.korea.kr/news/policyNewsView.do?newsId=156647660",
  2025: "https://csu.chosun.ac.kr/bbs/chosun/72/271857/artclView.do",
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

export function RaceSection({
  editions,
  edition,
  mode,
  onModeChange,
  selectedId,
  onSelectSchool,
  page,
  onPageChange,
  playing,
  onTogglePlay,
  onSelectYear,
  isLatest,
  onJumpLatest,
  searchTerm,
  onSearchChange,
  savedIds,
  onToggleSave,
}: RaceSectionProps) {
  const pages = Math.max(1, Math.ceil(edition.rows.length / GROUP_SIZE))
  const safePage = Math.min(page, pages - 1)
  const visible = edition.rows.slice(safePage * GROUP_SIZE, (safePage + 1) * GROUP_SIZE)
  const selectedRow =
    edition.rows.find((r) => r.id === selectedId) ?? visible[0] ?? edition.rows[0]

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

  const isSaved = selectedRow ? savedIds.has(selectedRow.id) : false
  const selectedDelta = selectedRow
    ? getRankDelta(editions, edition.year, selectedRow)
    : { label: "—", diff: null, kind: "none" as const }

  return (
    <section
      id="race"
      className="relative mx-auto w-full max-w-[1380px] px-5 py-20 md:px-10"
    >
      {/* Section Heading & Finder Bar */}
      <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-orange-400">
            <span>01 / LIVE TELEMETRY RACE</span>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            연도별 순위 레이스
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            {edition.year} 공시 · 일반대학 {edition.rows.length}개 단위 비교 · 연도를 재생해 순위 추월 흐름을 확인하세요.
          </p>
        </div>

        {/* Mode & Search Controls */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="inline-flex rounded-xl border border-white/10 bg-white/[0.04] p-1">
            <button
              type="button"
              onClick={() => onModeChange("combined")}
              className={cn(
                "cursor-pointer rounded-lg px-3.5 py-2 text-xs font-semibold transition-all",
                mode === "combined"
                  ? "bg-orange-500 text-black"
                  : "text-zinc-400 hover:text-white"
              )}
            >
              종합
            </button>
            <button
              type="button"
              onClick={() => onModeChange("support")}
              className={cn(
                "cursor-pointer rounded-lg px-3.5 py-2 text-xs font-semibold transition-all",
                mode === "support"
                  ? "bg-cyan-400 text-black"
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

      {/* Main Split Dashboard: Race Track (Left) + Inspector (Right) */}
      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(340px,1fr)]">
        {/* LEFT: TELEMETRY RACE TRACK */}
        <article className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0a0c12]/90 p-5 shadow-2xl backdrop-blur-xl sm:p-7">
          {/* Top ambient glow */}
          <div
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute -top-24 right-0 h-56 w-80 rounded-full blur-3xl opacity-20",
              mode === "combined" ? "bg-orange-500" : "bg-cyan-400"
            )}
          />

          {/* Track Toolbar */}
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-5">
            <div className="flex items-center gap-3">
              <div className="font-serif text-4xl italic tracking-tight text-white sm:text-5xl">
                {edition.year}
              </div>
              <div className="h-8 w-px bg-white/12" />
              <div className="flex items-center gap-1.5">
                {editions.map((ed) => (
                  <button
                    key={ed.year}
                    type="button"
                    onClick={() => onSelectYear(ed.year)}
                    className={cn(
                      "cursor-pointer rounded-lg px-2.5 py-1.5 font-mono text-xs transition-all",
                      ed.year === edition.year
                        ? "bg-white text-black font-bold"
                        : "bg-white/[0.05] text-zinc-400 hover:bg-white/12 hover:text-white"
                    )}
                  >
                    {ed.year}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onTogglePlay}
                className={cn(
                  "inline-flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all",
                  playing
                    ? "bg-zinc-800 text-orange-300 ring-1 ring-orange-400/40"
                    : mode === "combined"
                      ? "bg-gradient-to-r from-orange-500 to-amber-400 text-black shadow-lg shadow-orange-500/20 hover:brightness-110"
                      : "bg-gradient-to-r from-cyan-400 to-emerald-400 text-black shadow-lg shadow-cyan-500/20 hover:brightness-110"
                )}
              >
                {playing ? (
                  <>
                    <Pause className="h-3.5 w-3.5" /> 일시정지
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5 fill-current" /> 연도 재생
                  </>
                )}
              </button>

              {!isLatest ? (
                <button
                  type="button"
                  onClick={onJumpLatest}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-white/12 bg-white/[0.05] px-3 py-2 text-xs text-zinc-200 hover:bg-white/10"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> 최신판
                </button>
              ) : null}
            </div>
          </div>

          {/* Mover highlight strip */}
          <div className="relative z-10 mt-4 mb-3 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-zinc-300">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
              {topMover ? (
                <span>
                  <strong className="text-white">{topMover.row.name}</strong>{" "}
                  <span className="font-mono text-emerald-400">
                    ▲ {topMover.gain}계단
                  </span>{" "}
                  <span className="text-zinc-500">· 구간 내 최대 상승</span>
                </span>
              ) : (
                <span className="text-zinc-400">
                  표시 구간 {visible[0]?.rank ?? 1}–{visible.at(-1)?.rank ?? 20}위 · 점수축 0–100
                </span>
              )}
            </div>
            <div className="hidden items-center gap-6 font-mono text-[10px] text-zinc-500 sm:flex">
              <span>25</span>
              <span>50</span>
              <span>75</span>
              <span>100</span>
            </div>
          </div>

          {/* Racing Bars */}
          <div className="relative z-10 space-y-1.5">
            {visible.map((row) => {
              const active = row.id === selectedRow?.id
              const delta = getRankDelta(editions, edition.year, row)
              const pct = Math.min(100, Math.max(2, row.score))

              return (
                <motion.button
                  key={row.id}
                  layout
                  transition={{
                    layout: { type: "spring", stiffness: 280, damping: 32 },
                  }}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onSelectSchool(row, false)}
                  className={cn(
                    "group relative grid w-full cursor-pointer grid-cols-[32px_minmax(105px,28%)_1fr_54px] items-center gap-3 rounded-xl border px-3 py-2 text-left transition-colors sm:grid-cols-[36px_minmax(130px,28%)_1fr_52px_58px]",
                    active
                      ? "border-orange-400/50 bg-white/[0.08] shadow-[0_0_24px_-8px_rgba(255,91,46,0.45)]"
                      : "border-transparent bg-white/[0.015] hover:border-white/10 hover:bg-white/[0.045]"
                  )}
                >
                  {/* Rank */}
                  <span
                    className={cn(
                      "font-mono text-xs font-semibold tabular-nums",
                      row.rank <= 3
                        ? "text-amber-300"
                        : active
                          ? "text-orange-300"
                          : "text-zinc-500"
                    )}
                  >
                    {String(row.rank).padStart(2, "0")}
                  </span>

                  {/* School Name */}
                  <span
                    className={cn(
                      "truncate text-[13px] font-medium",
                      active ? "text-white font-semibold" : "text-zinc-200 group-hover:text-white"
                    )}
                  >
                    {row.name}
                  </span>

                  {/* Track & Animated Glowing Bar */}
                  <div className="relative flex h-5 items-center">
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 rounded-full"
                      style={{
                        backgroundImage:
                          "repeating-linear-gradient(90deg, rgba(255,255,255,0.07) 0 1px, transparent 1px 25%)",
                      }}
                    />
                    <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/[0.05]">
                      <motion.div
                        className={cn(
                          "relative h-full rounded-full",
                          active
                            ? "bg-gradient-to-r from-orange-600 via-orange-400 to-amber-200 shadow-[0_0_14px_rgba(255,140,66,0.75)]"
                            : mode === "combined"
                              ? "bg-gradient-to-r from-orange-500/35 via-amber-400/65 to-orange-200/90"
                              : "bg-gradient-to-r from-cyan-500/35 via-teal-400/70 to-emerald-200/90"
                        )}
                        initial={false}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                      />
                    </div>
                  </div>

                  {/* Delta Badge (desktop) */}
                  <span
                    className={cn(
                      "hidden text-right font-mono text-[11px] tabular-nums sm:inline-block",
                      delta.kind === "up"
                        ? "text-emerald-400"
                        : delta.kind === "down"
                          ? "text-rose-400"
                          : delta.kind === "new"
                            ? "text-amber-300"
                            : "text-zinc-600"
                    )}
                  >
                    {delta.label}
                  </span>

                  {/* Score */}
                  <span
                    className={cn(
                      "text-right font-mono text-xs font-bold tabular-nums",
                      active ? "text-amber-200" : "text-zinc-200"
                    )}
                  >
                    {row.score.toFixed(2)}
                  </span>
                </motion.button>
              )
            })}
          </div>

          {/* Pagination Footer */}
          <div className="relative z-10 mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4 text-xs">
            <div className="font-mono text-zinc-400">
              <strong className="text-white">
                {visible[0]?.rank ?? 1}–{visible.at(-1)?.rank ?? 20}위
              </strong>{" "}
              · 전체 {edition.rows.length}개 단위
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
                className="h-8 cursor-pointer rounded-lg border border-white/12 bg-[#10131c] px-2.5 font-mono text-xs text-zinc-200 outline-none focus:border-orange-400"
              >
                {Array.from({ length: pages }, (_, i) => (
                  <option key={i} value={i}>
                    {i * GROUP_SIZE + 1}–{Math.min(edition.rows.length, (i + 1) * GROUP_SIZE)}위
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
          <aside className="sticky top-6 rounded-3xl border border-white/10 bg-[#0d1018]/90 p-6 shadow-2xl backdrop-blur-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-orange-300">
                  <span>{edition.year} 공시</span>
                  <span>·</span>
                  <span>{selectedRow.rank}위</span>
                  {selectedRow.designation ? (
                    <span className="rounded-full bg-orange-500/20 px-2 py-0.5 text-[10px] text-orange-200">
                      글로컬 {selectedRow.designation}
                    </span>
                  ) : null}
                </div>
                <h3 className="mt-1.5 text-2xl font-extrabold tracking-tight text-white">
                  {selectedRow.name}
                </h3>
                <p className="mt-1 text-xs text-zinc-400">
                  {selectedRow.region} · 전년 대비{" "}
                  <span
                    className={cn(
                      "font-mono font-semibold",
                      selectedDelta.kind === "up"
                        ? "text-emerald-400"
                        : selectedDelta.kind === "down"
                          ? "text-rose-400"
                          : "text-zinc-300"
                    )}
                  >
                    {selectedDelta.label}
                  </span>
                </p>
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

            {/* Save to GlassFolder button */}
            <button
              type="button"
              onClick={() => onToggleSave(selectedRow)}
              className={cn(
                "mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold transition-all",
                isSaved
                  ? "border-orange-400/50 bg-orange-500/15 text-orange-200"
                  : "border-white/12 bg-white/[0.04] text-zinc-200 hover:border-white/25 hover:bg-white/[0.08]"
              )}
            >
              {isSaved ? (
                <>
                  <BookmarkCheck className="h-4 w-4 text-orange-300" />
                  관심 대학 폴더에 보관됨 (클릭 시 해제)
                </>
              ) : (
                <>
                  <Bookmark className="h-4 w-4 text-zinc-400" />
                  하단 관심 대학 글래스 폴더에 담기
                </>
              )}
            </button>

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
                  <div key={label} className="space-y-1">
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

                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                      <motion.div
                        className={cn(
                          "h-full rounded-full",
                          isResearch
                            ? "bg-gradient-to-r from-orange-500 to-amber-300"
                            : "bg-gradient-to-r from-cyan-500 to-emerald-300"
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
                accent={mode === "combined" ? "#fb923c" : "#22d3ee"}
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

      {/* Grid lines */}
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
          strokeWidth="2.2"
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
