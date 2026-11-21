import * as React from "react"
import { ChevronLeft, ChevronRight, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  type CompareMode,
  type EditionSlice,
  type ExcludedRow,
  type UniversityRow,
  SEARCH_ALIASES,
  formatExclusionReason,
  getRankDelta,
} from "@/types/ranking"

interface RankingTableSectionProps {
  editions: EditionSlice[]
  edition: EditionSlice
  mode: CompareMode
  page: number
  onPageChange: (page: number) => void
  searchTerm: string
  onSearchChange: (term: string) => void
  selectedId: string
  onSelectSchool: (row: UniversityRow) => void
}

const GROUP_SIZE = 20

function isRankedRow(r: UniversityRow | ExcludedRow): r is UniversityRow {
  return "rank" in r && typeof r.rank === "number"
}

export function RankingTableSection({
  editions,
  edition,
  mode,
  page,
  onPageChange,
  searchTerm,
  onSearchChange,
  selectedId,
  onSelectSchool,
}: RankingTableSectionProps) {
  const pages = Math.max(1, Math.ceil(edition.rows.length / GROUP_SIZE))
  const safePage = Math.min(page, pages - 1)

  const displayRows = React.useMemo(() => {
    const raw = searchTerm.trim().toLowerCase().replace(/\s/g, "")
    if (raw) {
      const q = SEARCH_ALIASES[raw] || raw
      return [...edition.rows, ...edition.excluded].filter((r) =>
        r.name.toLowerCase().replace(/\s/g, "").includes(q.toLowerCase())
      )
    }
    return edition.rows.slice(safePage * GROUP_SIZE, (safePage + 1) * GROUP_SIZE)
  }, [edition, safePage, searchTerm])

  return (
    <section
      id="ranking"
      className="mx-auto w-full max-w-[1380px] px-5 py-12 md:px-10"
    >
      <div className="overflow-hidden rounded-[28px] border border-zinc-200/90 bg-white p-5 shadow-[0_24px_70px_-30px_rgba(15,23,42,0.12)] transition-colors duration-300 dark:border-white/10 dark:bg-[#0d1017]/95 dark:shadow-2xl sm:p-7">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-500">
              02 / COMPLETE INDEX
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-zinc-950 dark:text-white sm:text-3xl">
              {mode === "combined" ? "종합비교 전체 순위표" : "학생 Support 지수 전체 순위표"}
            </h2>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {searchTerm.trim()
                ? `검색 결과 ${displayRows.length}곳`
                : `${safePage * GROUP_SIZE + 1}–${Math.min(
                    (safePage + 1) * GROUP_SIZE,
                    edition.rows.length
                  )}번째 · 전체 ${edition.rows.length}곳`}
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="순위표 내 대학명 검색"
              aria-label="전체 공시 대학 검색"
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2 pr-4 pl-10 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900 dark:border-white/12 dark:bg-white/[0.04] dark:text-white dark:placeholder:text-zinc-500 dark:focus:border-orange-400/60"
            />
          </div>
        </div>

        <div className="max-h-[520px] overflow-auto rounded-2xl border border-zinc-200/80 dark:border-white/8">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="sticky top-0 z-10 bg-zinc-50 font-mono text-[11px] uppercase tracking-wider text-zinc-500 dark:bg-[#12151f] dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3.5">순위</th>
                <th className="px-4 py-3.5">대학</th>
                <th className="hidden px-4 py-3.5 sm:table-cell">지역</th>
                <th className="px-4 py-3.5 text-right">점수</th>
                <th className="px-4 py-3.5 text-right">전년 대비</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-white/[0.06]">
              {displayRows.map((item) => {
                if (!isRankedRow(item)) {
                  return (
                    <tr key={item.id} className="bg-zinc-50/50 text-zinc-400 dark:bg-white/[0.01] dark:text-zinc-500">
                      <td className="px-4 py-3 font-mono text-xs">미산정</td>
                      <td className="px-4 py-3" colSpan={4}>
                        <span className="font-medium text-zinc-600 dark:text-zinc-400">{item.name}</span>
                        <span className="ml-2 text-xs text-zinc-400 dark:text-zinc-600">
                          · 제외 사유: {formatExclusionReason(item)}
                        </span>
                      </td>
                    </tr>
                  )
                }

                const delta = getRankDelta(editions, edition.year, item)
                const active = item.id === selectedId

                return (
                  <tr
                    key={item.id}
                    className={cn(
                      "transition-colors hover:bg-zinc-50 dark:hover:bg-white/[0.04]",
                      active && "bg-orange-50/80 dark:bg-orange-500/[0.08]"
                    )}
                  >
                    <td className="px-4 py-3 font-mono text-xs font-semibold tabular-nums text-zinc-600 dark:text-zinc-300">
                      #{String(item.rank).padStart(2, "0")}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => onSelectSchool(item)}
                        className="cursor-pointer text-left font-medium text-zinc-900 underline-offset-4 hover:text-orange-600 hover:underline dark:text-zinc-100 dark:hover:text-orange-300"
                      >
                        {item.name}
                      </button>
                      {item.designation ? (
                        <span className="ml-2 hidden rounded-full bg-amber-100 px-2 py-0.5 font-mono text-[10px] text-amber-800 dark:bg-orange-500/15 dark:text-orange-300 md:inline-block">
                          글로컬 {item.designation}
                        </span>
                      ) : null}
                    </td>
                    <td className="hidden px-4 py-3 text-xs text-zinc-500 dark:text-zinc-400 sm:table-cell">
                      {item.region}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs font-bold tabular-nums text-zinc-950 dark:text-white">
                      {item.score.toFixed(2)}
                    </td>
                    <td
                      className={cn(
                        "px-4 py-3 text-right font-mono text-xs tabular-nums",
                        delta.kind === "up"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : delta.kind === "down"
                            ? "text-amber-600 dark:text-amber-300"
                            : delta.kind === "new"
                              ? "text-sky-600 dark:text-amber-300"
                              : "text-zinc-400 dark:text-zinc-500"
                      )}
                    >
                      {delta.label}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {!searchTerm.trim() ? (
          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              type="button"
              disabled={safePage === 0}
              onClick={() => onPageChange(safePage - 1)}
              className="inline-flex cursor-pointer items-center gap-1 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-35 dark:border-white/12 dark:bg-white/[0.04] dark:text-zinc-200 dark:hover:bg-white/10"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> 이전 20곳
            </button>
            <button
              type="button"
              disabled={safePage >= pages - 1}
              onClick={() => onPageChange(safePage + 1)}
              className="inline-flex cursor-pointer items-center gap-1 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-35 dark:border-white/12 dark:bg-white/[0.04] dark:text-zinc-200 dark:hover:bg-white/10"
            >
              다음 20곳 <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : null}
      </div>
    </section>
  )
}
