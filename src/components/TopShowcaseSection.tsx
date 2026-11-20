import * as React from "react"
import { HeroCarousel, type HeroCarouselItem } from "@/components/ui/hero-carousel"
import type { CompareMode, EditionSlice, UniversityRow } from "@/types/ranking"

interface TopShowcaseSectionProps {
  edition: EditionSlice | null
  mode: CompareMode
  onInspectSchool: (row: UniversityRow) => void
}

// Curated architectural / atmospheric Unsplash editorial images + distinct color-grading accents
const EDITORIAL_FRAMES = [
  {
    image:
      "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1400&q=85",
    accent: "#ff5b2e",
  },
  {
    image:
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1400&q=85",
    accent: "#00b8ff",
  },
  {
    image:
      "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1400&q=85",
    accent: "#7b61ff",
  },
  {
    image:
      "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1400&q=85",
    accent: "#e63946",
  },
  {
    image:
      "https://images.unsplash.com/photo-1508919801845-fc2ae1bc2a28?auto=format&fit=crop&w=1400&q=85",
    accent: "#14b8a6",
  },
  {
    image:
      "https://images.unsplash.com/photo-1479839672679-a46483c0e7c8?auto=format&fit=crop&w=1400&q=85",
    accent: "#f59e0b",
  },
  {
    image:
      "https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=1400&q=85",
    accent: "#ec4899",
  },
]

function splitHeadline(name: string): string {
  const clean = name.replace(/\s*·\s*/g, "\n")
  if (clean.includes("\n")) return clean
  if (clean.endsWith("대학교") && clean.length > 4) {
    return `${clean.slice(0, -3)}\n대학교`
  }
  if (clean.endsWith("과학기술원") && clean.length > 5) {
    return `${clean.slice(0, -5)}\n과학기술원`
  }
  return clean
}

export function TopShowcaseSection({
  edition,
  mode,
  onInspectSchool,
}: TopShowcaseSectionProps) {
  const [activeIndex, setActiveIndex] = React.useState(0)

  const featuredRows = React.useMemo(() => {
    if (!edition) return []
    return edition.rows.slice(0, 7)
  }, [edition])

  React.useEffect(() => {
    setActiveIndex(0)
  }, [mode, edition?.year])

  const items: HeroCarouselItem[] = React.useMemo(() => {
    return featuredRows.map((row, i) => {
      const frame = EDITORIAL_FRAMES[i % EDITORIAL_FRAMES.length]
      const researchScore =
        mode === "combined" ? (row.points[9] ?? 0) + (row.points[10] ?? 0) : null
      const supportScore =
        mode === "combined"
          ? row.points.slice(0, 9).reduce((a, b) => a + b, 0)
          : row.score

      return {
        id: row.id,
        title: splitHeadline(row.name),
        image: frame.image,
        accent: frame.accent,
        credit: `${row.region} · ${
          row.designation ? `글로컬 ${row.designation}` : mode === "combined" ? "종합 상위권" : "학생지원 상위권"
        }`,
        meta:
          mode === "combined" && researchScore !== null
            ? [
                `RANK #${String(row.rank).padStart(2, "0")}`,
                `TOTAL ${row.score.toFixed(1)}`,
                `연구 ${researchScore.toFixed(1)} · 지원 ${supportScore.toFixed(1)}`,
              ]
            : [
                `RANK #${String(row.rank).padStart(2, "0")}`,
                `SUPPORT ${row.score.toFixed(1)}`,
                `${edition?.year ?? 2026} 공시`,
              ],
      }
    })
  }, [featuredRows, mode, edition?.year])

  if (!items.length) return null

  const activeRow = featuredRows[activeIndex] ?? featuredRows[0]

  return (
    <section
      id="showcase"
      className="relative w-full border-y border-white/10 bg-black"
    >
      <div className="h-[82svh] min-h-[580px] max-h-[860px] w-full">
        <HeroCarousel
          items={items}
          index={activeIndex}
          onIndexChange={setActiveIndex}
          brand={`${edition?.year ?? 2026} TOP 07 · ${
            mode === "combined" ? "종합 순위 쇼케이스" : "학생지원 쇼케이스"
          }`}
          onBack={() => {
            document.getElementById("race")?.scrollIntoView({ behavior: "smooth" })
          }}
          onMenu={() => {
            if (activeRow) onInspectSchool(activeRow)
          }}
          autoplay
          autoplayDelay={5200}
        />
      </div>
    </section>
  )
}
