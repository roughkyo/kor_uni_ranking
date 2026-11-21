import * as React from "react"
import { ChevronDown, ExternalLink, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  type CompareMode,
  type EditionSlice,
  formatExclusionReason,
  getMetricMeta,
} from "@/types/ranking"

interface MethodologySectionProps {
  edition: EditionSlice
  mode: CompareMode
}

export function MethodologySection({ edition, mode }: MethodologySectionProps) {
  const [open, setOpen] = React.useState(false)
  const [showExcluded, setShowExcluded] = React.useState(false)
  const { labels } = React.useMemo(() => getMetricMeta(mode), [mode])

  const sensitivityText = React.useMemo(() => {
    if (mode === "combined") {
      return "연구량은 기관 전체 규모와 전공 구성에 영향을 받습니다. 세부 점수와 기관별 OpenAlex 원문을 함께 확인하세요."
    }
    const topRows = edition.rows.filter((r) => r.rank <= 100)
    if (edition.rows.length < 100) return ""
    const overlap = labels.map((label, i) => {
      const scores = edition.rows
        .map((r) => r.score - (r.points[i] ?? 0))
        .sort((a, b) => b - a)
      const cutoff = scores[99] - 1e-9
      const count = topRows.filter((r) => r.score - (r.points[i] ?? 0) >= cutoff).length
      return `${label} 제외 ${count}곳`
    })
    return `한 지표를 빼고 다시 계산했을 때 현재 상위권과 겹치는 수 (${topRows.length}곳 중) · ${overlap.join(" / ")}`
  }, [edition.rows, labels, mode])

  return (
    <section className="mx-auto w-full max-w-[1380px] px-5 py-6 md:px-10">
      <div className="overflow-hidden rounded-3xl border border-zinc-200/90 bg-white shadow-xs transition-colors duration-300 dark:border-white/10 dark:bg-white/[0.025] dark:backdrop-blur-xl">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex w-full cursor-pointer items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-white/[0.03]"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 text-orange-600 dark:border-white/10 dark:bg-white/[0.05] dark:text-orange-300">
              <Info className="h-4 w-4" />
            </span>
            <div>
              <div className="text-sm font-bold text-zinc-950 dark:text-white sm:text-base">
                순위는 어떻게 계산했나요?
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                종합비교(연구 50 + 학생 Support 지수 50) 산식, 배점표, 글로컬대학 반영 기준 및 제외 목록 ({edition.excluded.length}곳)
              </div>
            </div>
          </div>
          <ChevronDown
            className={cn(
              "h-5 w-5 shrink-0 text-zinc-400 transition-transform duration-300",
              open && "rotate-180"
            )}
          />
        </button>

        {open ? (
          <div className="space-y-6 border-t border-zinc-200/80 px-6 py-6 text-sm leading-relaxed text-zinc-700 dark:border-white/10 dark:text-zinc-300">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50 p-5 dark:border-white/8 dark:bg-black/35">
                <h3 className="text-base font-bold text-orange-700 dark:text-orange-300">
                  종합비교 · 연구활동 50점 + 학생 Support 지수 50점
                </h3>
                <p className="mt-2.5 text-xs leading-relaxed text-zinc-700 dark:text-zinc-300">
                  각 공시연도 직전 3개년의 OpenAlex 출판물 수와 인용 수를 각각 25점으로 환산합니다.
                  항목 점수는{" "}
                  <code className="rounded bg-orange-100 px-1.5 py-0.5 font-mono text-[11px] text-orange-900 dark:bg-white/10 dark:text-orange-200">
                    25 × √(대학 수치 ÷ 비교 집단 최댓값)
                  </code>
                  이며, 학생 Support 지수 원점수(100점)의 절반을 더합니다.
                </p>
                <p className="mt-2.5 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                  국내 교육기관의 한국어 이름과 공시 대학명을 일대일로 대조합니다. 고유하게 확인되지 않거나 3개년 집계가 부족한 대학은 종합 미산정으로 표시하며 학생 Support 지수 탭에서 별도 확인할 수 있습니다.
                </p>
                <a
                  href="https://help.openalex.org/data/common-attributes/"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-orange-700 hover:underline dark:text-orange-300"
                >
                  OpenAlex 연도별 지표 정의 <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50 p-5 dark:border-white/8 dark:bg-black/35">
                <h3 className="text-base font-bold text-teal-700 dark:text-cyan-300">
                  학생 Support 지수 · 공시 및 국가육성사업 100점 (11개 지표)
                </h3>
                <p className="mt-2.5 text-xs leading-relaxed text-zinc-700 dark:text-zinc-300">
                  일반대학 본·분교 및 캠퍼스를 대학알리미 공시 단위로 비교합니다. 명목 등록금·장학금 중복 계산을 없앤{" "}
                  <strong className="text-zinc-900 dark:text-zinc-100">실부담 등록금(등록금−장학금, 하한 0원)</strong>,{" "}
                  <strong className="text-zinc-900 dark:text-zinc-100">교육비 환원율(교육비÷등록금)</strong>,{" "}
                  <strong className="text-zinc-900 dark:text-zinc-100">전임교원 확보율(재학생 기준)</strong>,{" "}
                  <strong className="text-zinc-900 dark:text-zinc-100">신입생 충원율(60~100% 선형)</strong>에 더해
                  국가 대형 거점국립대 육성 정책인{" "}
                  <strong className="text-zinc-900 dark:text-zinc-100">‘서울대 10개 만들기’ 선정 가점</strong>을 반영합니다.
                  1인당 교육비·환원율은 상하위 2% 윈저화{" "}
                  <code className="rounded bg-teal-100 px-1.5 py-0.5 font-mono text-[11px] text-teal-900 dark:bg-white/10 dark:text-cyan-200">
                    log(1+x)
                  </code>
                  로 실제 투자 격차를 살리고, 기숙사(100%)·교원확보율(150%)은 이상치 상한 캡을 적용합니다.
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5 font-mono text-[11px]">
                  {[
                    "1인당 교육비 20",
                    "실부담 등록금 16",
                    "교육비 환원율 12",
                    "전임교원 확보율 12",
                    "취업률 10",
                    "기숙사 8",
                    "신입생 충원율 6",
                    "전임강의 5",
                    "도서 4",
                    "글로컬 3",
                    "서울대10개 4",
                  ].map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md border border-zinc-200 bg-white px-2 py-0.5 text-zinc-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-200"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <p className="mt-3 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                  글로컬대학은 2023~2025년 본지정 명단에 따라 지정연도부터 3점(2026년 충북대·국립한국교통대 지정 취소 적용),
                  ‘서울대 10개 만들기’는 2026년 1차 집중 지원 선정 거점국립대(부산대·전남대·충남대)에 2026년부터 4점을 반영했습니다.
                </p>
                <div className="mt-2.5 flex flex-wrap gap-3 text-xs">
                  <a
                    href="https://blog.naver.com/moeblog/224397499595"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-medium text-teal-700 hover:underline dark:text-cyan-300"
                  >
                    교육부 ‘서울대 10개 만들기’ 발표 <ExternalLink className="h-3 w-3" />
                  </a>
                  <a
                    href="https://namu.wiki/w/%EC%84%9C%EC%9A%B8%EB%8C%80%2010%EA%B0%9C%20%EB%A7%8C%EB%93%A4%EA%B8%B0"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-medium text-zinc-600 hover:underline dark:text-zinc-400"
                  >
                    정책 개요 참고 <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>

            {sensitivityText ? (
              <p className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-xs text-zinc-600 dark:border-white/8 dark:bg-white/[0.02] dark:text-zinc-400">
                {sensitivityText}
              </p>
            ) : null}

            <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
              <span>다른 국제 대학평가 참고:</span>
              <a
                href="https://support.qs.com/hc/en-gb/articles/4405955370898-QS-World-University-Rankings"
                target="_blank"
                rel="noreferrer"
                className="text-zinc-800 underline underline-offset-4 hover:text-orange-600 dark:text-zinc-200 dark:hover:text-orange-300"
              >
                QS · 평판과 인용
              </a>
              <span>/</span>
              <a
                href="https://www.timeshighereducation.com/world-university-rankings/methodology"
                target="_blank"
                rel="noreferrer"
                className="text-zinc-800 underline underline-offset-4 hover:text-orange-600 dark:text-zinc-200 dark:hover:text-orange-300"
              >
                THE · 교육과 연구
              </a>
              <span>/</span>
              <a
                href="https://www.shanghairanking.com/methodology/arwu/2026"
                target="_blank"
                rel="noreferrer"
                className="text-zinc-800 underline underline-offset-4 hover:text-orange-600 dark:text-zinc-200 dark:hover:text-orange-300"
              >
                ARWU · 연구 성과
              </a>
            </div>

            <div className="border-t border-zinc-200/80 pt-4 dark:border-white/10">
              <button
                type="button"
                onClick={() => setShowExcluded((v) => !v)}
                className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-zinc-800 hover:text-orange-600 dark:text-zinc-200 dark:hover:text-orange-300"
              >
                산정 제외 {edition.excluded.length}곳과 사유{" "}
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 transition-transform",
                    showExcluded && "rotate-180"
                  )}
                />
              </button>
              {showExcluded ? (
                <p className="mt-3 max-h-48 overflow-auto rounded-xl border border-zinc-200 bg-zinc-50 p-3.5 text-xs leading-relaxed text-zinc-600 dark:border-white/8 dark:bg-black/40 dark:text-zinc-400">
                  {edition.excluded
                    .map((x) => `${x.name} (${formatExclusionReason(x)})`)
                    .join(" / ")}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}
