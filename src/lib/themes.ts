export const THEME_IDS = ['engiin', 'gerbul', 'khos', 'oyutan'] as const
export type ThemeId = typeof THEME_IDS[number]

export const DEFAULT_THEME: ThemeId = 'engiin'
export const THEME_STORAGE_KEY = 'site-theme'

export interface ThemeMeta {
  id: ThemeId
  label: string
  description: string
  swatch: {
    background: string
    primary: string
    accent: string
  }
}

export const THEMES: ThemeMeta[] = [
  {
    id: 'engiin',
    label: 'Энгийн',
    description: 'Цэвэр, мэргэжлийн, төвийг сахисан',
    swatch: {
      background: 'hsl(0 0% 100%)',
      primary: 'hsl(217 33% 17%)',
      accent: 'hsl(215 25% 60%)',
    },
  },
  {
    id: 'gerbul',
    label: 'Гэр бүл',
    description: 'Дулаахан, найрсаг, гэрэлтэй',
    swatch: {
      background: 'hsl(33 50% 96%)',
      primary: 'hsl(14 75% 48%)',
      accent: 'hsl(38 92% 56%)',
    },
  },
  {
    id: 'khos',
    label: 'Хосууд',
    description: 'Дотно, зөөлөн, романтик',
    swatch: {
      background: 'hsl(350 50% 98%)',
      primary: 'hsl(340 60% 48%)',
      accent: 'hsl(280 35% 55%)',
    },
  },
  {
    id: 'oyutan',
    label: 'Оюутан',
    description: 'Эрч хүчтэй, орчин үеийн, идэвхтэй',
    swatch: {
      background: 'hsl(222 47% 8%)',
      primary: 'hsl(217 91% 60%)',
      accent: 'hsl(168 85% 50%)',
    },
  },
]

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === 'string' && (THEME_IDS as readonly string[]).includes(value)
}
