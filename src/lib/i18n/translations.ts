/**
 * All user-facing landing page copy lives here, one dictionary per language.
 * The Arabic dictionary is typed against the English one, so a missing key
 * fails the typecheck instead of silently falling back to English.
 */

export type Locale = "en" | "ar";

export const LOCALES: Locale[] = ["en", "ar"];
export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_META: Record<Locale, { dir: "ltr" | "rtl"; nativeName: string; short: string }> =
  {
    en: { dir: "ltr", nativeName: "English", short: "EN" },
    ar: { dir: "rtl", nativeName: "العربية", short: "ع" },
  };

const en = {
  brand: {
    name: "AI CFO",
    tagline: "Your financial co-pilot for small business.",
  },
  nav: {
    features: "Features",
    howItWorks: "How It Works",
    about: "About",
    login: "Log in",
    getStarted: "Get Started",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    language: "Language",
    mainNav: "Main navigation",
  },
  hero: {
    eyebrow: "The finance team you couldn't afford, now on demand",
    titleLead: "Understand your business finances",
    titleAccent: "in minutes, not months.",
    subtitle:
      "AI CFO reads your invoices and expenses, organizes your numbers, and explains what they mean in plain language, so you can make confident decisions.",
    primaryCta: "Get Started",
    secondaryCta: "See how it works",
    trust: ["Built for small businesses", "Clear, plain-language insights", "Arabic and English"],
  },
  preview: {
    badge: "Illustrative sample data",
    windowTitle: "Dashboard · Preview",
    period: "Last 6 months",
    greeting: "Good morning",
    business: "Sample Bakery Co.",
    kpis: {
      revenue: "Revenue",
      expenses: "Expenses",
      netProfit: "Net Profit",
      cashFlow: "Cash Flow",
    },
    vsLastMonth: "vs last month",
    chartTitle: "Revenue vs. expenses",
    legendRevenue: "Revenue",
    legendExpenses: "Expenses",
    months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    insightLabel: "AI insight",
    insightText: "Profit margin improved to 34% this month, mainly from lower ingredient costs.",
    sidebar: ["Overview", "Invoices", "Expenses", "Reports"],
    disclaimer: "All figures are fictional examples for illustration only.",
  },
  features: {
    eyebrow: "Features",
    title: "Everything a CFO would do, made simple",
    subtitle:
      "From the first receipt to the monthly report, AI CFO handles the busywork and highlights what matters.",
    items: [
      {
        title: "Invoice processing",
        body: "Upload an invoice or photo and AI CFO extracts the vendor, amounts, taxes, and due dates for you.",
      },
      {
        title: "Expense tracking",
        body: "Every expense is categorized automatically, so you always know where your money is going.",
      },
      {
        title: "Financial insights",
        body: "Get plain-language explanations of trends, risks, and opportunities hidden in your numbers.",
      },
      {
        title: "Automated reports",
        body: "Clear profit and loss, cash flow, and expense summaries, prepared for you every month.",
      },
    ],
  },
  how: {
    eyebrow: "How It Works",
    title: "From scattered paperwork to clear answers in three steps",
    steps: [
      {
        title: "Add your documents",
        body: "Upload invoices, receipts, and statements, or forward them by email. No accounting knowledge needed.",
      },
      {
        title: "AI organizes everything",
        body: "AI CFO reads each document, categorizes transactions, and builds an accurate picture of your finances.",
      },
      {
        title: "Get clear guidance",
        body: "See your key numbers at a glance and receive practical insights you can act on right away.",
      },
    ],
    stepLabel: "Step",
  },
  insights: {
    eyebrow: "AI Financial Insights",
    title: "Answers, not just spreadsheets",
    subtitle:
      "AI CFO watches your numbers continuously and tells you what changed, why it matters, and what you could do next.",
    points: [
      "Spots unusual spending before it becomes a problem",
      "Reminds you about overdue invoices and upcoming bills",
      "Explains your cash position in simple terms",
    ],
    cardTitle: "This week's insights",
    cardBadge: "Sample",
    items: [
      {
        tone: "warning",
        title: "Software subscriptions are up 22%",
        body: "Three new tools were added this quarter. Two have overlapping features and could be consolidated.",
      },
      {
        tone: "positive",
        title: "Healthy cash runway",
        body: "At your current spending, available cash covers about 5.5 months of operating costs.",
      },
      {
        tone: "info",
        title: "1 invoice is 14 days overdue",
        body: "A sample invoice of $2,400 is past due. A friendly reminder could speed up payment.",
      },
    ],
    askPlaceholder: "Ask: “Why were expenses higher in May?”",
  },
  about: {
    eyebrow: "About",
    title: "Built for owners, not accountants",
    body: "Most small business owners don't have a finance team. AI CFO was created to give every owner the clarity a chief financial officer provides: knowing where the money goes, what is changing, and what to do next.",
    values: [
      { title: "Clarity first", body: "Plain language over jargon, and numbers you can trust at a glance." },
      { title: "Privacy by design", body: "Your financial data belongs to you and is treated with care." },
      { title: "Honest guidance", body: "Insights explain their reasoning, so you stay in control of decisions." },
    ],
  },
  cta: {
    title: "Ready to see your finances clearly?",
    subtitle: "Be among the first small businesses to try AI CFO when accounts open.",
    primary: "Get Started",
    secondary: "Explore features",
    note: "No credit card required.",
  },
  footer: {
    product: "Product",
    company: "Company",
    rights: "All rights reserved.",
    disclaimer:
      "Figures shown on this page are illustrative samples and do not represent real businesses.",
  },
  toasts: {
    comingSoonTitle: "Coming soon",
    loginBody: "Sign-in will be available in the next release of AI CFO.",
    signupBody: "Account creation will open in the next release of AI CFO.",
  },
};

export type Dictionary = typeof en;

const ar: Dictionary = {
  brand: {
    name: "AI CFO",
    tagline: "شريكك المالي الذكي لإدارة أعمالك الصغيرة.",
  },
  nav: {
    features: "المزايا",
    howItWorks: "كيف يعمل",
    about: "من نحن",
    login: "تسجيل الدخول",
    getStarted: "ابدأ الآن",
    openMenu: "فتح القائمة",
    closeMenu: "إغلاق القائمة",
    language: "اللغة",
    mainNav: "التنقل الرئيسي",
  },
  hero: {
    eyebrow: "فريق مالي متكامل كان بعيد المنال، أصبح في متناولك",
    titleLead: "افهم الوضع المالي لنشاطك التجاري",
    titleAccent: "في دقائق، لا في شهور.",
    subtitle:
      "يقرأ AI CFO فواتيرك ومصروفاتك، وينظّم أرقامك، ويشرح لك معناها بلغة بسيطة، لتتخذ قراراتك بثقة.",
    primaryCta: "ابدأ الآن",
    secondaryCta: "تعرّف على طريقة العمل",
    trust: ["مصمَّم للأعمال الصغيرة", "رؤى واضحة وبسيطة", "بالعربية والإنجليزية"],
  },
  preview: {
    badge: "بيانات توضيحية",
    windowTitle: "لوحة التحكم · معاينة",
    period: "آخر 6 أشهر",
    greeting: "صباح الخير",
    business: "مخبز تجريبي",
    kpis: {
      revenue: "الإيرادات",
      expenses: "المصروفات",
      netProfit: "صافي الربح",
      cashFlow: "التدفق النقدي",
    },
    vsLastMonth: "مقارنة بالشهر الماضي",
    chartTitle: "الإيرادات مقابل المصروفات",
    legendRevenue: "الإيرادات",
    legendExpenses: "المصروفات",
    months: ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو"],
    insightLabel: "رؤية ذكية",
    insightText: "ارتفع هامش الربح إلى 34% هذا الشهر، ويعود ذلك أساسًا إلى انخفاض تكلفة المواد الخام.",
    sidebar: ["نظرة عامة", "الفواتير", "المصروفات", "التقارير"],
    disclaimer: "جميع الأرقام أمثلة افتراضية لأغراض التوضيح فقط.",
  },
  features: {
    eyebrow: "المزايا",
    title: "كل ما يقدّمه المدير المالي، بطريقة أبسط",
    subtitle:
      "من أول إيصال حتى التقرير الشهري، يتولّى AI CFO المهام الروتينية ويُبرز لك ما يستحق الاهتمام.",
    items: [
      {
        title: "معالجة الفواتير",
        body: "ارفع الفاتورة أو صورتها، وسيستخرج AI CFO اسم المورّد والمبالغ والضرائب وتواريخ الاستحقاق.",
      },
      {
        title: "تتبّع المصروفات",
        body: "تُصنَّف كل المصروفات تلقائيًا، لتعرف دائمًا أين تذهب أموالك.",
      },
      {
        title: "رؤى مالية",
        body: "احصل على شرح واضح للاتجاهات والمخاطر والفرص الكامنة في أرقامك.",
      },
      {
        title: "تقارير تلقائية",
        body: "ملخصات واضحة للأرباح والخسائر والتدفق النقدي والمصروفات، تُعَدّ لك كل شهر.",
      },
    ],
  },
  how: {
    eyebrow: "كيف يعمل",
    title: "من أوراق متفرقة إلى إجابات واضحة في ثلاث خطوات",
    steps: [
      {
        title: "أضف مستنداتك",
        body: "ارفع الفواتير والإيصالات وكشوف الحساب، أو أرسلها عبر البريد الإلكتروني. لا تحتاج إلى خبرة محاسبية.",
      },
      {
        title: "الذكاء الاصطناعي ينظّم كل شيء",
        body: "يقرأ AI CFO كل مستند، ويصنّف المعاملات، ويكوّن صورة دقيقة عن وضعك المالي.",
      },
      {
        title: "احصل على توجيه واضح",
        body: "اطّلع على أرقامك الأساسية بنظرة واحدة، واحصل على رؤى عملية يمكنك تطبيقها فورًا.",
      },
    ],
    stepLabel: "الخطوة",
  },
  insights: {
    eyebrow: "الرؤى المالية الذكية",
    title: "إجابات، لا مجرد جداول",
    subtitle:
      "يتابع AI CFO أرقامك باستمرار، ويخبرك بما تغيّر، ولماذا يهمّك ذلك، وما الخطوة التالية الممكنة.",
    points: [
      "يرصد الإنفاق غير المعتاد قبل أن يتحوّل إلى مشكلة",
      "يذكّرك بالفواتير المتأخرة والمدفوعات القادمة",
      "يشرح وضعك النقدي بعبارات بسيطة",
    ],
    cardTitle: "رؤى هذا الأسبوع",
    cardBadge: "مثال",
    items: [
      {
        tone: "warning",
        title: "ارتفاع اشتراكات البرامج بنسبة 22%",
        body: "أُضيفت ثلاث أدوات جديدة هذا الربع، واثنتان منها متشابهتان في الوظائف ويمكن دمجهما.",
      },
      {
        tone: "positive",
        title: "سيولة نقدية مطمئنة",
        body: "بمستوى إنفاقك الحالي، يغطي النقد المتاح نحو 5.5 أشهر من التكاليف التشغيلية.",
      },
      {
        tone: "info",
        title: "فاتورة واحدة متأخرة منذ 14 يومًا",
        body: "فاتورة تجريبية بقيمة $2,400 تجاوزت موعد استحقاقها. قد يساعد تذكير لطيف على تسريع السداد.",
      },
    ],
    askPlaceholder: "اسأل: «لماذا ارتفعت المصروفات في مايو؟»",
  },
  about: {
    eyebrow: "من نحن",
    title: "صُمّم لأصحاب الأعمال، لا للمحاسبين",
    body: "معظم أصحاب الأعمال الصغيرة لا يملكون فريقًا ماليًا. لذلك أُنشئ AI CFO ليمنح كل صاحب عمل الوضوح الذي يقدّمه المدير المالي: أن يعرف أين تذهب الأموال، وما الذي يتغيّر، وما الخطوة التالية.",
    values: [
      { title: "الوضوح أولًا", body: "لغة بسيطة بعيدًا عن المصطلحات المعقّدة، وأرقام يمكنك الوثوق بها من النظرة الأولى." },
      { title: "الخصوصية من الأساس", body: "بياناتك المالية ملكك، ونتعامل معها بعناية تامة." },
      { title: "توجيه صادق", body: "كل رؤية توضّح أسبابها، لتبقى القرارات بيدك دائمًا." },
    ],
  },
  cta: {
    title: "هل أنت مستعد لرؤية وضعك المالي بوضوح؟",
    subtitle: "كن من أوائل الأعمال الصغيرة التي تجرّب AI CFO عند فتح التسجيل.",
    primary: "ابدأ الآن",
    secondary: "استكشف المزايا",
    note: "لا حاجة إلى بطاقة ائتمان.",
  },
  footer: {
    product: "المنتج",
    company: "الشركة",
    rights: "جميع الحقوق محفوظة.",
    disclaimer: "الأرقام المعروضة في هذه الصفحة أمثلة توضيحية ولا تمثّل أعمالًا حقيقية.",
  },
  toasts: {
    comingSoonTitle: "قريبًا",
    loginBody: "سيتوفّر تسجيل الدخول في الإصدار القادم من AI CFO.",
    signupBody: "سيُتاح إنشاء الحساب في الإصدار القادم من AI CFO.",
  },
};

export const dictionaries: Record<Locale, Dictionary> = { en, ar };

export function isLocale(value: unknown): value is Locale {
  return value === "en" || value === "ar";
}
