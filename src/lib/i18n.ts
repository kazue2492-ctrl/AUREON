export type Lang = 'mn' | 'en'

export const LANG_STORAGE_KEY = 'walletHubLang'
export const DEFAULT_LANG: Lang = 'mn'

export const translations = {
  // ── Common ──
  'common.save':            { mn: 'Хадгалах',         en: 'Save' },
  'common.cancel':          { mn: 'Болих',            en: 'Cancel' },
  'common.delete':          { mn: 'Устгах',           en: 'Delete' },
  'common.edit':            { mn: 'Засах',            en: 'Edit' },
  'common.add':             { mn: 'Нэмэх',            en: 'Add' },
  'common.search':          { mn: 'Хайх...',          en: 'Search...' },
  'common.all':             { mn: 'Бүгд',             en: 'All' },
  'common.choose':          { mn: 'Сонгох',           en: 'Select' },
  'common.optional':        { mn: 'заавал биш',       en: 'optional' },
  'common.example':         { mn: 'Жишээ',            en: 'Example' },
  'common.income':          { mn: 'Орлого',           en: 'Income' },
  'common.expense':         { mn: 'Зарлага',          en: 'Expense' },
  'common.savings':         { mn: 'Хэмнэлт',          en: 'Savings' },
  'common.amount':          { mn: 'Дүн',              en: 'Amount' },
  'common.date':            { mn: 'Огноо',            en: 'Date' },
  'common.category':        { mn: 'Категори',         en: 'Category' },
  'common.title':           { mn: 'Гарчиг',           en: 'Title' },
  'common.description':     { mn: 'Тайлбар',          en: 'Description' },
  'common.name':            { mn: 'Нэр',              en: 'Name' },
  'common.deadline':        { mn: 'Хугацаа',          en: 'Deadline' },
  'common.expired':         { mn: 'Хугацаа дууссан',  en: 'Expired' },
  'common.invalidDate':     { mn: 'Хугацаа буруу',    en: 'Invalid date' },
  'common.viewAll':         { mn: 'Бүгд',             en: 'View all' },
  'common.confirmDelete':   { mn: 'Устгах уу?',       en: 'Delete?' },
  'common.day':             { mn: 'хоног',            en: 'day(s)' },

  // ── Nav ──
  'nav.dashboard':     { mn: 'Самбар',    en: 'Dashboard' },
  'nav.transactions':  { mn: 'Гүйлгээ',   en: 'Transactions' },
  'nav.upload':        { mn: 'Баримт',    en: 'Receipt' },
  'nav.budget':        { mn: 'Төсөв',     en: 'Budget' },
  'nav.goals':         { mn: 'Зорилго',   en: 'Goals' },
  'nav.reports':       { mn: 'Тайлан',    en: 'Reports' },
  'nav.family':        { mn: 'Гэр бүл',   en: 'Family' },
  'nav.couple':        { mn: 'Хос',       en: 'Couple' },
  'nav.subscription':  { mn: 'Багц',      en: 'Subscription' },
  'nav.profile':       { mn: 'Тохиргоо',  en: 'Settings' },
  'nav.logout':        { mn: 'Гарах',     en: 'Logout' },

  // ── Upload (receipt scanning) ──
  'upload.title':           { mn: 'Баримт оруулах',                              en: 'Upload receipt' },
  'upload.subtitle':        { mn: 'Зураг оруулбал автоматаар уншина',            en: 'Drop a photo and we read it for you' },
  'upload.dropHere':        { mn: 'Зургаа энд чирч тавь',                        en: 'Drop your receipt photo here' },
  'upload.orClick':         { mn: 'эсвэл сонгохын тулд дарна уу',                en: 'or click to choose a file' },
  'upload.fileHint':        { mn: 'JPG, PNG эсвэл WEBP · 5MB хүртэл',            en: 'JPG, PNG or WEBP · up to 5MB' },
  'upload.choose':          { mn: 'Файл сонгох',                                 en: 'Choose file' },
  'upload.scanning':        { mn: 'Баримтыг уншиж байна...',                     en: 'Reading the receipt...' },
  'upload.scanFailed':      { mn: 'Уншиж чадсангүй. Гараар оруулна уу.',         en: 'Could not read it. Please enter manually.' },
  'upload.confirmTitle':    { mn: 'Мэдээллийг шалгана уу',                       en: 'Check the details' },
  'upload.confirmHint':     { mn: 'Шаардлагатай бол засаад хадгална уу',         en: 'Edit if needed, then save' },
  'upload.vendor':          { mn: 'Дэлгүүр / Үйлчилгээ',                         en: 'Vendor / merchant' },
  'upload.confidence':      { mn: 'Танилт',                                      en: 'Recognition' },
  'upload.confHigh':        { mn: 'Сайн',                                        en: 'High' },
  'upload.confMed':         { mn: 'Дунд',                                        en: 'Medium' },
  'upload.confLow':         { mn: 'Бага',                                        en: 'Low' },
  'upload.tryAgain':        { mn: 'Өөр зураг',                                   en: 'Try another' },
  'upload.saved':           { mn: 'Гүйлгээ хадгалагдлаа',                        en: 'Transaction saved' },
  'upload.errTooBig':       { mn: 'Файл хэт том (хамгийн ихдээ 5MB)',            en: 'File is too large (max 5MB)' },
  'upload.errType':         { mn: 'Зөвхөн зургийн файл оруулна уу',              en: 'Only image files are allowed' },
  'upload.errRate':         { mn: 'Хэт олон оролдлого. Дараа дахин оролдоно уу', en: 'Too many uploads. Try again later' },
  'upload.errNoKey':        { mn: 'Серверийн API түлхүүр тохируулагдаагүй',      en: 'Server API key is not configured' },
  'upload.errGeneric':      { mn: 'Алдаа гарлаа. Дахин оролдоно уу',             en: 'Something went wrong. Try again' },

  // ── Dashboard ──
  'dashboard.title':           { mn: 'Самбар',                   en: 'Dashboard' },
  'dashboard.subtitle':        { mn: 'Таны санхүүгийн мэдээлэл', en: 'Your financial overview' },
  'dashboard.addTransaction':  { mn: 'Гүйлгээ нэмэх',            en: 'Add transaction' },
  'dashboard.totalBalance':    { mn: 'Нийт баланс',              en: 'Total balance' },
  'dashboard.weeklyExpenses':  { mn: '7 хоногийн зарлага',       en: 'Weekly expenses' },
  'dashboard.expenseByCategory': { mn: 'Категориор зарлага',     en: 'Expense by category' },
  'dashboard.recentTransactions': { mn: 'Сүүлийн гүйлгээ',       en: 'Recent transactions' },

  // ── Transactions ──
  'transactions.title':           { mn: 'Гүйлгээ',                en: 'Transactions' },
  'transactions.subtitle':        { mn: 'Бүх гүйлгээний түүх',    en: 'All transaction history' },
  'transactions.add':             { mn: 'Гүйлгээ нэмэх',          en: 'Add transaction' },
  'transactions.sortBy':          { mn: 'Эрэмбэлэх:',             en: 'Sort by:' },
  'transactions.empty':           { mn: 'Гүйлгээ олдсонгүй',      en: 'No transactions found' },
  'transactions.confirmDelete':   { mn: 'Энэ гүйлгээг устгах уу?', en: 'Delete this transaction?' },

  // ── Transaction modal ──
  'txModal.editTitle':         { mn: 'Гүйлгээ засах',         en: 'Edit transaction' },
  'txModal.newTitle':          { mn: 'Шинэ гүйлгээ',          en: 'New transaction' },
  'txModal.titlePlaceholder':  { mn: 'Жишээ: Хүнсний дэлгүүр', en: 'e.g. Grocery store' },
  'txModal.descPlaceholder':   { mn: 'Нэмэлт тайлбар...',     en: 'Additional notes...' },
  'txModal.descLabel':         { mn: 'Тайлбар (заавал биш)',  en: 'Description (optional)' },

  // ── Budget ──
  'budget.title':           { mn: 'Төсвийн төлөвлөгөө', en: 'Budget plan' },
  'budget.subtitle':        { mn: 'Сарын төсөвөө удирдах', en: 'Manage your monthly budget' },
  'budget.add':             { mn: 'Төсөв нэмэх',        en: 'Add budget' },
  'budget.totalBudget':     { mn: 'Нийт төсөв',         en: 'Total budget' },
  'budget.totalSpent':      { mn: 'Нийт зарцуулсан',    en: 'Total spent' },
  'budget.remaining':       { mn: 'Үлдсэн',             en: 'Remaining' },
  'budget.editBudget':      { mn: 'Төсөв засах',        en: 'Edit budget' },
  'budget.newBudget':       { mn: 'Шинэ төсөв',         en: 'New budget' },
  'budget.statusOver':      { mn: 'Хэтэрсэн',           en: 'Over budget' },
  'budget.statusWarn':      { mn: '80% хүрлээ',         en: '80% used' },
  'budget.statusOk':        { mn: 'Зөвшөөрөгдсөн',      en: 'On track' },
  'budget.empty':           { mn: 'Төсөв үүсгээгүй байна', en: 'No budgets created yet' },
  'budget.confirmDelete':   { mn: 'Төсвийг устгах уу?', en: 'Delete this budget?' },

  // ── Goals ──
  'goals.title':           { mn: 'Санхүүгийн зорилго',       en: 'Financial goals' },
  'goals.subtitle':        { mn: 'Хэмнэлтийн зорилгоо тодорхойл', en: 'Define your savings goals' },
  'goals.add':             { mn: 'Зорилго нэмэх',            en: 'Add goal' },
  'goals.editGoal':        { mn: 'Зорилго засах',            en: 'Edit goal' },
  'goals.newGoal':         { mn: 'Шинэ зорилго',             en: 'New goal' },
  'goals.targetAmount':    { mn: 'Зорилтот дүн (₮)',         en: 'Target amount (₮)' },
  'goals.currentAmount':   { mn: 'Одоогийн дүн (₮)',         en: 'Current amount (₮)' },
  'goals.deadlineLabel':   { mn: 'Хугацаа (огноо ба цаг)',   en: 'Deadline (date and time)' },
  'goals.imageUrl':        { mn: 'Зургийн URL',              en: 'Image URL' },
  'goals.imageHint':       { mn: 'Интернэтээс зургийн холбоосыг хуулж тавина уу (https://...)', en: 'Paste an image URL from the web (https://...)' },
  'goals.imageSection':    { mn: 'Зураг',                    en: 'Image' },
  'goals.imageTabUrl':     { mn: 'URL',                      en: 'URL' },
  'goals.imageTabFile':    { mn: 'Файл',                     en: 'File' },
  'goals.imageFileHint':   { mn: 'Компьютерээсээ зураг сонгоно уу (PNG, JPG, WEBP).', en: 'Choose an image from your device (PNG, JPG, WEBP).' },
  'goals.imageChoose':     { mn: 'Зураг сонгох',             en: 'Choose image' },
  'goals.imageRemove':     { mn: 'Зураг устгах',             en: 'Remove image' },
  'goals.imageTooLarge':   { mn: 'Файл хэт том байна (5MB-аас бага байх ёстой).', en: 'File is too large (must be under 5MB).' },
  'goals.namePlaceholder': { mn: 'Жишээ: MacBook Pro',       en: 'e.g. MacBook Pro' },
  'goals.percentDone':     { mn: 'хийсэн',                   en: 'done' },
  'goals.percentReached':  { mn: 'хүрсэн',                   en: 'reached' },
  'goals.completed':       { mn: 'Бүрэн хийсэн',             en: 'Fully completed' },
  'goals.empty':           { mn: 'Зорилго үүсээгүй байна',   en: 'No goals yet' },
  'goals.emptyHint':       { mn: 'Шинэ зорилго нэмэхэд энд харагдана.', en: 'Add a goal and it will appear here.' },
  'goals.confirmDelete':   { mn: 'Зорилгыг устгах уу?',      en: 'Delete this goal?' },
  'goals.addMoney':        { mn: 'Мөнгө нэмэх',              en: 'Add money' },
  'goals.depositPlaceholder': { mn: 'Хэдэн төгрөг нэмэх вэ?', en: 'How much to add?' },
  'goals.remaining':       { mn: 'Үлдсэн',                   en: 'Remaining' },
  'goals.saved':           { mn: 'Хуримтлагдсан',            en: 'Saved' },
  'goals.alreadyCompleted':{ mn: 'Зорилго бүрэн хийгдсэн',   en: 'Goal already completed' },
  'goals.savingsCategory': { mn: 'Хуримтлал',                en: 'Savings' },
  'goals.savingsTitle':    { mn: 'Зорилгод хуримтлуулсан',   en: 'Saved to goal' },
  'goals.dailyLabel':      { mn: 'Өдөрт хэмнэх',             en: 'Save per day' },
  'goals.dailySuggested':  { mn: 'санал болгож буй',         en: 'suggested' },
  'goals.dailyEdit':       { mn: 'Дүн өөрчлөх',              en: 'Change amount' },
  'goals.dailyReset':      { mn: 'Анхны утга сэргээх',       en: 'Reset to suggested' },
  'goals.dailySaveNow':    { mn: 'Өнөөдөр хэмнэх',           en: 'Save today' },

  // ── Reports ──
  'reports.title':           { mn: 'Санхүүгийн тайлан',         en: 'Financial reports' },
  'reports.subtitle':        { mn: 'Дэлгэрэнгүй шинжилгээ',     en: 'Detailed analytics' },
  'reports.download':        { mn: 'Тайлан татах',              en: 'Download report' },
  'reports.expenseByCategory': { mn: 'Категориор зарлага',      en: 'Expense by category' },
  'reports.monthlyIncomeExpense': { mn: 'Сарын орлого ба зарлага', en: 'Monthly income & expense' },
  'reports.savingsGrowth':   { mn: 'Хэмнэлтийн өсөлт',          en: 'Savings growth' },
  'reports.empty':           { mn: 'Тайлан хараахан үүсээгүй байна', en: 'No report data yet' },
  'reports.emptyHint':       { mn: 'Орлого эсвэл зарлага нэмэхэд тайлан автоматаар энд гарч ирнэ.', en: 'Add income or expense and the report will appear here.' },

  // ── Profile page ──
  'profile.title':           { mn: 'Хэрэглэгчийн профайл',  en: 'User profile' },
  'profile.subtitle':        { mn: 'Тохиргоо болон мэдээлэл', en: 'Settings and information' },
  'profile.updateInfo':      { mn: 'Мэдээлэл шинэчлэх',     en: 'Update info' },
  'profile.name':            { mn: 'Нэр',                   en: 'Name' },
  'profile.email':           { mn: 'И-мэйл',                en: 'Email' },
  'profile.lockedHint':      { mn: 'Бүртгэлээс тогтоогдсон. Засах боломжгүй.', en: 'Set at registration. Cannot be edited.' },
  'profile.age':             { mn: 'Нас',                   en: 'Age' },
  'profile.gender':          { mn: 'Хүйс',                  en: 'Gender' },
  'profile.male':            { mn: 'Эр',                    en: 'Male' },
  'profile.female':          { mn: 'Эм',                    en: 'Female' },
  'profile.lifestyle':       { mn: 'Амьдралын хэв маяг',    en: 'Lifestyle' },
  'profile.currency':        { mn: 'Мөнгөн тэмдэгт',         en: 'Currency' },
  'profile.darkMode':        { mn: 'Харанхуй горим',        en: 'Dark mode' },
  'profile.language':        { mn: 'Хэл',                   en: 'Language' },
  'profile.save':            { mn: 'Хадгалах',              en: 'Save' },
  'profile.saved':           { mn: 'Хадгалагдлаа',          en: 'Saved' },
  'profile.changeAvatar':    { mn: 'Зураг солих',           en: 'Change photo' },
  'profile.lifestyleHint':   { mn: 'Амьдралын хэв маягаа сонгоорой. Хос болон Гэр бүлийн горим багц шаарддаг.', en: 'Choose your lifestyle. Couple and Family modes require a subscription.' },
  'profile.upgradeRequired': { mn: 'Энэ горимд багц шаардлагатай',         en: 'This mode requires a subscription' },
  'profile.switchedTo':      { mn: 'Горим солигдлоо:',                     en: 'Switched to:' },

  // ── Subscription page ──
  'subscription.title':         { mn: 'Багц',                                 en: 'Subscription' },
  'subscription.subtitle':      { mn: 'Багцаа удирдах, шинэчлэх',             en: 'Manage and upgrade your plan' },
  'subscription.currentPlan':   { mn: 'Одоогийн багц',                        en: 'Current plan' },
  'subscription.statusActive':  { mn: 'Идэвхтэй',                             en: 'Active' },
  'subscription.statusInactive':{ mn: 'Идэвхгүй',                             en: 'Inactive' },
  'subscription.statusExpired': { mn: 'Хугацаа дууссан',                      en: 'Expired' },
  'subscription.expiresOn':     { mn: 'Дуусах огноо',                         en: 'Expires on' },
  'subscription.choosePlan':    { mn: 'Багц сонгох',                          en: 'Choose a plan' },
  'subscription.upgrade':       { mn: 'Шинэчлэх',                             en: 'Upgrade' },
  'subscription.switchPlan':    { mn: 'Багц солих',                           en: 'Switch plan' },
  'subscription.cancel':        { mn: 'Багцаа цуцлах',                        en: 'Cancel subscription' },
  'subscription.cancelConfirm': { mn: 'Багцаа цуцлахдаа итгэлтэй байна уу?',  en: 'Cancel your subscription?' },
  'subscription.canceled':      { mn: 'Багц цуцлагдлаа',                      en: 'Subscription canceled' },
  'subscription.free':          { mn: 'Үнэгүй',                               en: 'Free' },
  'subscription.month':         { mn: '/сар',                                 en: '/mo' },
  'subscription.planFree':      { mn: 'Үнэгүй багц',                          en: 'Free plan' },
  'subscription.planPro':       { mn: 'Pro · Хосын багц',                     en: 'Pro · Couple plan' },
  'subscription.planPremium':   { mn: 'Премиум · Гэр бүлийн багц',            en: 'Premium · Family plan' },
  'subscription.freeDesc':      { mn: 'Ганцаараа эсвэл оюутны хэрэглээнд',    en: 'For solo or student use' },
  'subscription.proDesc':       { mn: 'Хосуудын хамтын санхүү',               en: 'Shared finance for couples' },
  'subscription.premiumDesc':   { mn: 'Гэр бүлийн бүх гишүүдэд',              en: 'For the whole family' },
  'subscription.featureBase':   { mn: 'Гүйлгээ, төсөв, тайлан',               en: 'Transactions, budgets, reports' },
  'subscription.featureCouple': { mn: 'Хоёулаа нэгэн данснаас хянах',         en: 'Two-account combined view' },
  'subscription.featureFamily': { mn: 'Хязгааргүй гишүүд',                    en: 'Unlimited members' },
  'subscription.current':       { mn: 'Идэвхтэй',                             en: 'Current' },
  'subscription.invitedBy':     { mn: 'Урилгаар нэгдсэн',                     en: 'Joined by invitation' },
  'subscription.invitedHint':   { mn: 'Та урилгаар нэгдсэн тул багцыг зөвхөн эзэмшигч удирдана.', en: 'You joined by invitation; only the owner can manage the plan.' },
  'subscription.inheritedFrom': { mn: 'Эзэмшигч',                             en: 'Owner' },

  // ── Lifestyle modes ──
  'mode.individual.label':    { mn: 'Энгийн',                en: 'Individual' },
  'mode.individual.subtitle': { mn: 'Танд тохирсон цэвэр workspace', en: 'Clean workspace for you' },
  'mode.couple.label':        { mn: 'Энгийн хосууд',          en: 'Couple' },
  'mode.couple.subtitle':     { mn: 'Хамтын санхүүгийн зохион байгуулалт', en: 'Shared finance organization' },
  'mode.family.label':        { mn: 'Гэр бүл',               en: 'Family' },
  'mode.family.subtitle':     { mn: 'Илүү дулаан, тогтвортой уур амьсгал', en: 'Warmer, stable atmosphere' },
  'mode.student.label':       { mn: 'Оюутан',                en: 'Student' },
  'mode.student.subtitle':    { mn: 'Хөнгөн, хурдан, хэмнэлттэй UI', en: 'Light, fast, efficient UI' },

  // ── Categories (expense) ──
  'cat.Хоол':         { mn: 'Хоол',          en: 'Food' },
  'cat.Тээвэр':       { mn: 'Тээвэр',        en: 'Transport' },
  'cat.Дэлгүүр':      { mn: 'Дэлгүүр',       en: 'Shopping' },
  'cat.Төлбөр':       { mn: 'Төлбөр',        en: 'Bills' },
  'cat.Зугаа цэнгэл': { mn: 'Зугаа цэнгэл',  en: 'Entertainment' },
  'cat.Бусад':        { mn: 'Бусад',         en: 'Other' },
  'cat.Цалин':        { mn: 'Цалин',         en: 'Salary' },
  'cat.Фриланс':      { mn: 'Фриланс',       en: 'Freelance' },
} as const satisfies Record<string, Record<Lang, string>>

export type TKey = keyof typeof translations

export function isLang(v: unknown): v is Lang {
  return v === 'mn' || v === 'en'
}

export function translate(lang: Lang, key: TKey): string {
  return translations[key][lang]
}

// Translate a category by Mongolian source name; falls back to the original string.
export function translateCategory(lang: Lang, cat: string): string {
  const key = `cat.${cat}` as TKey
  if (key in translations) return translations[key][lang]
  return cat
}
