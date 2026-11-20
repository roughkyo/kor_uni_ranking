import GlassFolder, { type FolderFile } from "@/components/ui/glass-folder-cards"

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
    art: "glacier",
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
    art: "dusk",
    href: "https://www.ebsi.co.kr/",
  },
  {
    name: "한국교육과정평가원",
    meta: "수능·모의평가",
    art: "verdant",
    href: "https://www.suneung.re.kr/",
  },
]

const GLOBAL_FILES: FolderFile[] = [
  {
    name: "THE 한국 대학 순위",
    meta: "교육·연구 평가",
    art: "ember",
    href: "https://www.timeshighereducation.com/student/best-universities/best-universities-south-korea",
  },
  {
    name: "QS 세계대학평가",
    meta: "평판·인용 기준",
    art: "dusk",
    href: "https://support.qs.com/hc/en-gb/articles/4405955370898-QS-World-University-Rankings",
  },
  {
    name: "ARWU 상하이랭킹",
    meta: "연구 성취 기준",
    art: "aurora",
    href: "https://www.shanghairanking.com/methodology/arwu/2026",
  },
  {
    name: "GitHub 자동 갱신",
    meta: "매시간 수집 기록",
    art: "verdant",
    href: "https://github.com/roughkyo/kor_uni_ranking/actions/workflows/2026-11-19-refresh.yml",
  },
]

export function ArchiveFoldersSection() {
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
        <div className="mb-12 max-w-2xl">
          <div className="mb-2 font-mono text-[11px] uppercase tracking-[0.16em] text-orange-400">
            03 / INTERACTIVE GLASS ARCHIVE
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            공시 · 입시 원자료 아카이브
          </h2>
          <p className="mt-2.5 text-sm leading-relaxed text-zinc-400">
            핵심 공시·입시·국제평가 원자료 카드가 폴더 위로 미리 꺼내져 있습니다.
            원하는 폴더를 <strong className="text-white">클릭하면 크게 확대되며 펼쳐지고</strong>, 개별 카드를 누르면 공식 원문 페이지로 바로 이동합니다.
          </p>
        </div>

        <div className="grid grid-cols-1 items-end justify-items-center gap-x-12 gap-y-20 pt-8 md:grid-cols-2 xl:grid-cols-3">
          {/* Folder 1: Disclosure & Research Raw Sources */}
          <div className="flex flex-col items-center gap-4">
            <GlassFolder
              label="공시 · 연구 원자료"
              meta="4개 공식 출처"
              tone="dark"
              art="aurora"
              seed={3}
              action="more"
              labelPlacement="top-left"
              width={326}
              appearDelay={0}
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
                  label: "공공데이터포털 ↗",
                  onSelect: () =>
                    window.open(
                      "https://www.data.go.kr/data/15118998/fileData.do",
                      "_blank",
                      "noopener,noreferrer"
                    ),
                },
              ]}
            />
            <span className="text-xs text-zinc-500">
              대학알리미 · OpenAlex · 공공데이터포털 · 글로컬
            </span>
          </div>

          {/* Folder 2: Admission & Scholarship Portals */}
          <div className="flex flex-col items-center gap-4">
            <GlassFolder
              label="입시 · 장학 포털"
              meta="어디가 · 장학재단"
              tone="dark"
              art="ember"
              seed={11}
              action="more"
              labelPlacement="top-left"
              width={326}
              appearDelay={140}
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
              전형 결과 · 국가장학금 · EBSi · 평가원
            </span>
          </div>

          {/* Folder 3: Global Rankings & Open Automation */}
          <div className="flex flex-col items-center gap-4">
            <GlassFolder
              label="국제평가 · 갱신 이력"
              meta="THE · QS · ARWU"
              tone="dark"
              art="dusk"
              seed={7}
              action="more"
              labelPlacement="top-left"
              width={326}
              appearDelay={280}
              files={GLOBAL_FILES}
              menu={[
                {
                  label: "THE 한국 대학 순위 ↗",
                  onSelect: () =>
                    window.open(
                      "https://www.timeshighereducation.com/student/best-universities/best-universities-south-korea",
                      "_blank",
                      "noopener,noreferrer"
                    ),
                },
                {
                  label: "QS 평가 기준 ↗",
                  onSelect: () =>
                    window.open(
                      "https://support.qs.com/hc/en-gb/articles/4405955370898-QS-World-University-Rankings",
                      "_blank",
                      "noopener,noreferrer"
                    ),
                },
                {
                  label: "GitHub 자동 갱신 ↗",
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
              국제 대학평가 기준 비교 · GitHub Actions
            </span>
          </div>
        </div>

        <p className="mt-16 text-center font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-500">
          Click any glass folder to zoom &amp; fan cards · Click a card to open source
        </p>
      </div>
    </section>
  )
}
