import * as React from "react"
import { ArchiveFoldersSection } from "@/components/ArchiveFoldersSection"
import { MethodologySection } from "@/components/MethodologySection"
import { RaceSection } from "@/components/RaceSection"
import { RankingTableSection } from "@/components/RankingTableSection"
import { SplineMoodHero } from "@/components/SplineMoodHero"
import {
  type CompareMode,
  type DisclosurePayload,
  type DisclosureStatus,
  type EditionSlice,
  type UniversityRow,
  formatKst,
} from "@/types/ranking"

const SAVED_STORAGE_KEY = "kor_uni_ranking_saved_v1"
const GROUP_SIZE = 20

export default function App() {
  const [rawBook, setRawBook] = React.useState<DisclosurePayload | null>(null)
  const [status, setStatus] = React.useState<DisclosureStatus | null>(null)
  const [loadError, setLoadError] = React.useState<string | null>(null)

  const [mode, setMode] = React.useState<CompareMode>("combined")
  const [year, setYear] = React.useState<number | null>(null)
  const [page, setPage] = React.useState(0)
  const [selectedId, setSelectedId] = React.useState<string>("")
  const [searchTerm, setSearchTerm] = React.useState("")
  const [playing, setPlaying] = React.useState(false)

  const [savedIds, setSavedIds] = React.useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(SAVED_STORAGE_KEY)
      if (!stored) return []
      const parsed = JSON.parse(stored)
      return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : []
    } catch {
      return []
    }
  })

  React.useEffect(() => {
    try {
      localStorage.setItem(SAVED_STORAGE_KEY, JSON.stringify(savedIds))
    } catch {
      // Ignore storage quota errors
    }
  }, [savedIds])

  const versionRef = React.useRef<string | undefined>(undefined)
  const checkingRef = React.useRef(false)

  const syncData = React.useCallback(async () => {
    if (checkingRef.current) return
    checkingRef.current = true
    try {
      const endpoint = versionRef.current ? "/api/status" : "/api/data"
      const res = await fetch(endpoint, { cache: "no-store" })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const meta = await res.json()

      if (!versionRef.current || meta.version !== versionRef.current) {
        const incoming: DisclosurePayload = meta.editions
          ? meta
          : await (await fetch("/api/data", { cache: "no-store" })).json()
        versionRef.current = incoming.version
        setRawBook(incoming)
        setYear((prev) => {
          if (prev && incoming.editions.some((e) => e.year === prev)) return prev
          return incoming.editions.at(-1)?.year ?? null
        })
      }
      setStatus({
        version: meta.version,
        checked: meta.checked,
        published: meta.published,
        error: meta.error,
      })
      setLoadError(null)
    } catch {
      if (!versionRef.current) {
        setLoadError("공시 데이터를 불러오는 중입니다. 잠시 후 자동으로 다시 시도합니다.")
      }
    } finally {
      checkingRef.current = false
    }
  }, [])

  React.useEffect(() => {
    syncData()
    const id = window.setInterval(syncData, 30000)
    return () => window.clearInterval(id)
  }, [syncData])

  const editions: EditionSlice[] = React.useMemo(() => {
    if (!rawBook) return []
    return rawBook.editions.map((e) => (mode === "combined" ? e.combined : e))
  }, [rawBook, mode])

  const latestEdition = editions.at(-1) ?? null
  const currentEdition =
    editions.find((e) => e.year === year) ?? latestEdition

  // Keep selectedId valid when switching mode / year / page
  React.useEffect(() => {
    if (!currentEdition || currentEdition.rows.length === 0) return
    if (!currentEdition.rows.some((r) => r.id === selectedId)) {
      setSelectedId(currentEdition.rows[0].id)
    }
  }, [currentEdition, selectedId])

  // Auto-play yearly race timer
  React.useEffect(() => {
    if (!playing || editions.length < 2) return
    const id = window.setInterval(() => {
      setYear((prev) => {
        const idx = editions.findIndex((e) => e.year === prev)
        if (idx < 0 || idx >= editions.length - 1) {
          setPlaying(false)
          return editions.at(-1)!.year
        }
        const nextIdx = idx + 1
        if (nextIdx === editions.length - 1) {
          setPlaying(false)
        }
        return editions[nextIdx].year
      })
    }, 2300)
    return () => window.clearInterval(id)
  }, [playing, editions])

  const handleTogglePlay = React.useCallback(() => {
    if (editions.length < 2) return
    if (playing) {
      setPlaying(false)
      return
    }
    setYear(editions[0].year)
    setPlaying(true)
  }, [editions, playing])

  const handleModeChange = React.useCallback((nextMode: CompareMode) => {
    setPlaying(false)
    setMode(nextMode)
    setPage(0)
  }, [])

  const handleSelectSchool = React.useCallback(
    (row: UniversityRow, jumpPage = true) => {
      setPlaying(false)
      setSelectedId(row.id)
      if (jumpPage && currentEdition) {
        const idx = currentEdition.rows.findIndex((r) => r.id === row.id)
        if (idx >= 0) setPage(Math.floor(idx / GROUP_SIZE))
      }
    },
    [currentEdition]
  )

  const handleInspectAndScroll = React.useCallback(
    (row: UniversityRow) => {
      handleSelectSchool(row, true)
      document.getElementById("race")?.scrollIntoView({ behavior: "smooth" })
    },
    [handleSelectSchool]
  )

  const savedSet = React.useMemo(() => new Set(savedIds), [savedIds])

  const handleToggleSave = React.useCallback((row: UniversityRow) => {
    setSavedIds((prev) =>
      prev.includes(row.id)
        ? prev.filter((id) => id !== row.id)
        : [...prev, row.id]
    )
  }, [])

  const selectedRow = React.useMemo(() => {
    if (!currentEdition) return null
    return (
      currentEdition.rows.find((r) => r.id === selectedId) ??
      currentEdition.rows[0] ??
      null
    )
  }, [currentEdition, selectedId])

  const savedRows = React.useMemo(() => {
    if (!currentEdition) return []
    const byId = new Map(currentEdition.rows.map((r) => [r.id, r]))
    return savedIds
      .map((id) => byId.get(id))
      .filter((r): r is UniversityRow => Boolean(r))
  }, [currentEdition, savedIds])

  const handleAddCurrentToFolder = React.useCallback((): UniversityRow | null => {
    if (!selectedRow) return null
    if (savedIds.includes(selectedRow.id)) return null
    setSavedIds((prev) => [...prev, selectedRow.id])
    return selectedRow
  }, [selectedRow, savedIds])

  const yearRange =
    editions.length >= 2
      ? `${editions[0].year}–${editions.at(-1)!.year}`
      : `${latestEdition?.year ?? 2026}`

  const isLatest =
    Boolean(currentEdition && latestEdition && currentEdition.year === latestEdition.year) &&
    !playing

  return (
    <div className="min-h-screen bg-[#06070a] text-zinc-100">
      {/* 1. Spline Retrofuturism Diagonal Fluted Glass Hero */}
      <SplineMoodHero
        mode={mode}
        onModeChange={handleModeChange}
        latestYear={latestEdition?.year ?? 2026}
        schoolCount={currentEdition?.rows.length ?? 144}
        yearRange={yearRange}
        status={status}
        savedCount={savedRows.length}
      />

      {/* Loading / Error State Fallback */}
      {!currentEdition ? (
        <div className="mx-auto max-w-[1380px] px-5 py-24 text-center md:px-10">
          <div className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-4 text-sm text-zinc-300">
            <span className="h-2.5 w-2.5 animate-ping rounded-full bg-orange-400" />
            {loadError ?? "공시 데이터를 불러오는 중입니다…"}
          </div>
        </div>
      ) : (
        <>
          {/* 3. Live Telemetry Race Chart + University Detail Inspector */}
          <RaceSection
            editions={editions}
            edition={currentEdition}
            mode={mode}
            onModeChange={handleModeChange}
            selectedId={selectedId}
            onSelectSchool={handleSelectSchool}
            page={page}
            onPageChange={setPage}
            playing={playing}
            onTogglePlay={handleTogglePlay}
            onSelectYear={(y) => {
              setPlaying(false)
              setYear(y)
            }}
            isLatest={isLatest}
            onJumpLatest={() => {
              setPlaying(false)
              if (latestEdition) setYear(latestEdition.year)
            }}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            savedIds={savedSet}
            onToggleSave={handleToggleSave}
          />

          {/* 4. Methodology & Excluded Schools Accordion */}
          <MethodologySection edition={currentEdition} mode={mode} />

          {/* 5. Full Ranking Index Table */}
          <RankingTableSection
            editions={editions}
            edition={currentEdition}
            mode={mode}
            page={page}
            onPageChange={setPage}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            selectedId={selectedId}
            onSelectSchool={handleInspectAndScroll}
            savedIds={savedSet}
            onToggleSave={handleToggleSave}
          />
        </>
      )}

      {/* 6. Interactive Frosted Glass Folders (Bookmarks + Raw Sources + Portals) */}
      <ArchiveFoldersSection
        savedRows={savedRows}
        selectedRow={selectedRow}
        onAddCurrentSchool={handleAddCurrentToFolder}
        onJumpToSchool={handleInspectAndScroll}
        onClearSaved={() => setSavedIds([])}
      />

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#040507]">
        <div className="mx-auto flex w-full max-w-[1380px] flex-col justify-between gap-4 px-5 py-10 text-xs text-zinc-500 sm:flex-row sm:items-center md:px-10">
          <div>
            <div className="font-semibold text-zinc-300">
              대학 공시 레이스 · 자료 제공: 교육부·한국대학교육협의회 대학알리미, OpenAlex
            </div>
            <div className="mt-1">
              진학 참고용 자체 산정 결과이며, 개별 전형 결과는 대입정보포털 어디가에서 확인하세요.
            </div>
          </div>
          <div className="font-mono text-[11px] text-zinc-500 sm:text-right">
            <div>확인 · {formatKst(status?.checked)}</div>
            <div>반영 · {formatKst(status?.published)}</div>
          </div>
        </div>
      </footer>
    </div>
  )
}
