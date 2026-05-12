import { useLanguage } from '@/components/LanguageProvider'
import type { Lang } from '@/lib/i18n'

export const landingStrings = {
  mn: {
    nav: {
      features: 'Онцлог',
      pricing: 'Үнэ',
      about: 'Тухай',
      help: 'Тусламж',
      signin: 'Нэвтрэх',
      start: 'Эхлүүлэх',
    },
    hero: {
      heading: 'Илүү ухаалаг санхүүгийн эхлэл эндээс',
      sub: 'Мөнгөө бодитоор ойлгож, үргүй зардлаа багасган, хуримтлалаа амархан нэм.',
      ctaPrimary: 'Одоо хянаж эхлэх',
      ctaSecondary: 'Танилцуулга үзэх',
      trustUsers: '10,000+ хэрэглэгч',
      trustSecurity: 'Банкны түвшний аюулгүй байдал',
      tagline: 'Мөнгөө ухаалгаар хуримтлуул.',
    },
    mascot: {
      title: 'Таны мөнгөний найз',
      bubble: 'Сайн уу! Би Моко. Чиний санхүүгийн зөвлөх, найз чинь. Цуглуулсан жижиг царсан мод болгон чамайг том зорилгод хүргэнэ.',
      name: 'Моко',
      badges: ['Найрсаг', 'Ухаалаг', 'Аюулгүй'],
    },
    features: {
      kicker: 'Юу хийдэг вэ?',
      heading: 'Чиний санхүүгийн бүх хэрэгцээ нэг дор',
      sub: 'Моко-тай хамт зарлагаа хяна, төсөв төлөвлө, зорилгодоо хүр.',
      items: [
        { title: 'Зардлын хяналт', desc: 'Хаана хэр их зарцуулснаа автоматаар бүртгэ.' },
        { title: 'Хуримтлалын зорилго', desc: 'Жижиг алхамаар том мөрөөдөлд хүр.' },
        { title: 'Төсөв', desc: 'Сар бүрийн төсвөө ухаалгаар төлөвлө.' },
        { title: 'Тайлан', desc: 'Мөнгөний урсгалаа график байдлаар хар.' },
        { title: 'Аюулгүй байдал', desc: '256-bit шифрлэлт, биометрийн нэвтрэлт.' },
        { title: 'Моко-ы зөвлөгөө', desc: 'AI-аар хөтлөгдсөн өдөр тутмын зөвлөгөө.' },
      ],
    },
    how: {
      kicker: 'Хэрхэн ажилладаг вэ?',
      heading: 'Гурван энгийн алхам',
      steps: [
        { title: 'Холбох', desc: 'Банкны дансаа аюулгүйгээр холбо.' },
        { title: 'Хянах', desc: 'AUREON автоматаар ангилна.' },
        { title: 'Ургуулах', desc: 'Хуримтлалаа царсан мод шиг өсгө.' },
      ],
    },
    stats: {
      items: [
        { value: '₮2.4 тэрбум', label: 'хэмнэлт бий болгосон' },
        { value: '10,000+', label: 'идэвхтэй хэрэглэгч' },
        { value: '4.9★', label: 'App Store үнэлгээ' },
        { value: '24/7', label: 'тусламжийн үйлчилгээ' },
      ],
    },
    testimonials: {
      kicker: 'Хэрэглэгчдийн сэтгэгдэл',
      heading: 'Моко-ыг сонгосон шалтгаан',
      items: [
        {
          name: 'Б. Сараа',
          role: 'Оюутан',
          quote: 'Сар бүр хэдэн төгрөг хаашаа явж байгааг анх удаа ойлгож эхэллээ. Моко надад хуримтлал гэж юу болохыг зааж өгсөн.',
        },
        {
          name: 'Г. Энхбаяр',
          role: 'Инженер',
          quote: 'График, тайлан нь маш ойлгомжтой. Цалин орохоор автоматаар хуваарилаад өгчихдөг нь амар болсон.',
        },
        {
          name: 'Д. Номин',
          role: 'Эзэн',
          quote: 'Бизнесийн мөнгөө хувийн зардлаасаа салгахад тус болсон. Моко-ы өдөр тутмын зөвлөгөөг хүлээдэг болсон.',
        },
      ],
    },
    pricing: {
      kicker:    'Үнийн төлөвлөгөө',
      heading:   'Чамд тохирох төлөвлөгөөгөө сонго',
      sub:       'Хэрэгцээтэй цагт нь дээшлүүл, хэзээ ч цуцлах боломжтой.',
      free:      'Үнэгүй',
      perMonth:  '/сар',
      popular:   'Хамгийн их сонгогддог',
      ctaFree:   'Үнэгүй эхлэх',
      ctaPaid:   'Эхлүүлэх',
      plans: [
        {
          id:      'engiin',
          name:    'Энгийн',
          tagline: 'Ганцаараа хэрэглэгчдэд',
          features: [
            'Зардлын автомат хяналт',
            'Хувийн зорилго',
            'Сарын төсөв',
            'Моко-ы өдөр тутмын зөвлөгөө',
          ],
        },
        {
          id:      'oyutan',
          name:    'Оюутан',
          tagline: 'Сурагч, оюутнуудад',
          badge:   'Хөнгөлөлттэй',
          features: [
            'Энгийн төлөвлөгөөний бүх боломж',
            'Оюутны баталгаажуулалт',
            'Цалин хуваарилалт',
            'Хямдрал, урамшуулал',
          ],
        },
        {
          id:      'khos',
          name:    'Хосууд',
          tagline: '2 хүний хамтын санхүү',
          features: [
            'Хамтын данс ба тэмдэглэл',
            'Хуваалцсан төсөв',
            'Хуваалцсан зорилго',
            'Дэлгэрэнгүй тайлан',
            'Аяллын төсөв',
          ],
        },
        {
          id:      'gerbul',
          name:    'Гэр бүл',
          tagline: '4 хүртэл гишүүний санхүү',
          highlight: true,
          features: [
            '4 хүртэл гишүүн',
            'Хамтын төсөв ба зорилго',
            'Гишүүн тус бүрийн харагдац',
            'Хүүхдийн халаас',
            'Сарын нэгдсэн тайлан',
          ],
        },
      ],
    },
    cta: {
      heading: 'Өнөөдрөөс эхэлье. Анхны царсан модоо хуримтлуулъя.',
      button: 'Үнэгүй бүртгүүлэх',
    },
    footer: {
      cols: [
        { title: 'Бүтээгдэхүүн', links: ['Онцлог', 'Үнэ', 'Аюулгүй байдал', 'Гар утас'] },
        { title: 'Компани', links: ['Тухай', 'Ажлын байр', 'Блог', 'Хэвлэл'] },
        { title: 'Нөөц', links: ['Тусламж', 'API', 'Гарын авлага', 'Холбоо барих'] },
        { title: 'Хууль', links: ['Үйлчилгээний нөхцөл', 'Нууцлал', 'Күүки', 'Лиценз'] },
      ],
      copy: '© 2026 AUREON. Бүх эрх хуулиар хамгаалагдсан.',
    },
  },
  en: {
    nav: {
      features: 'Features',
      pricing: 'Pricing',
      about: 'About',
      help: 'Help',
      signin: 'Sign in',
      start: 'Get Started',
    },
    hero: {
      heading: 'Smarter Finances Start Here',
      sub: 'Understand your money in real time, reduce unnecessary spending, and grow your savings effortlessly.',
      ctaPrimary: 'Start Tracking Now',
      ctaSecondary: 'Watch Demo',
      trustUsers: '10,000+ users',
      trustSecurity: 'Bank-level security',
      tagline: 'Your money, gathered with care.',
    },
    mascot: {
      title: 'Meet your money buddy',
      bubble: "Hi! I'm Moko. Your finance buddy. Every little acorn we gather brings you closer to your big dreams.",
      name: 'Moko',
      badges: ['Friendly', 'Smart', 'Safe'],
    },
    features: {
      kicker: 'What it does',
      heading: 'Every money need, in one cozy place',
      sub: 'With Moko by your side: track spending, plan budgets, and reach your goals.',
      items: [
        { title: 'Expense Tracking', desc: 'Auto-categorize every transaction.' },
        { title: 'Savings Goals', desc: 'Reach big dreams in small steps.' },
        { title: 'Smart Budgets', desc: 'Plan monthly budgets that actually work.' },
        { title: 'Insights', desc: 'Visualize where your money flows.' },
        { title: 'Bank-level Security', desc: '256-bit encryption, biometric login.' },
        { title: "Moko's Tips", desc: 'AI-powered daily nudges from your buddy.' },
      ],
    },
    how: {
      kicker: 'How it works',
      heading: 'Three simple steps',
      steps: [
        { title: 'Connect', desc: 'Securely link your accounts.' },
        { title: 'Track', desc: 'AUREON categorizes everything for you.' },
        { title: 'Grow', desc: 'Watch your savings grow like an oak tree.' },
      ],
    },
    stats: {
      items: [
        { value: '$1.2M', label: 'in savings created' },
        { value: '10,000+', label: 'active users' },
        { value: '4.9★', label: 'App Store rating' },
        { value: '24/7', label: 'customer support' },
      ],
    },
    testimonials: {
      kicker: 'Loved by savers',
      heading: 'Why people choose Moko',
      items: [
        {
          name: 'B. Saraa',
          role: 'Student',
          quote: 'For the first time I actually understand where my money goes each month. Moko taught me what saving really means.',
        },
        {
          name: 'G. Enkhbayar',
          role: 'Engineer',
          quote: 'The charts and reports are so clear. My paycheck gets allocated automatically, and life got easier.',
        },
        {
          name: 'D. Nomin',
          role: 'Founder',
          quote: 'It helped me separate business money from personal spending. I look forward to Moko’s daily tips now.',
        },
      ],
    },
    pricing: {
      kicker:    'Pricing',
      heading:   'Pick the plan that fits your life',
      sub:       'Upgrade when you need it, cancel anytime.',
      free:      'Free',
      perMonth:  '/mo',
      popular:   'Most popular',
      ctaFree:   'Start free',
      ctaPaid:   'Get started',
      plans: [
        {
          id:      'engiin',
          name:    'Solo',
          tagline: 'For individuals',
          features: [
            'Auto expense tracking',
            'Personal goals',
            'Monthly budgets',
            "Moko's daily tips",
          ],
        },
        {
          id:      'oyutan',
          name:    'Student',
          tagline: 'For students',
          badge:   'Discounted',
          features: [
            'Everything in Solo',
            'Student verification required',
            'Paycheck splitting',
            'Student deals & perks',
          ],
        },
        {
          id:      'khos',
          name:    'Couples',
          tagline: 'Manage finances together',
          features: [
            'Combined two-account view',
            'Shared budgets',
            'Shared goals',
            'Detailed reports',
            'Travel budgets',
          ],
        },
        {
          id:      'gerbul',
          name:    'Family',
          tagline: 'Up to 4 members',
          highlight: true,
          features: [
            'Up to 4 members',
            'Shared budgets and goals',
            'Per-member view',
            'Kids allowance tracker',
            'Monthly consolidated report',
          ],
        },
      ],
    },
    cta: {
      heading: 'Start today. Plant your first acorn.',
      button: 'Sign Up Free',
    },
    footer: {
      cols: [
        { title: 'Product', links: ['Features', 'Pricing', 'Security', 'Mobile'] },
        { title: 'Company', links: ['About', 'Careers', 'Blog', 'Press'] },
        { title: 'Resources', links: ['Help Center', 'API', 'Guides', 'Contact'] },
        { title: 'Legal', links: ['Terms', 'Privacy', 'Cookies', 'Licenses'] },
      ],
      copy: '© 2026 AUREON. All rights reserved.',
    },
  },
} as const

export type LandingDict = typeof landingStrings.mn

export function useLanding(): { lang: Lang; setLang: (l: Lang) => void; L: LandingDict } {
  const { lang, setLang } = useLanguage()
  return { lang, setLang, L: landingStrings[lang] as LandingDict }
}
