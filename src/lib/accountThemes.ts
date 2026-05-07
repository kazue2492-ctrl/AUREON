// Per-account-type visual moods.
// Each token is a raw HSL triplet (no `hsl()` wrapper) so Tailwind's
// `<alpha-value>` modifier works: hsl(var(--mood-primary) / 0.15)
//
// engiin   — Solo:    cream + AUREON purple   (default brand)
// oyutan   — Student: white-blue + electric   (vivid, modern)
// khos     — Couples: blush + dusty rose      (soft, romantic)
// gerbul   — Family:  warm cream + honey      (warm, dependable)

export type AccountKey = 'engiin' | 'oyutan' | 'khos' | 'gerbul'

export interface MoodTokens {
  cream:   string  // page background
  card:    string  // card surface
  primary: string  // brand color
  deep:    string  // deeper variant of primary
  accent:  string  // tertiary accent
  ink:     string  // primary text
  muted:   string  // secondary text
  // RGB strings for shadow/glow rgba() usage (not HSL)
  shadowRgb: string
  glowRgb:   string
}

export const ACCOUNT_THEMES: Record<AccountKey, MoodTokens> = {
  engiin: {
    cream:     '40 80% 96%',   // #FFF8EE
    card:      '42 80% 98%',   // #FFFDF7
    primary:   '263 78% 50%',  // #6D28D9
    deep:      '261 67% 35%',  // #4C1D95
    accent:    '28 53% 36%',   // #8B5A2B
    ink:       '253 43% 14%',  // #1A1535
    muted:     '253 12% 45%',  // #6B6480
    shadowRgb: '76, 29, 149',
    glowRgb:   '109, 40, 217',
  },
  oyutan: {
    cream:     '212 100% 97%', // #F0F7FF
    card:      '0 0% 100%',    // #FFFFFF
    primary:   '221 83% 53%',  // #2563EB
    deep:      '224 71% 40%',  // #1E40AF
    accent:    '188 95% 43%',  // #06B6D4
    ink:       '222 47% 11%',  // #0F172A
    muted:     '215 16% 47%',  // #64748B
    shadowRgb: '30, 64, 175',
    glowRgb:   '37, 99, 235',
  },
  khos: {
    cream:     '348 100% 98%', // #FFF5F7
    card:      '345 100% 99%', // #FFFAFB
    primary:   '330 81% 50%',  // #DB2777
    deep:      '342 80% 35%',  // #9F1239
    accent:    '271 91% 65%',  // #A855F7
    ink:       '342 64% 15%',  // #3F0E1C
    muted:     '336 23% 50%',  // #9C6276
    shadowRgb: '159, 18, 57',
    glowRgb:   '219, 39, 119',
  },
  gerbul: {
    cream:     '40 100% 95%',  // #FFF7E8
    card:      '45 100% 98%',  // #FFFCF3
    primary:   '30 95% 44%',   // #D97706
    deep:      '15 79% 34%',   // #9A3412
    accent:    '142 71% 29%',  // #15803D
    ink:       '33 41% 18%',   // #3F2E1A
    muted:     '36 16% 49%',   // #92806B
    shadowRgb: '154, 52, 18',
    glowRgb:   '217, 119, 6',
  },
}

// Dark-mode counterparts. Mood tokens are inline-style on <html>, so a
// CSS-only `.dark { ... }` override cannot win against them — we have to
// swap the actual tokens when dark mode toggles.
export const ACCOUNT_THEMES_DARK: Record<AccountKey, MoodTokens> = {
  engiin: {
    cream:     '253 25% 8%',
    card:      '253 22% 12%',
    primary:   '263 85% 70%',
    deep:      '263 70% 55%',
    accent:    '28 65% 60%',
    ink:       '40 80% 96%',
    muted:     '253 10% 65%',
    shadowRgb: '15, 12, 25',
    glowRgb:   '167, 139, 250',
  },
  oyutan: {
    cream:     '222 47% 6%',
    card:      '222 40% 10%',
    primary:   '217 91% 65%',
    deep:      '224 81% 50%',
    accent:    '188 95% 55%',
    ink:       '210 40% 98%',
    muted:     '215 18% 70%',
    shadowRgb: '8, 12, 20',
    glowRgb:   '96, 165, 250',
  },
  khos: {
    cream:     '342 35% 8%',
    card:      '342 32% 12%',
    primary:   '330 81% 65%',
    deep:      '342 70% 50%',
    accent:    '271 91% 75%',
    ink:       '345 40% 96%',
    muted:     '336 16% 70%',
    shadowRgb: '20, 8, 12',
    glowRgb:   '244, 114, 182',
  },
  gerbul: {
    cream:     '20 30% 8%',
    card:      '20 28% 12%',
    primary:   '30 95% 60%',
    deep:      '15 80% 50%',
    accent:    '142 65% 55%',
    ink:       '40 50% 96%',
    muted:     '36 16% 70%',
    shadowRgb: '20, 12, 8',
    glowRgb:   '251, 146, 60',
  },
}

export const DEFAULT_ACCOUNT: AccountKey = 'engiin'

export function isAccountKey(v: unknown): v is AccountKey {
  return v === 'engiin' || v === 'oyutan' || v === 'khos' || v === 'gerbul'
}

export function applyAccountTheme(key: AccountKey, dark = false) {
  if (typeof document === 'undefined') return
  const t = (dark ? ACCOUNT_THEMES_DARK : ACCOUNT_THEMES)[key]
  const r = document.documentElement.style
  r.setProperty('--mood-cream',     t.cream)
  r.setProperty('--mood-card',      t.card)
  r.setProperty('--mood-primary',   t.primary)
  r.setProperty('--mood-deep',      t.deep)
  r.setProperty('--mood-accent',    t.accent)
  r.setProperty('--mood-ink',       t.ink)
  r.setProperty('--mood-muted',     t.muted)
  r.setProperty('--mood-shadow-rgb', t.shadowRgb)
  r.setProperty('--mood-glow-rgb',   t.glowRgb)
  document.documentElement.setAttribute('data-mood', key)
  document.documentElement.classList.toggle('dark', dark)
}
