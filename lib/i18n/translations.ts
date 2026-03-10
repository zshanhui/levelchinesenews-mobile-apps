/**
 * Single file containing all UI translations.
 * English is the default; fallback when a key is missing.
 */
export const translations = {
  en: {
    // Brand & tabs
    brand: 'LevelChineseNews',
    'tabs.articles': 'articles',
    'tabs.create': 'create',
    'tabs.settings': 'settings',

    // Articles list (index)
    loadingArticles: 'Loading articles…',
    retry: 'Retry',
    noArticlesYet: 'no articles yet',
    addArticlesHint: 'add articles from the create tab by pasting a news url',

    // Create tab
    parse: 'parse',
    myArticles: 'my articles ({{count}})',
    noArticlesParseFirst: 'no articles yet — parse one first',
    fetching: 'fetching…',
    indexing: 'indexing…',
    articleSaved: 'article saved',
    newArticleCreated: 'new article created',
    articleAlreadyCreated:
      'This article was already created — no need to fetch again',
    fetchAnotherArticle: 'fetch another article',
    enterUrl: 'Enter a supported url to fetch an article',
    urlPlaceholder: 'https://zaobao.com/...',
    dailyLimitReached: 'daily limit reached — come back tomorrow',
    parsesRemaining: '{{remaining}} of {{max}} parses remaining today',
    supportedSites: 'supported sites',
    parseArticleUrl: 'Parse article URL',

    // Settings
    settings: 'settings',
    configurePreferences: 'language and general preferences',
    darkMode: 'dark mode (cyberpunk)',
    configureLocalDict: 'configure local dictionary',
    downloadAndReset: 'download and reset',
    readerPreferences: 'reader preferences',
    useNotoSansSc: 'use noto sans sc for chinese',
    showPinyin: 'show pinyin in articles',
    adjustLineSpacing: 'adjust line spacing in article content view',
    lineSpacingCompact: 'compact',
    lineSpacingNormal: 'normal',
    lineSpacingRelaxed: 'relaxed',
    lineSpacingNumbersCompact: '0px, 8px',
    lineSpacingNumbersNormal: '6px, 24px',
    lineSpacingNumbersRelaxed: '14px, 40px',
    adjustFontSize: 'adjust article font size',
    debugEnvVars: 'Debug – environment variables',

    // Article detail
    article: 'article',
    back: 'back',
    loading: 'loading…',
    cached: 'cached',
    seed: 'seed',
    noContentAvailable: 'no content available',
    openSettings: 'Open settings',
    openSourceArticle: 'open source article',

    // Not found
    notFound: 'oops! not found',
    goBackHome: 'go back to home',

    // Local dict / dictionary
    localDictionary: 'local dictionary',
    localDictionarySettings: 'local dictionary settings',

    // Article card (translation)
    translationFailed: 'Translation failed',
    couldNotGenerateTranslation:
      'Could not generate translation. Please try again.',
    generatingTranslation: 'Generating translation…',
    showChineseTitle: 'Show Chinese title',
    showEnglishTranslation: 'Show English translation',
    requestTranslation: 'Request translation',
    openArticle: 'open article: {{title}}',

    // Native language selector
    nativeLanguage: 'native language',
    nativeLanguageHint:
      'Your native language will be used to provide translations and other helpful hints.',
    selectNativeLanguage: 'select native language',
    select: 'Select',
    langEnglish: '🇺🇸 English',
    langSpanish: '🇪🇸 Español',
    langMalay: '🇲🇾 Bahasa Melayu',
    langArabic: '🇸🇦 العربية',
    langChinese: '🇨🇳 简体中文 (only UI)',

    // Article content
    nativeLanguageDefinitionPlaceholder: 'native language definition goes here..',
    openInPleco: 'Open in Pleco dictionary',
    pleco: 'Pleco',
    plecoSource: 'Level Chinese News',

    // Cache / seed indicators
    cachedLabel: 'Cached {{label}}',
    seedData: 'Seed data',

    // Errors (api / useArticles)
    somethingWentWrong: 'Something went wrong. Please try again.',
    requestTimedOut: 'Request timed out. Please try again.',
    unableToConnect:
      'Unable to connect. Please check your internet connection.',
    serverError: 'Server error. Please try again later.',
    errorNotFound: 'Not found.',
    articleNotFound: 'Article not found',
    failedToLoadArticles: 'Failed to load articles.',
    failedToRefresh: 'Failed to refresh.',
    failedToLoadMore: 'Failed to load more.',
  },
  es: {
    // Brand & tabs
    brand: 'LevelChineseNews',
    'tabs.articles': 'artículos',
    'tabs.create': 'crear',
    'tabs.settings': 'ajustes',

    // Articles list (index)
    loadingArticles: 'Cargando artículos…',
    retry: 'Reintentar',
    noArticlesYet: 'aún no hay artículos',
    addArticlesHint:
      'añade artículos desde la pestaña crear pegando una url de noticias',

    // Create tab
    parse: 'analizar',
    myArticles: 'mis artículos ({{count}})',
    noArticlesParseFirst: 'aún no hay artículos — analiza uno primero',
    fetching: 'obteniendo…',
    indexing: 'indexando…',
    articleSaved: 'artículo guardado',
    newArticleCreated: 'nuevo artículo creado',
    articleAlreadyCreated:
      'Este artículo ya fue creado — no es necesario analizarlo de nuevo',
    fetchAnotherArticle: 'analizar otro artículo',
    enterUrl: 'Introduce una url compatible para obtener un artículo',
    urlPlaceholder: 'https://zaobao.com/...',
    dailyLimitReached: 'límite diario alcanzado — vuelve mañana',
    parsesRemaining: '{{remaining}} de {{max}} análisis restantes hoy',
    supportedSites: 'sitios compatibles',
    parseArticleUrl: 'Analizar URL del artículo',

    // Settings
    settings: 'ajustes',
    configurePreferences: 'idioma y preferencias generales',
    darkMode: 'modo oscuro (cyberpunk)',
    configureLocalDict: 'configurar diccionario local',
    downloadAndReset: 'descargar y restablecer',
    readerPreferences: 'preferencias de lectura',
    useNotoSansSc: 'usar Noto Sans SC para chino',
    showPinyin: 'mostrar pinyin en los artículos',
    adjustLineSpacing: 'ajustar espaciado entre líneas en el contenido',
    lineSpacingCompact: 'compacto',
    lineSpacingNormal: 'normal',
    lineSpacingRelaxed: 'amplio',
    lineSpacingNumbersCompact: '0px, 8px',
    lineSpacingNumbersNormal: '6px, 24px',
    lineSpacingNumbersRelaxed: '14px, 40px',
    adjustFontSize: 'ajustar tamaño de fuente del artículo',
    debugEnvVars: 'Depuración – variables de entorno',

    // Article detail
    article: 'artículo',
    back: 'atrás',
    loading: 'cargando…',
    cached: 'en caché',
    seed: 'semilla',
    noContentAvailable: 'no hay contenido disponible',
    openSettings: 'Abrir ajustes',
    openSourceArticle: 'abrir artículo fuente',

    // Not found
    notFound: '¡ups! no encontrado',
    goBackHome: 'volver al inicio',

    // Local dict / dictionary
    localDictionary: 'diccionario local',
    localDictionarySettings: 'ajustes del diccionario local',

    // Article card (translation)
    translationFailed: 'Traducción fallida',
    couldNotGenerateTranslation:
      'No se pudo generar la traducción. Inténtalo de nuevo.',
    generatingTranslation: 'Generando traducción…',
    showChineseTitle: 'Mostrar título en chino',
    showEnglishTranslation: 'Mostrar traducción al inglés',
    requestTranslation: 'Solicitar traducción',
    openArticle: 'abrir artículo: {{title}}',

    // Native language selector
    nativeLanguage: 'idioma nativo',
    nativeLanguageHint:
      'Tu idioma nativo se usará para proporcionar traducciones y otras sugerencias útiles.',
    selectNativeLanguage: 'seleccionar idioma nativo',
    select: 'Seleccionar',
    langEnglish: '🇺🇸 English',
    langSpanish: '🇪🇸 Español',
    langMalay: '🇲🇾 Bahasa Melayu',
    langArabic: '🇸🇦 العربية',
    langChinese: '🇨🇳 简体中文 (only UI)',

    // Article content
    nativeLanguageDefinitionPlaceholder:
      'la definición en tu idioma aparece aquí..',
    openInPleco: 'Abrir en diccionario Pleco',
    pleco: 'Pleco',
    plecoSource: 'Level Chinese News',

    // Cache / seed indicators
    cachedLabel: 'En caché {{label}}',
    seedData: 'Datos de muestra',

    // Errors (api / useArticles)
    somethingWentWrong: 'Algo salió mal. Inténtalo de nuevo.',
    requestTimedOut: 'La solicitud expiró. Inténtalo de nuevo.',
    unableToConnect:
      'No se puede conectar. Comprueba tu conexión a internet.',
    serverError: 'Error del servidor. Inténtalo más tarde.',
    errorNotFound: 'No encontrado.',
    articleNotFound: 'Artículo no encontrado',
    failedToLoadArticles: 'Error al cargar los artículos.',
    failedToRefresh: 'Error al actualizar.',
    failedToLoadMore: 'Error al cargar más.',
  },
  ms: {
    // Brand & tabs
    brand: 'LevelChineseNews',
    'tabs.articles': 'artikel',
    'tabs.create': 'cipta',
    'tabs.settings': 'tetapan',

    // Articles list (index)
    loadingArticles: 'Memuatkan artikel…',
    retry: 'Cuba semula',
    noArticlesYet: 'belum ada artikel',
    addArticlesHint:
      'tambah artikel daripada tab cipta dengan menampal url berita',

    // Create tab
    parse: 'hurai',
    myArticles: 'artikel saya ({{count}})',
    noArticlesParseFirst: 'belum ada artikel — hurai satu dahulu',
    fetching: 'memuatkan…',
    indexing: 'mengindeks…',
    articleSaved: 'artikel disimpan',
    newArticleCreated: 'artikel baharu dicipta',
    articleAlreadyCreated:
      'Artikel ini telah dicipta — tidak perlu dimuat semula',
    fetchAnotherArticle: 'hurai artikel lain',
    enterUrl: 'Masukkan url yang disokong untuk memuat artikel',
    urlPlaceholder: 'https://zaobao.com/...',
    dailyLimitReached: 'had harian dicapai — kembali esok',
    parsesRemaining: '{{remaining}} daripada {{max}} huraian tinggal hari ini',
    supportedSites: 'laman web disokong',
    parseArticleUrl: 'Hurai URL artikel',

    // Settings
    settings: 'tetapan',
    configurePreferences: 'bahasa dan pilihan umum',
    darkMode: 'mod gelap (cyberpunk)',
    configureLocalDict: 'konfigurasi kamus tempatan',
    downloadAndReset: 'muat turun dan set semula',
    readerPreferences: 'pilihan pembaca',
    useNotoSansSc: 'gunakan Noto Sans SC untuk Cina',
    showPinyin: 'tunjukkan pinyin dalam artikel',
    adjustLineSpacing: 'laras jarak baris dalam kandungan artikel',
    lineSpacingCompact: 'padat',
    lineSpacingNormal: 'normal',
    lineSpacingRelaxed: 'lega',
    lineSpacingNumbersCompact: '0px, 8px',
    lineSpacingNumbersNormal: '6px, 24px',
    lineSpacingNumbersRelaxed: '14px, 40px',
    adjustFontSize: 'laras saiz fon artikel',
    debugEnvVars: 'Debug – pemboleh ubah persekitaran',

    // Article detail
    article: 'artikel',
    back: 'kembali',
    loading: 'memuatkan…',
    cached: 'disimpan dalam cache',
    seed: 'data contoh',
    noContentAvailable: 'tiada kandungan tersedia',
    openSettings: 'Buka tetapan',
    openSourceArticle: 'buka artikel sumber',

    // Not found
    notFound: 'ops! tidak dijumpai',
    goBackHome: 'kembali ke laman utama',

    // Local dict / dictionary
    localDictionary: 'kamus tempatan',
    localDictionarySettings: 'tetapan kamus tempatan',

    // Article card (translation)
    translationFailed: 'Terjemahan gagal',
    couldNotGenerateTranslation:
      'Tidak dapat menjana terjemahan. Sila cuba lagi.',
    generatingTranslation: 'Menjana terjemahan…',
    showChineseTitle: 'Tunjukkan tajuk Cina',
    showEnglishTranslation: 'Tunjukkan terjemahan Inggeris',
    requestTranslation: 'Minta terjemahan',
    openArticle: 'buka artikel: {{title}}',

    // Native language selector
    nativeLanguage: 'bahasa ibunda',
    nativeLanguageHint:
      'Bahasa ibunda anda akan digunakan untuk menyediakan terjemahan dan petua berguna lain.',
    selectNativeLanguage: 'pilih bahasa ibunda',
    select: 'Pilih',
    langEnglish: '🇺🇸 English',
    langSpanish: '🇪🇸 Español',
    langMalay: '🇲🇾 Bahasa Melayu',
    langArabic: '🇸🇦 العربية',
    langChinese: '🇨🇳 简体中文 (only UI)',

    // Article content
    nativeLanguageDefinitionPlaceholder:
      'definisi dalam bahasa ibunda akan muncul di sini..',
    openInPleco: 'Buka dalam kamus Pleco',
    pleco: 'Pleco',
    plecoSource: 'Level Chinese News',

    // Cache / seed indicators
    cachedLabel: 'Cache {{label}}',
    seedData: 'Data contoh',

    // Errors (api / useArticles)
    somethingWentWrong: 'Sesuatu tidak kena. Sila cuba lagi.',
    requestTimedOut: 'Permintaan tamat masa. Sila cuba lagi.',
    unableToConnect:
      'Tidak dapat bersambung. Sila semak sambungan internet anda.',
    serverError: 'Ralat pelayan. Sila cuba lagi nanti.',
    errorNotFound: 'Tidak dijumpai.',
    articleNotFound: 'Artikel tidak dijumpai',
    failedToLoadArticles: 'Gagal memuat artikel.',
    failedToRefresh: 'Gagal menyegarkan.',
    failedToLoadMore: 'Gagal memuat lagi.',
  },
  ar: {
    // Brand & tabs
    brand: 'LevelChineseNews',
    'tabs.articles': 'المقالات',
    'tabs.create': 'إنشاء',
    'tabs.settings': 'الإعدادات',

    // Articles list (index)
    loadingArticles: 'جاري تحميل المقالات…',
    retry: 'إعادة المحاولة',
    noArticlesYet: 'لا توجد مقالات بعد',
    addArticlesHint:
      'أضف مقالات من تبويب إنشاء عن طريق لصق رابط خبر',

    // Create tab
    parse: 'تحليل',
    myArticles: 'مقالاتي ({{count}})',
    noArticlesParseFirst: 'لا توجد مقالات — قم بتحليل واحدة أولاً',
    fetching: 'جاري الجلب…',
    indexing: 'جاري الفهرسة…',
    articleSaved: 'تم حفظ المقال',
    newArticleCreated: 'تم إنشاء مقال جديد',
    articleAlreadyCreated:
      'تم إنشاء هذا المقال مسبقًا — لا حاجة لجلبها مرة أخرى',
    fetchAnotherArticle: 'جلب مقال آخر',
    enterUrl: 'أدخل رابطًا مدعومًا لجلب مقال',
    urlPlaceholder: 'https://zaobao.com/...',
    dailyLimitReached: 'تم الوصول للحد اليومي — عد غدًا',
    parsesRemaining: '{{remaining}} من {{max}} تحليلات متبقية اليوم',
    supportedSites: 'المواقع المدعومة',
    parseArticleUrl: 'تحليل رابط المقال',

    // Settings
    settings: 'الإعدادات',
    configurePreferences: 'اللغة والتفضيلات العامة',
    darkMode: 'الوضع الداكن (سايبربانك)',
    configureLocalDict: 'تكوين القاموس المحلي',
    downloadAndReset: 'تنزيل وإعادة تعيين',
    readerPreferences: 'تفضيلات القارئ',
    useNotoSansSC: 'استخدام Noto Sans SC للنصوص الصينية',
    showPinyin: 'إظهار البينيين في المقالات',
    adjustLineSpacing: 'ضبط تباعد الأسطر في عرض المحتوى',
    lineSpacingCompact: 'مضغوط',
    lineSpacingNormal: 'عادي',
    lineSpacingRelaxed: 'واسع',
    lineSpacingNumbersCompact: '0px, 8px',
    lineSpacingNumbersNormal: '6px, 24px',
    lineSpacingNumbersRelaxed: '14px, 40px',
    adjustFontSize: 'ضبط حجم خط المقال',
    debugEnvVars: 'تصحيح الأخطاء – متغيرات البيئة',

    // Article detail
    article: 'مقال',
    back: 'رجوع',
    loading: 'جاري التحميل…',
    cached: 'مخزن مؤقتاً',
    seed: 'بيانات تجريبية',
    noContentAvailable: 'لا يوجد محتوى متاح',
    openSettings: 'فتح الإعدادات',
    openSourceArticle: 'فتح المقال الأصلي',

    // Not found
    notFound: 'عذراً! غير موجود',
    goBackHome: 'العودة للرئيسية',

    // Local dict / dictionary
    localDictionary: 'القاموس المحلي',
    localDictionarySettings: 'إعدادات القاموس المحلي',

    // Article card (translation)
    translationFailed: 'فشل الترجمة',
    couldNotGenerateTranslation:
      'تعذر إنشاء الترجمة. يرجى المحاولة مرة أخرى.',
    generatingTranslation: 'جاري إنشاء الترجمة…',
    showChineseTitle: 'إظهار العنوان بالصينية',
    showEnglishTranslation: 'إظهار الترجمة بالإنجليزية',
    requestTranslation: 'طلب ترجمة',
    openArticle: 'فتح المقال: {{title}}',

    // Native language selector
    nativeLanguage: 'اللغة الأم',
    nativeLanguageHint:
      'سيتم استخدام لغتك الأم لتوفير الترجمات ونصائح أخرى مفيدة.',
    selectNativeLanguage: 'اختر اللغة الأم',
    select: 'اختر',
    langEnglish: '🇺🇸 English',
    langSpanish: '🇪🇸 Español',
    langMalay: '🇲🇾 Bahasa Melayu',
    langArabic: '🇸🇦 العربية',
    langChinese: '🇨🇳 简体中文 (only UI)',

    // Article content
    nativeLanguageDefinitionPlaceholder:
      'سيظهر تعريف لغتك الأم هنا..',
    openInPleco: 'فتح في قاموس بليكو',
    pleco: 'بليكو',
    plecoSource: 'Level Chinese News',

    // Cache / seed indicators
    cachedLabel: 'مخزن {{label}}',
    seedData: 'بيانات تجريبية',

    // Errors (api / useArticles)
    somethingWentWrong: 'حدث خطأ ما. يرجى المحاولة مرة أخرى.',
    requestTimedOut: 'انتهت مهلة الطلب. يرجى المحاولة مرة أخرى.',
    unableToConnect:
      'تعذر الاتصال. يرجى التحقق من اتصالك بالإنترنت.',
    serverError: 'خطأ في الخادم. يرجى المحاولة لاحقاً.',
    errorNotFound: 'غير موجود.',
    articleNotFound: 'المقال غير موجود',
    failedToLoadArticles: 'فشل تحميل المقالات.',
    failedToRefresh: 'فشل التحديث.',
    failedToLoadMore: 'فشل تحميل المزيد.',
  },
  zh: {
    // Brand & tabs
    brand: 'LevelChineseNews',
    'tabs.articles': '文章',
    'tabs.create': '创建',
    'tabs.settings': '设置',

    // Articles list (index)
    loadingArticles: '加载文章中…',
    retry: '重试',
    noArticlesYet: '暂无文章',
    addArticlesHint: '在创建标签页粘贴新闻链接添加文章',

    // Create tab
    parse: '解析',
    myArticles: '我的文章 ({{count}})',
    noArticlesParseFirst: '暂无文章 — 请先解析一篇',
    fetching: '获取中…',
    indexing: '索引中…',
    articleSaved: '文章已保存',
    newArticleCreated: '新文章已创建',
    articleAlreadyCreated: '该文章已创建 — 无需再次获取',
    fetchAnotherArticle: '解析另一篇文章',
    enterUrl: '输入支持的链接以获取文章',
    urlPlaceholder: 'https://zaobao.com/...',
    dailyLimitReached: '今日限额已用完 — 明天再来',
    parsesRemaining: '今日剩余 {{remaining}}/{{max}} 次解析',
    supportedSites: '支持的网站',
    parseArticleUrl: '解析文章链接',

    // Settings
    settings: '设置',
    configurePreferences: '语言和通用偏好',
    darkMode: '深色模式（赛博朋克）',
    configureLocalDict: '配置本地词典',
    downloadAndReset: '下载和重置',
    readerPreferences: '阅读偏好',
    useNotoSansSC: '中文使用思源黑体',
    showPinyin: '在文章中显示拼音',
    adjustLineSpacing: '调整文章内容的行距',
    lineSpacingCompact: '紧凑',
    lineSpacingNormal: '标准',
    lineSpacingRelaxed: '宽松',
    lineSpacingNumbersCompact: '0px, 8px',
    lineSpacingNumbersNormal: '6px, 24px',
    lineSpacingNumbersRelaxed: '14px, 40px',
    adjustFontSize: '调整文章字体大小',
    debugEnvVars: '调试 – 环境变量',

    // Article detail
    article: '文章',
    back: '返回',
    loading: '加载中…',
    cached: '已缓存',
    seed: '示例数据',
    noContentAvailable: '暂无内容',
    openSettings: '打开设置',
    openSourceArticle: '打开原文',

    // Not found
    notFound: '未找到页面',
    goBackHome: '返回首页',

    // Local dict / dictionary
    localDictionary: '本地词典',
    localDictionarySettings: '本地词典设置',

    // Article card (translation)
    translationFailed: '翻译失败',
    couldNotGenerateTranslation: '无法生成翻译，请重试。',
    generatingTranslation: '正在生成翻译…',
    showChineseTitle: '显示中文标题',
    showEnglishTranslation: '显示英文翻译',
    requestTranslation: '请求翻译',
    openArticle: '打开文章：{{title}}',

    // Native language selector
    nativeLanguage: '母语',
    nativeLanguageHint: '你的母语将用于提供翻译和其他帮助提示。',
    selectNativeLanguage: '选择母语',
    select: '选择',
    langEnglish: '🇺🇸 English',
    langSpanish: '🇪🇸 Español',
    langMalay: '🇲🇾 Bahasa Melayu',
    langArabic: '🇸🇦 العربية',
    langChinese: '🇨🇳 简体中文 (only UI)',

    // Article content
    nativeLanguageDefinitionPlaceholder: '母语释义将显示在此处..',
    openInPleco: '在 Pleco 词典中打开',
    pleco: 'Pleco',
    plecoSource: 'Level Chinese News',

    // Cache / seed indicators
    cachedLabel: '已缓存 {{label}}',
    seedData: '示例数据',

    // Errors (api / useArticles)
    somethingWentWrong: '出错了，请重试。',
    requestTimedOut: '请求超时，请重试。',
    unableToConnect: '无法连接，请检查网络。',
    serverError: '服务器错误，请稍后重试。',
    errorNotFound: '未找到。',
    articleNotFound: '文章未找到',
    failedToLoadArticles: '加载文章失败。',
    failedToRefresh: '刷新失败。',
    failedToLoadMore: '加载更多失败。',
  },
} as const;
