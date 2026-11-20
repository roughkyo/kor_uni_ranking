import * as React from "react"
import GlassFolder, { type ArtPreset, type FolderFile } from "@/components/ui/glass-folder-cards"
import type { UniversityRow } from "@/types/ranking"

interface ArchiveFoldersSectionProps {
  savedRows: UniversityRow[]
  selectedRow: UniversityRow | null
  onAddCurrentSchool: () => UniversityRow | null
  onJumpToSchool: (row: UniversityRow) => void
  onClearSaved: () => void
}

const ART_CYCLE: ArtPreset[] = ["ember", "aurora", "dusk", "verdant"]

const DISCLOSURE_FILES: FolderFile[] = [
  {
    name: "대학알리미 원자료",
    meta: "공시 포털",
    art: "aurora",
    href: "https://www.academyinfo.go.kr/main/main2130/doInit.do",
  },
  {
    name: "OpenAlex 연구 DB",
    meta: "출판·인용",
    art: "dusk",
    href: "https://openalex.org/",
  },
  {
    name: "공공데이터포털",
    meta: "교육부 API",
    href: "https://www.data.go.kr/data/15118998/fileData.do",
  },
  {
    name: "글로컬대학 성과평가",
    meta: "교육부 원문",
    art: "verdant",
    href: "https://www.moe.go.kr/boardCnts/viewRenew.do?boardID=294&boardSeq=106590",
  },
]

const ADMISSION_FILES: FolderFile[] = [
  {
    name: "대입정보포털 어디가",
    meta: "전형 결과",
    art: "ember",
    href: "https://www.adiga.kr/uct/acd/ade/criteriaAndResultView.do?menuId=PCUCTACD2000",
  },
  {
    name: "한국장학재단",
    meta: "국가장학금",
    art: "aurora",
    href: "https://www.kosaf.go.kr/ko/scholar.do?pg=scholarship05_12_05",
  },
  {
    name: "EBSi 입시 정보",
    meta: "수능 학습",
    href: "https://www.ebsi.co.kr/",
  },
  {
    name: "THE 한국 대학 순위",
    meta: "국제 평가",
    art: "dusk",
    href: "https://www.timeshighereducation.com/student/best-universities/best-universities-south-korea",
  },
]

export function ArchiveFoldersSection({
  savedRows,
  selectedRow,
  onAddCurrentSchool,
  onJumpToSchool,
  onClearSaved,
}: ArchiveFoldersSectionProps) {
  const savedFiles: FolderFile[] = React.useMemo(() => {
    if (savedRows.length === 0) {
      return [
        {
          name: "아직 담은 대학 없음",
          meta: "+ 눌러 추가",
        },
      ]
    }
    return savedRows.map((row, idx) => ({
      name: row.name,
      meta: `#${row.rank} · ${row.score.toFixed(1)}점`,
      art: ART_CYCLE[idx % ART_CYCLE.length],
    }))
  }, [savedRows])

  return (
    <section
      id="archive"
      className="relative overflow-hidden border-t border-white/10 bg-[#050609] py-24"
    >
      {/* Dotted architect desk backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 text-white opacity-[0.09]"
        style={{
          backgroundImage: "radial-gradient(currentColor 1.1px, transparent 1.4px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative mx-auto w-full max-w-[1380px] px-5 md:px-10">
        <div className="mb-14 max-w-2xl">
          <div className="mb-2 font-mono text-[11px] uppercase tracking-[0.16em] text-orange-400">
            03 / INTERACTIVE GLASS ARCHIVE
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            관심 대학 보관함 · 공시 원자료 폴더
          </h2>
          <p className="mt-2.5 text-sm leading-relaxed text-zinc-400">
            폴더 위에 커서를 올리면 유리가 기울고, 클릭하면 안쪽 카드가 부채꼴로 펼쳐집니다.
            첫 번째 폴더의 <strong className="text-white">+ 버튼</strong>을 누르면 현재 선택한{" "}
            <span className="text-orange-300">
              {selectedRow ? selectedRow.name : "대학"}
            </span>
            이(가) 보관함에 바로 담깁니다.
          </p>
        </div>

        <div className="grid grid-cols-1 items-end justify-items-center gap-x-12 gap-y-16 md:grid-cols-2 xl:grid-cols-3">
          {/* Folder 1: User's Saved Universities */}
          <div className="flex flex-col items-center gap-4">
            <GlassFolder
              label="내 관심 대학"
              meta={
                savedRows.length > 0
                  ? `${savedRows.length}곳 보관 중`
                  : "비어 있음"
              }
              tone="dark"
              art="ember"
              seed={11}
              action="add"
              width={320}
              appearDelay={0}
              files={savedFiles}
              onAdd={() => {
                const added = onAddCurrentSchool()
                if (!added) {
                  return {
                    name: selectedRow ? selectedRow.name : "이미 보관됨",
                    meta: selectedRow ? `#${selectedRow.rank} · 보관 완료` : "확인",
                    art: "ember",
                  }
                }
                return {
                  name: added.name,
                  meta: `#${added.rank} · ${added.score.toFixed(1)}점`,
                  art: ART_CYCLE[savedRows.length % ART_CYCLE.length],
                }
              }}
              onFileSelect={(_, index) => {
                const target = savedRows[index]
                if (target) onJumpToSchool(target)
              }}
            />
            <div className="flex items-center gap-3 text-xs text-zinc-500">
              <span>+ 클릭으로 현재 대학 담기</span>
              {savedRows.length > 0 ? (
                <button
                  type="button"
                  onClick={onClearSaved}
                  className="cursor-pointer text-rose-400/80 underline-offset-4 hover:text-rose-300 hover:underline"
                >
                  비우기
                </button>
              ) : null}
            </div>
          </div>

          {/* Folder 2: Disclosure & Research Raw Sources */}
          <div className="flex flex-col items-center gap-4">
            <GlassFolder
              label="공시 · 연구 원자료"
              meta="4개 공식 출처"
              tone="dark"
              art="aurora"
              seed={3}
              action="more"
              labelPlacement="top-left"
              width={320}
              appearDelay={140}
              files={DISCLOSURE_FILES}
              menu={[
                {
                  label: "대학알리미 바로가기 ↗",
                  onSelect: () =>
                    window.open(
                      "https://www.academyinfo.go.kr/main/main2130/doInit.do",
                      "_blank",
                      "noopener,noreferrer"
                    ),
                },
                {
                  label: "OpenAlex 원자료 ↗",
                  onSelect: () =>
                    window.open("https://openalex.org/", "_blank", "noopener,noreferrer"),
                },
                {
                  label: "GitHub 갱신 이력 ↗",
                  onSelect: () =>
                    window.open(
                      "https://github.com/roughkyo/kor_uni_ranking/actions/workflows/2026-11-19-refresh.yml",
                      "_blank",
                      "noopener,noreferrer"
                    ),
                },
              ]}
            />
            <span className="text-xs text-zinc-500">
              대학알리미 · OpenAlex · 공공데이터포털
            </span>
          </div>

          {/* Folder 3: Admission & Scholarship Portals */}
          <div className="flex flex-col items-center gap-4">
            <GlassFolder
              label="입시 · 장학 포털"
              meta="어디가 · 장학재단"
              tone="dark"
              art="dusk"
              seed={7}
              action="more"
              labelPlacement="top-left"
              width={320}
              appearDelay={280}
              files={ADMISSION_FILES}
              menu={[
                {
                  label: "어디가 전형결과 ↗",
                  onSelect: () =>
                    window.open(
                      "https://www.adiga.kr/uct/acd/ade/criteriaAndResultView.do?menuId=PCUCTACD2000",
                      "_blank",
                      "noopener,noreferrer"
                    ),
                },
                {
                  label: "한국장학재단 ↗",
                  onSelect: () =>
                    window.open(
                      "https://www.kosaf.go.kr/ko/scholar.do?pg=scholarship05_12_05",
                      "_blank",
                      "noopener,noreferrer"
                    ),
                },
                {
                  label: "한국교육과정평가원 ↗",
                  onSelect: () =>
                    window.open("https://www.suneung.re.kr/", "_blank", "noopener,noreferrer"),
                },
              ]}
            />
            <span className="text-xs text-zinc-500">
              전형 결과 · 국가장학금 · 국제평가 비교
            </span>
          </div>
        </div>

        <p className="mt-16 text-center font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-500">
          Hover to tilt · Click glass to fan cards · + to bookmark university
        </p>
      </div>
    </section>
  )
}
