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
import type { ThemeMode } from "@/components/SplineMoodHero"
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
  theme: ThemeMode
  onModeChange: (mode: CompareMode) => void
  selectedId: string
  onSelectSchool: (row: UniversityRow, jumpPage?: boolean) => void
  page: number
  pageSize: number
  onPageSizeChange: (size: number) => void
  onPageChange: (page: number) => void
  playing: boolean
  playRound: number
  totalPlayRounds: number
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

interface BarSwatch {
  bg: string
  activeBg: string
  border: string
  activeBorder: string
  badgeBg: string
  badgeBorder: string
  badgeText: string
  accent: string
}

// Dark Mode: Refined deep-satin mineral tones that integrate cleanly into dark obsidian surfaces
// (no harsh candy/jelly highlights — subtle left-to-right luminance progression + hairline glass edge)
const DARK_BAR_PALETTE: BarSwatch[] = [
  {
    bg: "linear-gradient(90deg, rgba(19, 58, 70, 0.72) 0%, rgba(34, 108, 128, 0.92) 100%)",
    activeBg: "linear-gradient(90deg, rgba(24, 78, 94, 0.9) 0%, rgba(45, 146, 171, 1) 100%)",
    border: "rgba(74, 175, 198, 0.28)",
    activeBorder: "rgba(125, 211, 252, 0.65)",
    badgeBg: "rgba(30, 96, 114, 0.28)",
    badgeBorder: "rgba(74, 175, 198, 0.45)",
    badgeText: "#7dd3fc",
    accent: "#38bdf8",
  },
  {
    bg: "linear-gradient(90deg, rgba(19, 64, 58, 0.72) 0%, rgba(36, 122, 110, 0.92) 100%)",
    activeBg: "linear-gradient(90deg, rgba(25, 86, 78, 0.9) 0%, rgba(49, 158, 142, 1) 100%)",
    border: "rgba(74, 194, 176, 0.28)",
    activeBorder: "rgba(110, 231, 183, 0.65)",
    badgeBg: "rgba(30, 102, 92, 0.28)",
    badgeBorder: "rgba(74, 194, 176, 0.45)",
    badgeText: "#6ee7b7",
    accent: "#34d399",
  },
  {
    bg: "linear-gradient(90deg, rgba(84, 38, 24, 0.72) 0%, rgba(168, 74, 42, 0.92) 100%)",
    activeBg: "linear-gradient(90deg, rgba(110, 48, 28, 0.9) 0%, rgba(214, 96, 54, 1) 100%)",
    border: "rgba(232, 124, 84, 0.30)",
    activeBorder: "rgba(253, 186, 116, 0.65)",
    badgeBg: "rgba(154, 66, 36, 0.28)",
    badgeBorder: "rgba(232, 124, 84, 0.45)",
    badgeText: "#fdba74",
    accent: "#fb923c",
  },
  {
    bg: "linear-gradient(90deg, rgba(78, 60, 19, 0.72) 0%, rgba(154, 117, 36, 0.92) 100%)",
    activeBg: "linear-gradient(90deg, rgba(102, 78, 24, 0.9) 0%, rgba(196, 149, 44, 1) 100%)",
    border: "rgba(222, 178, 76, 0.30)",
    activeBorder: "rgba(253, 224, 71, 0.62)",
    badgeBg: "rgba(142, 108, 32, 0.26)",
    badgeBorder: "rgba(222, 178, 76, 0.45)",
    badgeText: "#fde047",
    accent: "#facc15",
  },
  {
    bg: "linear-gradient(90deg, rgba(28, 49, 82, 0.72) 0%, rgba(52, 92, 148, 0.92) 100%)",
    activeBg: "linear-gradient(90deg, rgba(36, 65, 108, 0.9) 0%, rgba(71, 122, 194, 1) 100%)",
    border: "rgba(108, 154, 218, 0.28)",
    activeBorder: "rgba(147, 197, 253, 0.65)",
    badgeBg: "rgba(46, 82, 134, 0.28)",
    badgeBorder: "rgba(108, 154, 218, 0.45)",
    badgeText: "#93c5fd",
    accent: "#60a5fa",
  },
  {
    bg: "linear-gradient(90deg, rgba(78, 28, 47, 0.72) 0%, rgba(146, 54, 88, 0.92) 100%)",
    activeBg: "linear-gradient(90deg, rgba(102, 36, 60, 0.9) 0%, rgba(188, 72, 114, 1) 100%)",
    border: "rgba(218, 108, 148, 0.28)",
    activeBorder: "rgba(249, 168, 212, 0.62)",
    badgeBg: "rgba(132, 48, 78, 0.28)",
    badgeBorder: "rgba(218, 108, 148, 0.45)",
    badgeText: "#f9a8d4",
    accent: "#f472b6",
  },
  {
    bg: "linear-gradient(90deg, rgba(44, 38, 86, 0.72) 0%, rgba(82, 72, 156, 0.92) 100%)",
    activeBg: "linear-gradient(90deg, rgba(58, 50, 114, 0.9) 0%, rgba(110, 96, 202, 1) 100%)",
    border: "rgba(146, 136, 224, 0.28)",
    activeBorder: "rgba(196, 181, 253, 0.65)",
    badgeBg: "rgba(74, 64, 142, 0.28)",
    badgeBorder: "rgba(146, 136, 224, 0.45)",
    badgeText: "#c4b5fd",
    accent: "#a78bfa",
  },
  {
    bg: "linear-gradient(90deg, rgba(82, 47, 22, 0.72) 0%, rgba(158, 90, 38, 0.92) 100%)",
    activeBg: "linear-gradient(90deg, rgba(108, 62, 28, 0.9) 0%, rgba(202, 116, 48, 1) 100%)",
    border: "rgba(228, 144, 82, 0.28)",
    activeBorder: "rgba(254, 215, 170, 0.62)",
    badgeBg: "rgba(144, 82, 34, 0.28)",
    badgeBorder: "rgba(228, 144, 82, 0.45)",
    badgeText: "#fed7aa",
    accent: "#fb923c",
  },
  {
    bg: "linear-gradient(90deg, rgba(22, 62, 44, 0.72) 0%, rgba(42, 118, 82, 0.92) 100%)",
    activeBg: "linear-gradient(90deg, rgba(28, 82, 58, 0.9) 0%, rgba(56, 152, 106, 1) 100%)",
    border: "rgba(86, 186, 138, 0.28)",
    activeBorder: "rgba(134, 239, 172, 0.62)",
    badgeBg: "rgba(38, 104, 72, 0.28)",
    badgeBorder: "rgba(86, 186, 138, 0.45)",
    badgeText: "#86efac",
    accent: "#4ade80",
  },
  {
    bg: "linear-gradient(90deg, rgba(18, 56, 74, 0.72) 0%, rgba(34, 106, 138, 0.92) 100%)",
    activeBg: "linear-gradient(90deg, rgba(24, 74, 98, 0.9) 0%, rgba(46, 138, 178, 1) 100%)",
    border: "rgba(82, 176, 212, 0.28)",
    activeBorder: "rgba(103, 232, 249, 0.65)",
    badgeBg: "rgba(30, 94, 122, 0.28)",
    badgeBorder: "rgba(82, 176, 212, 0.45)",
    badgeText: "#67e8f9",
    accent: "#22d3ee",
  },
]

// Light Mode: Crisp editorial matte palette inspired directly by the reference racing chart video
const LIGHT_BAR_PALETTE: BarSwatch[] = [
  {
    bg: "linear-gradient(90deg, #175c6e 0%, #1f7488 100%)",
    activeBg: "linear-gradient(90deg, #114b5a 0%, #196476 100%)",
    border: "rgba(17, 75, 90, 0.18)",
    activeBorder: "rgba(17, 75, 90, 0.5)",
    badgeBg: "#e6f3f6",
    badgeBorder: "#9bcad6",
    badgeText: "#134e5e",
    accent: "#1b697c",
  },
  {
    bg: "linear-gradient(90deg, #279486 0%, #34ae9e 100%)",
    activeBg: "linear-gradient(90deg, #1f7d71 0%, #2b998b 100%)",
    border: "rgba(31, 125, 113, 0.18)",
    activeBorder: "rgba(31, 125, 113, 0.5)",
    badgeBg: "#e6f6f3",
    badgeBorder: "#99d6cc",
    badgeText: "#19695e",
    accent: "#289486",
  },
  {
    bg: "linear-gradient(90deg, #de592a 0%, #ef6d3d 100%)",
    activeBg: "linear-gradient(90deg, #c74a1f 0%, #de5b2b 100%)",
    border: "rgba(199, 74, 31, 0.18)",
    activeBorder: "rgba(199, 74, 31, 0.5)",
    badgeBg: "#fdf0ea",
    badgeBorder: "#f5b89e",
    badgeText: "#a83c17",
    accent: "#df5b2b",
  },
  {
    bg: "linear-gradient(90deg, #e5a30e 0%, #f5b924 100%)",
    activeBg: "linear-gradient(90deg, #ca8e08 0%, #e4a310 100%)",
    border: "rgba(180, 125, 8, 0.2)",
    activeBorder: "rgba(180, 125, 8, 0.5)",
    badgeBg: "#fef7e0",
    badgeBorder: "#f3d47d",
    badgeText: "#946507",
    accent: "#d9970a",
  },
  {
    bg: "linear-gradient(90deg, #2b68a6 0%, #3d7ec2 100%)",
    activeBg: "linear-gradient(90deg, #225487 0%, #316ba8 100%)",
    border: "rgba(34, 84, 135, 0.18)",
    activeBorder: "rgba(34, 84, 135, 0.5)",
    badgeBg: "#eaf2fa",
    badgeBorder: "#a7c8ea",
    badgeText: "#1e4d7d",
    accent: "#2d6aa8",
  },
  {
    bg: "linear-gradient(90deg, #c63e66 0%, #dc557c 100%)",
    activeBg: "linear-gradient(90deg, #ad3156 0%, #c64068 100%)",
    border: "rgba(173, 49, 86, 0.18)",
    activeBorder: "rgba(173, 49, 86, 0.5)",
    badgeBg: "#fcecf1",
    badgeBorder: "#eba8bc",
    badgeText: "#96294a",
    accent: "#c84068",
  },
  {
    bg: "linear-gradient(90deg, #5c4ec2 0%, #7163d6 100%)",
    activeBg: "linear-gradient(90deg, #4b3ea8 0%, #5f51c4 100%)",
    border: "rgba(75, 62, 168, 0.18)",
    activeBorder: "rgba(75, 62, 168, 0.5)",
    badgeBg: "#efedfb",
    badgeBorder: "#bdb5ee",
    badgeText: "#46399e",
    accent: "#5e50c4",
  },
  {
    bg: "linear-gradient(90deg, #e07b1a 0%, #f19032 100%)",
    activeBg: "linear-gradient(90deg, #c46810 0%, #de7a1b 100%)",
    border: "rgba(196, 104, 16, 0.18)",
    activeBorder: "rgba(196, 104, 16, 0.5)",
    badgeBg: "#fef2e6",
    badgeBorder: "#f4c596",
    badgeText: "#9c510a",
    accent: "#dd7919",
  },
  {
    bg: "linear-gradient(90deg, #278557 0%, #379f6b 100%)",
    activeBg: "linear-gradient(90deg, #1e6e47 0%, #2b895b 100%)",
    border: "rgba(30, 110, 71, 0.18)",
    activeBorder: "rgba(30, 110, 71, 0.5)",
    badgeBg: "#e8f6ee",
    badgeBorder: "#a0d6b8",
    badgeText: "#1a613e",
    accent: "#298658",
  },
  {
    bg: "linear-gradient(90deg, #16809c 0%, #249ab8 100%)",
    activeBg: "linear-gradient(90deg, #106a82 0%, #1a839e 100%)",
    border: "rgba(16, 106, 130, 0.18)",
    activeBorder: "rgba(16, 106, 130, 0.5)",
    badgeBg: "#e7f5f9",
    badgeBorder: "#9cd0de",
    badgeText: "#115e73",
    accent: "#18829e",
  },
]

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

function hashIdIndex(id: string, len: number): number {
  let h = 2166136261
  for (let i = 0; i < id.length; i++) {
    h = Math.imul(h ^ id.charCodeAt(i), 16777619)
  }
  return (h >>> 0) % len
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
      duration: 0.48,
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
  theme,
  onModeChange,
  selectedId,
  onSelectSchool,
  page,
  pageSize,
  onPageSizeChange,
  onPageChange,
  playing,
  playRound,
  totalPlayRounds,
  onTogglePlay,
  onReplay,
  onSelectYear,
  searchTerm,
  onSearchChange,
}: RaceSectionProps) {
  const palette = theme === "dark" ? DARK_BAR_PALETTE : LIGHT_BAR_PALETTE
  const pages = Math.max(1, Math.ceil(edition.rows.length / pageSize))
  const safePage = Math.min(page, pages - 1)
  const visible = edition.rows.slice(safePage * pageSize, (safePage + 1) * pageSize)
  const selectedRow =
    edition.rows.find((r) => r.id === selectedId) ?? visible[0] ?? edition.rows[0]

  const yearIndex = Math.max(
    0,
    editions.findIndex((e) => e.year === edition.year)
  )

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

  const swatchIndexById = React.useMemo(() => {
    const map = new Map<string, number>()
    const latest = editions.at(-1) ?? edition
    latest.rows.forEach((row, idx) => {
      map.set(row.id, idx % DARK_BAR_PALETTE.length)
    })
    return map
  }, [editions, edition])

  const getSwatch = React.useCallback(
    (id: string) => {
      const idx = swatchIndexById.get(id) ?? hashIdIndex(id, palette.length)
      return palette[idx % palette.length]
    },
    [swatchIndexById, palette]
  )

  const selectedSwatch = selectedRow
    ? getSwatch(selectedRow.id)
    : palette[0]

  return (
    <section
      id="race"
      className="relative mx-auto w-full max-w-[1380px] px-5 py-20 md:px-10"
    >
      {/* Section Header + Mode & Search */}
      <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 font-mono text-[11px] uppercase tracking-[0.18em] text-orange-600 dark:text-orange-400">
            RANK IS THE STORY · 01 / LIVE RACING CHART
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-white sm:text-4xl">
            연도별 대학 랭킹
          </h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            {edition.year} 공시 · 일반대학 {edition.rows.length}개 단위 비교 · 재생 버튼을 누르거나 하단 타임라인을 움직여 순위 변화를 확인하세요.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="inline-flex rounded-xl border border-zinc-200 bg-white p-1 shadow-xs dark:border-white/10 dark:bg-white/[0.04]">
            <button
              type="button"
              onClick={() => onModeChange("combined")}
              className={cn(
                "cursor-pointer rounded-lg px-3.5 py-2 text-xs font-semibold transition-all",
                mode === "combined"
                  ? "bg-zinc-900 text-white shadow-xs dark:bg-orange-500 dark:text-black"
                  : "text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white"
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
                  ? "bg-teal-700 text-white shadow-xs dark:bg-teal-400 dark:text-black"
                  : "text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white"
              )}
            >
              학생지원만
            </button>
          </div>

          <div className="relative min-w-[260px] flex-1 sm:w-80">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
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
              className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pr-4 pl-10 text-sm text-zinc-900 placeholder:text-zinc-400 shadow-xs outline-none transition-colors focus:border-zinc-900 dark:border-white/12 dark:bg-white/[0.04] dark:text-white dark:placeholder:text-zinc-500 dark:focus:border-orange-400/70 dark:focus:bg-white/[0.07]"
            />
          </div>
        </div>
      </div>

      {/* Instant Search Match Chips */}
      {searchTerm.trim() ? (
        <div className="mb-6 rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-white/10 dark:bg-white/[0.03] dark:backdrop-blur-md">
          <div className="mb-2.5 font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
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
                      ? "border-orange-500 bg-orange-50 text-orange-800 dark:border-orange-400 dark:bg-orange-500/20 dark:text-orange-100"
                      : "border-zinc-200 bg-zinc-50 text-zinc-800 hover:border-zinc-400 dark:border-white/12 dark:bg-white/[0.05] dark:text-zinc-200 dark:hover:border-white/30"
                  )}
                >
                  <span className="mr-1.5 font-mono text-orange-600 dark:text-orange-300">
                    #{item.rank}
                  </span>
                  {item.name}
                  <span className="ml-1.5 font-mono text-zinc-500 dark:text-zinc-400">
                    {item.score.toFixed(1)}
                  </span>
                </button>
              ) : (
                <span
                  key={item.id}
                  className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs text-zinc-500 dark:border-white/8 dark:bg-white/[0.02]"
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
        <article className="relative overflow-hidden rounded-[28px] border border-zinc-200/90 bg-white p-5 shadow-[0_24px_70px_-30px_rgba(15,23,42,0.14)] transition-colors duration-300 dark:border-white/10 dark:bg-[#0d1017]/95 dark:shadow-[0_32px_90px_-30px_rgba(0,0,0,0.85)] sm:p-8">
          {/* Card Header */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200/80 pb-5 dark:border-white/[0.08]">
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-lg font-bold tracking-tight text-zinc-950 dark:text-white sm:text-xl">
                  {mode === "combined" ? "종합 순위 레이스" : "학생지원 순위 레이스"}
                </h3>
                <span className="rounded-full border border-zinc-200 bg-zinc-100 px-2.5 py-0.5 font-mono text-[11px] text-zinc-700 dark:border-white/10 dark:bg-white/[0.05] dark:text-zinc-300">
                  {visible[0]?.rank ?? 1}–{visible.at(-1)?.rank ?? pageSize}위
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                {topMover ? (
                  <span>
                    <strong className="text-zinc-900 dark:text-zinc-100">{topMover.row.name}</strong>{" "}
                    <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
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
              <div className="hidden items-center rounded-lg border border-zinc-200 bg-zinc-50 p-0.5 text-[11px] dark:border-white/10 dark:bg-white/[0.03] sm:inline-flex">
                {[10, 20].map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => onPageSizeChange(sz)}
                    className={cn(
                      "cursor-pointer rounded-md px-2.5 py-1 font-mono transition-colors",
                      pageSize === sz
                        ? "bg-white font-semibold text-zinc-950 shadow-xs dark:bg-white/14 dark:text-white"
                        : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                    )}
                  >
                    {sz}곳
                  </button>
                ))}
              </div>
              <div className="text-right">
                <div className="font-mono text-2xl font-bold tracking-tight tabular-nums text-zinc-950 dark:text-white sm:text-3xl">
                  {edition.year}
                </div>
                <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-500">
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
                    layout: { type: "spring", stiffness: 320, damping: 28, mass: 0.75 },
                  }}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onSelectSchool(row, false)}
                  className={cn(
                    "group relative grid w-full cursor-pointer grid-cols-[26px_34px_minmax(96px,148px)_1fr_52px] items-center gap-2.5 rounded-2xl px-2.5 py-1 text-left transition-colors sm:grid-cols-[28px_36px_minmax(126px,168px)_1fr_62px] sm:gap-3.5 sm:px-3",
                    active
                      ? "bg-zinc-100/90 ring-1 ring-zinc-300 dark:bg-white/[0.06] dark:ring-white/20"
                      : "hover:bg-zinc-50 dark:hover:bg-white/[0.03]"
                  )}
                >
                  {/* 1. Rank Number */}
                  <span
                    className={cn(
                      "text-center font-mono text-sm font-semibold tabular-nums",
                      row.rank <= 3
                        ? "text-zinc-950 dark:text-white"
                        : active
                          ? "text-orange-600 dark:text-orange-300"
                          : "text-zinc-400 dark:text-zinc-500"
                    )}
                  >
                    {row.rank}
                  </span>

                  {/* 2. Distinct Circular University Avatar Badge */}
                  <span
                    className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-mono text-[10.5px] font-bold tracking-tight sm:h-9 sm:w-9"
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
                        className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-white bg-amber-400 dark:border-[#0d1017]"
                      />
                    ) : null}
                  </span>

                  {/* 3. University Name & Region Sublabel */}
                  <div className="min-w-0">
                    <div
                      className={cn(
                        "truncate text-[13px] font-semibold tracking-tight sm:text-[14px]",
                        active
                          ? "text-zinc-950 dark:text-white"
                          : "text-zinc-800 group-hover:text-zinc-950 dark:text-zinc-200 dark:group-hover:text-white"
                      )}
                    >
                      {row.name}
                    </div>
                    <div className="truncate font-mono text-[10px] text-zinc-400 dark:text-zinc-500">
                      {row.region}
                    </div>
                  </div>

                  {/* 4. Refined Matte-Satin Bar + Inline Moving Score */}
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="relative flex flex-1 items-center">
                      <motion.div
                        className="relative h-7 overflow-hidden rounded-[9px] sm:h-8 sm:rounded-[10px]"
                        style={{
                          background: active ? swatch.activeBg : swatch.bg,
                          border: `1px solid ${active ? swatch.activeBorder : swatch.border}`,
                        }}
                        initial={false}
                        animate={{ width: `${barPct}%` }}
                        transition={{ duration: 0.52, ease: [0.22, 1, 0.36, 1] }}
                      >
                        {/* Subtle right-end specular edge (only crisp hairline, no bulky glossy jelly bar) */}
                        <div
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-y-0 right-0 w-[2px] bg-white/30 dark:bg-white/25"
                        />
                      </motion.div>

                      <span
                        className={cn(
                          "ml-3 shrink-0 font-mono text-xs font-bold tracking-tight tabular-nums sm:text-[13.5px]",
                          active
                            ? "text-zinc-950 dark:text-white"
                            : "text-zinc-700 dark:text-zinc-300"
                        )}
                      >
                        <AnimatedScore value={row.score} />
                      </span>
                    </div>
                  </div>

                  {/* 5. Soft Pill Delta Badge */}
                  <div className="flex justify-end">
                    {delta.kind === "up" ? (
                      <span className="inline-flex items-center justify-center rounded-full bg-emerald-50 px-2.5 py-1 font-mono text-[11px] font-bold tabular-nums text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/25">
                        {delta.label}
                      </span>
                    ) : delta.kind === "down" ? (
                      <span className="inline-flex items-center justify-center rounded-full bg-amber-50 px-2.5 py-1 font-mono text-[11px] font-bold tabular-nums text-amber-700 ring-1 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-400/25">
                        {delta.label}
                      </span>
                    ) : delta.kind === "new" ? (
                      <span className="inline-flex items-center justify-center rounded-full bg-sky-50 px-2 py-1 font-mono text-[10px] font-bold text-sky-700 ring-1 ring-sky-200 dark:bg-sky-500/15 dark:text-sky-300 dark:ring-sky-400/25">
                        NEW
                      </span>
                    ) : (
                      <span className="font-mono text-[11px] text-zinc-300 dark:text-zinc-600">—</span>
                    )}
                  </div>
                </motion.button>
              )
            })}
          </div>

          {/* Interactive Timeline Scrubber Bar */}
          <div className="mt-7 flex flex-wrap items-center gap-4 border-t border-zinc-200/80 pt-5 dark:border-white/[0.08]">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (editions[0]) onSelectYear(editions[0].year)
                }}
                aria-label="첫 연도로 이동"
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-zinc-200 bg-zinc-50 text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-950 dark:border-white/12 dark:bg-white/[0.04] dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-white"
              >
                <SkipBack className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={onTogglePlay}
                aria-label={playing ? "일시정지" : "연도 재생"}
                className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-zinc-950 text-white shadow-md transition-transform hover:scale-105 active:scale-95 dark:bg-white dark:text-black dark:shadow-white/15"
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
                <div className="h-1.5 w-full rounded-full bg-zinc-200 dark:bg-white/10" />
                <motion.div
                  className="pointer-events-none absolute left-0 h-1.5 rounded-full bg-gradient-to-r from-teal-600 to-teal-500 dark:from-teal-500 dark:to-cyan-300"
                  initial={false}
                  animate={{
                    width:
                      editions.length > 1
                        ? `${(yearIndex / (editions.length - 1)) * 100}%`
                        : "100%",
                  }}
                  transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                />
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
                <motion.div
                  className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 rounded-full border-2 border-white bg-teal-600 shadow-sm dark:border-[#0d1017] dark:bg-teal-300"
                  initial={false}
                  animate={{
                    left:
                      editions.length > 1
                        ? `${(yearIndex / (editions.length - 1)) * 100}%`
                        : "100%",
                  }}
                  transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
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
                        ? "font-bold text-zinc-950 dark:text-white"
                        : "text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300"
                    )}
                  >
                    {ed.year}
                  </button>
                ))}
              </div>
            </div>

            {/* Step Counter & Replay */}
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
                {playing ? (
                  <span className="font-semibold text-teal-700 dark:text-teal-300">
                    {playRound}/{totalPlayRounds}회
                  </span>
                ) : (
                  `${yearIndex + 1} / ${editions.length}`
                )}
              </span>
              <button
                type="button"
                onClick={onReplay}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-3.5 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-white/12 dark:bg-white/[0.04] dark:text-zinc-200 dark:hover:bg-white/10"
              >
                <RotateCcw className="h-3.5 w-3.5" /> 다시 재생
              </button>
            </div>
          </div>

          {/* Pagination Footer */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-4 text-xs dark:border-white/[0.06]">
            <div className="font-mono text-zinc-500">
              전체 {edition.rows.length}개 단위 · {editions.length}개 공시연도
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={safePage === 0}
                onClick={() => onPageChange(safePage - 1)}
                aria-label="이전 구간"
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-35 dark:border-white/12 dark:bg-white/[0.04] dark:text-zinc-200 dark:hover:bg-white/10"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <select
                value={safePage}
                onChange={(e) => onPageChange(Number(e.target.value))}
                aria-label="순위 구간"
                className="h-8 cursor-pointer rounded-lg border border-zinc-200 bg-white px-2.5 font-mono text-xs text-zinc-800 outline-none focus:border-teal-600 dark:border-white/12 dark:bg-[#121621] dark:text-zinc-200 dark:focus:border-teal-400"
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
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-35 dark:border-white/12 dark:bg-white/[0.04] dark:text-zinc-200 dark:hover:bg-white/10"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </article>

        {/* RIGHT: SELECTED UNIVERSITY INSPECTOR */}
        {selectedRow ? (
          <aside className="sticky top-6 rounded-[28px] border border-zinc-200/90 bg-white p-6 shadow-[0_24px_70px_-30px_rgba(15,23,42,0.14)] transition-colors duration-300 dark:border-white/10 dark:bg-[#0d1017]/95 dark:shadow-2xl">
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
                  <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-orange-600 dark:text-orange-300">
                    <span>{edition.year} 공시</span>
                    <span>·</span>
                    <span>{selectedRow.rank}위</span>
                    {selectedRow.designation ? (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] text-amber-800 dark:bg-amber-500/20 dark:text-amber-200">
                        글로컬 {selectedRow.designation}
                      </span>
                    ) : null}
                  </div>
                  <h3 className="mt-1 text-xl font-extrabold tracking-tight text-zinc-950 dark:text-white sm:text-2xl">
                    {selectedRow.name}
                  </h3>
                  <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                    {selectedRow.region} · 전년 대비{" "}
                    <span
                      className={cn(
                        "font-mono font-semibold",
                        selectedDelta.kind === "up"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : selectedDelta.kind === "down"
                            ? "text-amber-600 dark:text-amber-300"
                            : "text-zinc-700 dark:text-zinc-300"
                      )}
                    >
                      {selectedDelta.label}
                    </span>
                  </p>
                </div>
              </div>

              <div className="text-right">
                <div className="font-mono text-3xl font-black tracking-tight tabular-nums text-zinc-950 dark:text-white">
                  {selectedRow.score.toFixed(2)}
                </div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                  / 100 PTS
                </div>
              </div>
            </div>

            {/* Metric Breakdown */}
            <div className="mt-5 space-y-3 border-t border-zinc-200/80 pt-5 dark:border-white/10">
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
                      <span className="font-medium text-zinc-800 dark:text-zinc-200">
                        {label}{" "}
                        {direction ? (
                          <span className="font-mono text-[10px] text-zinc-400 dark:text-zinc-500">
                            {direction}
                          </span>
                        ) : null}
                      </span>
                      <span className="font-mono text-[11px] tabular-nums text-zinc-600 dark:text-zinc-300">
                        <strong className="text-zinc-950 dark:text-white">{pts.toFixed(2)}</strong>
                        <span className="text-zinc-400 dark:text-zinc-500"> / {cap}</span>
                      </span>
                    </div>

                    <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-white/[0.06]">
                      <motion.div
                        className={cn(
                          "h-full rounded-full",
                          isResearch
                            ? "bg-gradient-to-r from-orange-600 to-amber-500 dark:from-orange-600/80 dark:to-amber-400/90"
                            : "bg-gradient-to-r from-teal-600 to-emerald-500 dark:from-teal-600/80 dark:to-emerald-400/85"
                        )}
                        initial={false}
                        animate={{ width: `${ratio}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
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
            <div className="mt-6 border-t border-zinc-200/80 pt-5 dark:border-white/10">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
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
                accent={selectedSwatch.accent}
                theme={theme}
                onSelectYear={onSelectYear}
              />
            </div>

            {/* Source Links */}
            <div className="mt-5 flex flex-wrap gap-2 border-t border-zinc-200/80 pt-4 text-xs dark:border-white/10">
              {selectedRow.source ? (
                <a
                  href={selectedRow.source}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-zinc-700 transition-colors hover:border-zinc-400 hover:text-zinc-950 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-300 dark:hover:border-orange-400/40 dark:hover:text-white"
                >
                  OpenAlex 기관 원문 <ExternalLink className="h-3 w-3" />
                </a>
              ) : null}
              {selectedRow.points[8] && selectedRow.designation && GLOCAL_LINKS[selectedRow.designation] ? (
                <a
                  href={GLOCAL_LINKS[selectedRow.designation]}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-zinc-700 transition-colors hover:border-zinc-400 hover:text-zinc-950 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-300 dark:hover:border-orange-400/40 dark:hover:text-white"
                >
                  글로컬 본지정 자료 <ExternalLink className="h-3 w-3" />
                </a>
              ) : null}
              {selectedRow.name === "서울대학교" ? (
                <a
                  href="https://www.timeshighereducation.com/student/best-universities/best-universities-south-korea"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-zinc-700 transition-colors hover:border-zinc-400 hover:text-zinc-950 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-300 dark:hover:border-orange-400/40 dark:hover:text-white"
                >
                  <Sparkles className="h-3 w-3 text-amber-500 dark:text-amber-300" />
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
  theme,
  onSelectYear,
}: {
  points: { year: number; score: number | null; rank: number | null }[]
  activeYear: number
  accent: string
  theme: ThemeMode
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
      <div className="flex h-20 items-center justify-center rounded-xl bg-zinc-100 text-xs text-zinc-500 dark:bg-white/[0.03]">
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

  const isDark = theme === "dark"

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-[88px] w-full overflow-visible rounded-xl border border-zinc-200/80 bg-zinc-50 dark:border-white/8 dark:bg-black/35"
      role="img"
      aria-label="연도별 점수 추이 차트"
    >
      <defs>
        <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity={isDark ? "0.28" : "0.22"} />
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
            stroke={isDark ? "rgba(255,255,255,0.06)" : "rgba(20,21,26,0.08)"}
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
              fill={c.year === activeYear ? (isDark ? "#ffffff" : "#ffffff") : accent}
              stroke={accent}
              strokeWidth="2"
            />
            <text
              x={c.x}
              y={height - 2}
              textAnchor="middle"
              fill={
                c.year === activeYear
                  ? isDark
                    ? "#ffffff"
                    : "#14151a"
                  : isDark
                    ? "#71717a"
                    : "#71717a"
              }
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
