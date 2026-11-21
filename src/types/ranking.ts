export type CompareMode = "combined" | "support"

export interface UniversityRow {
  id: string
  name: string
  region: string
  students?: number
  tuition?: number
  scholarship?: number
  values: (number | null)[]
  years: string[]
  points: number[]
  designation: number | null
  score: number
  rank: number
  source?: string
  supportRank?: number
}

export interface ExcludedRow {
  id: string
  name: string
  missing?: number[]
  reason?: string
}

export interface EditionSlice {
  year: number
  rows: UniversityRow[]
  excluded: ExcludedRow[]
  total: number
}

export interface RawEdition extends EditionSlice {
  combined: EditionSlice
}

export interface DisclosurePayload {
  version: string
  checked: string
  published: string
  error: boolean
  editions: RawEdition[]
}

export interface DisclosureStatus {
  version?: string
  checked?: string
  published?: string
  error?: boolean
}

export const BASE_METRIC_LABELS = [
  "학생 1인당 교육비",
  "실부담 등록금 (등록금−장학금)",
  "교육비 환원율 (교육비÷등록금)",
  "전임교원 확보율 (재학생 기준)",
  "졸업생 취업률",
  "기숙사 수용률",
  "신입생 충원율",
  "전임교원 강의 비율",
  "학생 1인당 도서 자료",
  "글로컬대학 본지정",
] as const

export const BASE_METRIC_UNITS = [
  "천원",
  "천원",
  "%",
  "%",
  "%",
  "%",
  "%",
  "%",
  "권",
  "",
] as const

export const BASE_METRIC_CAPS = [22, 16, 12, 12, 10, 8, 7, 5, 4, 4] as const

export const RAW_EXCLUSION_LABELS = [
  "학생 1인당 교육비",
  "평균 등록금",
  "재학생 1인당 장학금",
  "전임교원 확보율(재학생 기준)",
  "졸업생 취업률",
  "기숙사 수용률",
  "신입생 충원율",
  "전임교원 강의 비율",
  "학생 1인당 도서 자료",
] as const

export const COMBINED_EXTRA_LABELS = ["연구 출판물 (3개년)", "받은 인용 (3개년)"] as const
export const COMBINED_EXTRA_UNITS = ["건", "회"] as const
export const COMBINED_EXTRA_CAPS = [25, 25] as const

export const SEARCH_ALIASES: Record<string, string> = {
  snu: "서울대학교",
  서울대: "서울대학교",
  kaist: "한국과학기술원",
  카이스트: "한국과학기술원",
  postech: "포항공과대학교",
  포스텍: "포항공과대학교",
  포항공대: "포항공과대학교",
  unist: "울산과학기술원",
  유니스트: "울산과학기술원",
  연대: "연세대학교",
  연세대: "연세대학교",
  고대: "고려대학교",
  고려대: "고려대학교",
  성대: "성균관대학교",
  성균관대: "성균관대학교",
}

export function getMetricMeta(mode: CompareMode) {
  if (mode === "combined") {
    return {
      labels: [...BASE_METRIC_LABELS, ...COMBINED_EXTRA_LABELS],
      units: [...BASE_METRIC_UNITS, ...COMBINED_EXTRA_UNITS],
      caps: [...BASE_METRIC_CAPS.map((v) => v / 2), ...COMBINED_EXTRA_CAPS],
    }
  }
  return {
    labels: [...BASE_METRIC_LABELS],
    units: [...BASE_METRIC_UNITS],
    caps: [...BASE_METRIC_CAPS],
  }
}

export function formatExclusionReason(row: ExcludedRow): string {
  if (row.reason) return row.reason
  if (row.missing && row.missing.length > 0) {
    return row.missing.map((i) => RAW_EXCLUSION_LABELS[i] ?? "공시항목").join(", ")
  }
  return "재학생 수"
}

export function getRankDelta(
  editions: EditionSlice[],
  currentYear: number,
  row: UniversityRow
): { label: string; diff: number | null; kind: "up" | "down" | "same" | "new" | "none" } {
  const prevEdition = editions.find((e) => e.year === currentYear - 1)
  if (!prevEdition) return { label: "—", diff: null, kind: "none" }
  const prevRow = prevEdition.rows.find((r) => r.id === row.id)
  if (!prevRow) return { label: "첫 산정", diff: null, kind: "new" }
  const diff = prevRow.rank - row.rank
  if (diff > 0) return { label: `▲ ${diff}`, diff, kind: "up" }
  if (diff < 0) return { label: `▼ ${Math.abs(diff)}`, diff, kind: "down" }
  return { label: "유지", diff: 0, kind: "same" }
}

export function formatKst(iso?: string): string {
  if (!iso) return "—"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
}
