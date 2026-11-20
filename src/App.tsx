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

export default function App() {
  const [rawBook, setRawBook] = React.useState<DisclosurePayload | null>(null)
  const [status, setStatus] = React.useState<DisclosureStatus | null>(null)
  const [loadError, setLoadError] = React.useState<string | null>(null)

  const [mode, setMode] = React.useState<CompareMode>("combined")
  const [year, setYear] = React.useState<number | null>(null)
  const [page, setPage] = React.useState(0)
  const [racePageSize, setRacePageSize] = React.useState(10)
  const [tablePage, setTablePage] = React.useState(0)
  const [selectedId, setSelectedId] = React.useState<string>("")
  const [searchTerm, setSearchTerm] = React.useState("")
  const [playing, setPlaying] = React.useState(false)
  const [playRound, setPlayRound] = React.useState(1)
  const playRoundRef = React.useRef(1)
  const yearIdxRef = React.useRef(0)
  const TOTAL_PLAY_ROUNDS = 3

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

  React.useEffect(() => {
    if (!currentEdition || currentEdition.rows.length === 0) return
    if (!currentEdition.rows.some((r) => r.id === selectedId)) {
      setSelectedId(currentEdition.rows[0].id)
    }
  }, [currentEdition, selectedId])

  React.useEffect(() => {
    const idx = editions.findIndex((e) => e.year === year)
    if (idx >= 0) yearIdxRef.current = idx
  }, [editions, year])

  React.useEffect(() => {
    if (!playing || editions.length < 2) return
    const id = window.setInterval(() => {
      if (yearIdxRef.current < editions.length - 1) {
        yearIdxRef.current += 1
        setYear(editions[yearIdxRef.current].year)
        return
      }
      if (playRoundRef.current < TOTAL_PLAY_ROUNDS) {
        playRoundRef.current += 1
        setPlayRound(playRoundRef.current)
        yearIdxRef.current = 0
        setYear(editions[0].year)
        return
      }
      setPlaying(false)
    }, 880)
    return () => window.clearInterval(id)
  }, [playing, editions])

  const handleTogglePlay = React.useCallback(() => {
    if (editions.length < 2) return
    if (playing) {
      setPlaying(false)
      return
    }
    playRoundRef.current = 1
    setPlayRound(1)
    if (year === editions.at(-1)?.year) {
      yearIdxRef.current = 0
      setYear(editions[0].year)
    }
    setPlaying(true)
  }, [editions, playing, year])

  const handleReplay = React.useCallback(() => {
    if (editions.length < 2) return
    playRoundRef.current = 1
    setPlayRound(1)
    yearIdxRef.current = 0
    setYear(editions[0].year)
    setPlaying(true)
  }, [editions])

  const handleModeChange = React.useCallback((nextMode: CompareMode) => {
    setPlaying(false)
    setMode(nextMode)
    setPage(0)
    setTablePage(0)
  }, [])

  const handleSelectSchool = React.useCallback(
    (row: UniversityRow, jumpPage = true) => {
      setPlaying(false)
      setSelectedId(row.id)
      if (jumpPage && currentEdition) {
        const idx = currentEdition.rows.findIndex((r) => r.id === row.id)
        if (idx >= 0) {
          setPage(Math.floor(idx / racePageSize))
          setTablePage(Math.floor(idx / 20))
        }
      }
    },
    [currentEdition, racePageSize]
  )

  const handleInspectAndScroll = React.useCallback(
    (row: UniversityRow) => {
      handleSelectSchool(row, true)
      document.getElementById("race")?.scrollIntoView({ behavior: "smooth" })
    },
    [handleSelectSchool]
  )

  const yearRange =
    editions.length >= 2
      ? `${editions[0].year}–${editions.at(-1)!.year}`
      : `${latestEdition?.year ?? 2026}`

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
          {/* 2. Sculpted Bar Race Chart + University Detail Inspector */}
          <RaceSection
            editions={editions}
            edition={currentEdition}
            mode={mode}
            onModeChange={handleModeChange}
            selectedId={selectedId}
            onSelectSchool={handleSelectSchool}
            page={page}
            pageSize={racePageSize}
            onPageSizeChange={(sz) => {
              setRacePageSize(sz)
              setPage(0)
            }}
            onPageChange={setPage}
            playing={playing}
            playRound={playRound}
            totalPlayRounds={TOTAL_PLAY_ROUNDS}
            onTogglePlay={handleTogglePlay}
            onReplay={handleReplay}
            onSelectYear={(y) => {
              setPlaying(false)
              setYear(y)
            }}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />

          {/* 3. Methodology & Excluded Schools Accordion */}
          <MethodologySection edition={currentEdition} mode={mode} />

          {/* 4. Full Ranking Index Table */}
          <RankingTableSection
            editions={editions}
            edition={currentEdition}
            mode={mode}
            page={tablePage}
            onPageChange={setTablePage}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            selectedId={selectedId}
            onSelectSchool={handleInspectAndScroll}
          />
        </>
      )}

      {/* 5. Interactive Frosted Glass Archive Folders */}
      <ArchiveFoldersSection />

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
