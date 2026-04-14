/**
 * Single file containing all UI translations.
 * English is the default; fallback when a key is missing.
 */
export const translations = {
  en: {
    // Brand & tabs
    brand: 'LevelChineseNews',
    'tabs.articles': 'Read',
    'tabs.create': 'Create',
    'tabs.settings': 'Settings',

    // Articles list (index)
    loadingArticles: 'Loading articles…',
    retry: 'Retry',
    noArticlesYet: 'no articles yet',
    addArticlesHint: 'add articles from the create tab by pasting a news url',
    loadMore: 'Load more',

    // Create tab
    parse: 'parse',
    myArticles: 'my articles ({{count}})',
    noArticlesParseFirst: 'no articles yet — parse one first',
    savedArticlesLoadFailed: "couldn't load saved articles",
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
    myArticlesFilterUnread: 'unread ({{count}})',
    myArticlesFilterFinished: 'finished ({{count}})',
    myArticlesFilterEmptyUnread: 'no unread articles',
    myArticlesFilterEmptyRead: 'no finished articles yet',

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
    aboutLink: 'About',
    contactLink: 'Contact',

    // Article detail
    article: 'article',
    back: 'back',
    loading: 'loading…',
    cached: 'cached',
    seed: 'seed',
    noContentAvailable: 'no content available',
    openSettings: 'Open settings',
    openSourceArticle: 'open source article',
    markRead: 'mark read',
    markUnread: 'mark unread',
    markedReadStatus: 'marked read',
    saveToMyArticles: 'Save to my articles',
    savedToMyArticles: 'Saved to my articles',
    removeFromMyArticles: 'Remove from my articles',
    removedFromMyArticles: 'Removed from my articles',
    saveArticleFailed: 'Could not save article',
    bookmarkSentence: 'Bookmark sentence',
    removeSentenceBookmark: 'Remove sentence bookmark',
    sentenceBookmarkSaved: 'Sentence bookmark saved',
    sentenceBookmarkRemoved: 'Sentence bookmark removed',
    sentenceBookmarkFailed: 'Could not update sentence bookmark',
    aiTranslatedWithDeepseek: 'AI translated with DeepSeek',

    // Not found
    notFound: 'oops! not found',
    goBackHome: 'go back to home',

    // Local dict / dictionary
    localDictionary: 'local dictionary',
    localDictionarySettings: 'local dictionary settings',
    downloadLocalDict: 'Load dictionary from remote',
    resetLocalDict: 'Reset local dictionary',
    resetting: 'Resetting…',
    downloading: 'Downloading…',
    downloadLocalDictHint:
      'Download the CE-DICT dictionary from the remote server and load it into your local database. Total size around 10mb.',
    dictEntriesCount: '{{count}} entries in local dictionary',
    randomEntrySample: 'sample phrase, proverb, 成语',
    showAnotherRandomEntry: 'Show another random entry',
    downloadFailed: 'Download failed',

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
    loadLocalDictFirstHint: 'please load local dictionary first to see definitions here',
    setupLocalDict: 'setup local dictionary',
    getPleco: 'Get Pleco',
    openPlecoWebsite: 'Open Pleco website',
    wordMissingInLocalDict: 'Word is missing in local dictionary, try Pleco or report missing.',
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
    networkUnstableOrOff: 'Your network connection is unstable or off.',
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
    'tabs.articles': 'Leer',
    'tabs.create': 'Crear',
    'tabs.settings': 'Ajustes',

    // Articles list (index)
    loadingArticles: 'Cargando artículos…',
    retry: 'Reintentar',
    noArticlesYet: 'aún no hay artículos',
    addArticlesHint:
      'añade artículos desde la pestaña crear pegando una url de noticias',
    loadMore: 'Cargar más',

    // Create tab
    parse: 'analizar',
    myArticles: 'mis artículos ({{count}})',
    noArticlesParseFirst: 'aún no hay artículos — analiza uno primero',
    savedArticlesLoadFailed: 'no se pudieron cargar los artículos guardados',
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
    myArticlesFilterUnread: 'sin leer ({{count}})',
    myArticlesFilterFinished: 'terminados ({{count}})',
    myArticlesFilterEmptyUnread: 'no hay artículos sin leer',
    myArticlesFilterEmptyRead: 'aún no hay artículos terminados',

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
    aboutLink: 'Acerca de',
    contactLink: 'Contacto',

    // Article detail
    article: 'artículo',
    back: 'atrás',
    loading: 'cargando…',
    cached: 'en caché',
    seed: 'semilla',
    noContentAvailable: 'no hay contenido disponible',
    openSettings: 'Abrir ajustes',
    openSourceArticle: 'abrir artículo fuente',
    markRead: 'marcar como leído',
    markUnread: 'marcar como no leído',
    markedReadStatus: 'marcado como leído',
    saveToMyArticles: 'Guardar en mis artículos',
    savedToMyArticles: 'Guardado en mis artículos',
    removeFromMyArticles: 'Quitar de mis artículos',
    removedFromMyArticles: 'Eliminado de mis artículos',
    saveArticleFailed: 'No se pudo guardar el artículo',
    bookmarkSentence: 'Marcar frase',
    removeSentenceBookmark: 'Quitar marcador de frase',
    sentenceBookmarkSaved: 'Frase guardada como marcador',
    sentenceBookmarkRemoved: 'Marcador de frase eliminado',
    sentenceBookmarkFailed: 'No se pudo actualizar el marcador de frase',
    aiTranslatedWithDeepseek: 'Traducido con IA (DeepSeek)',

    // Not found
    notFound: '¡ups! no encontrado',
    goBackHome: 'volver al inicio',

    // Local dict / dictionary
    localDictionary: 'diccionario local',
    localDictionarySettings: 'ajustes del diccionario local',
    downloadLocalDict: 'Cargar diccionario desde remoto',
    resetLocalDict: 'Restablecer diccionario local',
    resetting: 'Restableciendo…',
    downloading: 'Descargando…',
    downloadLocalDictHint:
      'Descarga el diccionario CEDICT del servidor remoto y cárgalo en tu base de datos local. Tamaño total aprox. 10mb.',
    dictEntriesCount: '{{count}} entradas en el diccionario local',
    randomEntrySample: 'muestra: frase, proverbio, 成语',
    showAnotherRandomEntry: 'Mostrar otra entrada aleatoria',
    downloadFailed: 'Error al descargar',

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
    loadLocalDictFirstHint: 'carga el diccionario local primero para ver las definiciones aquí',
    setupLocalDict: 'configurar diccionario local',
    getPleco: 'Obtener Pleco',
    openPlecoWebsite: 'Abrir sitio web de Pleco',
    wordMissingInLocalDict:
      'La palabra no está en el diccionario local, prueba Pleco o reporta como faltante.',
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
    networkUnstableOrOff:
      'Tu conexión de red es inestable o está desactivada.',
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
    'tabs.articles': 'Baca',
    'tabs.create': 'Cipta',
    'tabs.settings': 'Tetapan',

    // Articles list (index)
    loadingArticles: 'Memuatkan artikel…',
    retry: 'Cuba semula',
    noArticlesYet: 'belum ada artikel',
    addArticlesHint:
      'tambah artikel daripada tab cipta dengan menampal url berita',
    loadMore: 'Muat lagi',

    // Create tab
    parse: 'hurai',
    myArticles: 'artikel saya ({{count}})',
    noArticlesParseFirst: 'belum ada artikel — hurai satu dahulu',
    savedArticlesLoadFailed: 'gagal memuat artikel tersimpan',
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
    myArticlesFilterUnread: 'belum dibaca ({{count}})',
    myArticlesFilterFinished: 'selesai ({{count}})',
    myArticlesFilterEmptyUnread: 'tiada artikel yang belum dibaca',
    myArticlesFilterEmptyRead: 'belum ada artikel selesai',

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
    aboutLink: 'Perihal',
    contactLink: 'Hubungi',

    // Article detail
    article: 'artikel',
    back: 'kembali',
    loading: 'memuatkan…',
    cached: 'disimpan dalam cache',
    seed: 'data contoh',
    noContentAvailable: 'tiada kandungan tersedia',
    openSettings: 'Buka tetapan',
    openSourceArticle: 'buka artikel sumber',
    markRead: 'tandai telah dibaca',
    markUnread: 'tandai belum dibaca',
    markedReadStatus: 'ditandai sebagai dibaca',
    saveToMyArticles: 'Simpan ke artikel saya',
    savedToMyArticles: 'Disimpan ke artikel saya',
    removeFromMyArticles: 'Buang dari artikel saya',
    removedFromMyArticles: 'Dibuang dari artikel saya',
    saveArticleFailed: 'Tidak dapat menyimpan artikel',
    bookmarkSentence: 'Tandai ayat',
    removeSentenceBookmark: 'Buang penanda ayat',
    sentenceBookmarkSaved: 'Ayat ditandai',
    sentenceBookmarkRemoved: 'Penanda ayat dibuang',
    sentenceBookmarkFailed: 'Tidak dapat mengemas kini penanda ayat',
    aiTranslatedWithDeepseek: 'Diterjemahkan AI dengan DeepSeek',

    // Not found
    notFound: 'ops! tidak dijumpai',
    goBackHome: 'kembali ke laman utama',

    // Local dict / dictionary
    localDictionary: 'kamus tempatan',
    localDictionarySettings: 'tetapan kamus tempatan',
    downloadLocalDict: 'Muat kamus dari jauh',
    resetLocalDict: 'Set semula kamus tempatan',
    resetting: 'Menetapkan semula…',
    downloading: 'Memuat turun…',
    downloadLocalDictHint:
      'Muat turun kamus CEDICT dari pelayan jauh dan muat ke pangkalan data tempatan anda. Saiz keseluruhan kira-kira 10mb.',
    dictEntriesCount: '{{count}} entri dalam kamus tempatan',
    randomEntrySample: 'contoh frasa, peribahasa, 成语',
    showAnotherRandomEntry: 'Tunjukkan entri rawak lain',
    downloadFailed: 'Muat turun gagal',

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
    loadLocalDictFirstHint: 'sila muat kamus tempatan dahulu untuk melihat definisi di sini',
    setupLocalDict: 'setup kamus tempatan',
    getPleco: 'Dapatkan Pleco',
    openPlecoWebsite: 'Buka laman web Pleco',
    wordMissingInLocalDict:
      'Perkataan tiada dalam kamus tempatan, cuba Pleco atau laporkan sebagai tiada.',
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
    networkUnstableOrOff:
      'Sambungan rangkaian anda tidak stabil atau terputus.',
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
    'tabs.articles': 'قراءة',
    'tabs.create': 'إنشاء',
    'tabs.settings': 'الإعدادات',

    // Articles list (index)
    loadingArticles: 'جاري تحميل المقالات…',
    retry: 'إعادة المحاولة',
    noArticlesYet: 'لا توجد مقالات بعد',
    addArticlesHint:
      'أضف مقالات من تبويب إنشاء عن طريق لصق رابط خبر',
    loadMore: 'تحميل المزيد',

    // Create tab
    parse: 'تحليل',
    myArticles: 'مقالاتي ({{count}})',
    noArticlesParseFirst: 'لا توجد مقالات — قم بتحليل واحدة أولاً',
    savedArticlesLoadFailed: 'تعذّر تحميل المقالات المحفوظة',
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
    myArticlesFilterUnread: 'غير مقروء ({{count}})',
    myArticlesFilterFinished: 'مكتمل ({{count}})',
    myArticlesFilterEmptyUnread: 'لا توجد مقالات غير مقروءة',
    myArticlesFilterEmptyRead: 'لا توجد مقالات مكتملة بعد',

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
    aboutLink: 'حول',
    contactLink: 'اتصل',

    // Article detail
    article: 'مقال',
    back: 'رجوع',
    loading: 'جاري التحميل…',
    cached: 'مخزن مؤقتاً',
    seed: 'بيانات تجريبية',
    noContentAvailable: 'لا يوجد محتوى متاح',
    openSettings: 'فتح الإعدادات',
    openSourceArticle: 'فتح المقال الأصلي',
    markRead: 'تحديد كمقروء',
    markUnread: 'إلغاء التحديد كمقروء',
    markedReadStatus: 'مقروء',
    saveToMyArticles: 'حفظ في مقالاتي',
    savedToMyArticles: 'محفوظ في مقالاتي',
    removeFromMyArticles: 'إزالة من مقالاتي',
    removedFromMyArticles: 'أُزيل من مقالاتي',
    saveArticleFailed: 'تعذّر حفظ المقال',
    bookmarkSentence: 'وضع إشارة على الجملة',
    removeSentenceBookmark: 'إزالة إشارة الجملة',
    sentenceBookmarkSaved: 'تم حفظ إشارة الجملة',
    sentenceBookmarkRemoved: 'تمت إزالة إشارة الجملة',
    sentenceBookmarkFailed: 'تعذّر تحديث إشارة الجملة',
    aiTranslatedWithDeepseek: 'ترجمة بالذكاء الاصطناعي عبر DeepSeek',

    // Not found
    notFound: 'عذراً! غير موجود',
    goBackHome: 'العودة للرئيسية',

    // Local dict / dictionary
    localDictionary: 'القاموس المحلي',
    localDictionarySettings: 'إعدادات القاموس المحلي',
    downloadLocalDict: 'تحميل القاموس من البعيد',
    resetLocalDict: 'إعادة تعيين القاموس المحلي',
    resetting: 'جاري إعادة التعيين…',
    downloading: 'جاري التنزيل…',
    downloadLocalDictHint:
      'تنزيل قاموس CEDICT من الخادم البعيد وتحميله إلى قاعدة البيانات المحلية. الحجم الإجمالي حوالي 10 ميجابايت.',
    dictEntriesCount: '{{count}} إدخالات في القاموس المحلي',
    randomEntrySample: 'عبارة أو مثل أو 成语',
    showAnotherRandomEntry: 'عرض إدخال عشوائي آخر',
    downloadFailed: 'فشل التنزيل',

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
    loadLocalDictFirstHint: 'يرجى تحميل القاموس المحلي أولاً لرؤية التعريفات هنا',
    setupLocalDict: 'إعداد القاموس المحلي',
    getPleco: 'تنزيل بليكو',
    openPlecoWebsite: 'فتح موقع بليكو',
    wordMissingInLocalDict:
      'الكلمة غير موجودة في القاموس المحلي، جرب بليكو أو أبلغ عن كلمة مفقودة.',
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
    networkUnstableOrOff:
      'اتصالك بالشبكة غير مستقر أو غير متوفر.',
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
    'tabs.articles': '阅读',
    'tabs.create': '创建',
    'tabs.settings': '设置',

    // Articles list (index)
    loadingArticles: '加载文章中…',
    retry: '重试',
    noArticlesYet: '暂无文章',
    addArticlesHint: '在创建标签页粘贴新闻链接添加文章',
    loadMore: '加载更多',

    // Create tab
    parse: '解析',
    myArticles: '我的文章 ({{count}})',
    noArticlesParseFirst: '暂无文章 — 请先解析一篇',
    savedArticlesLoadFailed: '无法加载已保存的文章',
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
    myArticlesFilterUnread: '未读 ({{count}})',
    myArticlesFilterFinished: '已读完 ({{count}})',
    myArticlesFilterEmptyUnread: '没有未读文章',
    myArticlesFilterEmptyRead: '暂无已读完文章',

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
    aboutLink: '关于',
    contactLink: '联系',

    // Article detail
    article: '文章',
    back: '返回',
    loading: '加载中…',
    cached: '已缓存',
    seed: '示例数据',
    noContentAvailable: '暂无内容',
    openSettings: '打开设置',
    openSourceArticle: '打开原文',
    markRead: '标记已读',
    markUnread: '标记未读',
    markedReadStatus: '已读',
    saveToMyArticles: '保存到我的文章',
    savedToMyArticles: '已保存到我的文章',
    removeFromMyArticles: '从我的文章移除',
    removedFromMyArticles: '已从我的文章移除',
    saveArticleFailed: '无法保存文章',
    bookmarkSentence: '收藏该句',
    removeSentenceBookmark: '取消句子收藏',
    sentenceBookmarkSaved: '已收藏该句',
    sentenceBookmarkRemoved: '已取消句子收藏',
    sentenceBookmarkFailed: '无法更新句子收藏',
    aiTranslatedWithDeepseek: '由 DeepSeek AI 翻译',

    // Not found
    notFound: '未找到页面',
    goBackHome: '返回首页',

    // Local dict / dictionary
    localDictionary: '本地词典',
    localDictionarySettings: '本地词典设置',
    downloadLocalDict: '从远程加载词典',
    resetLocalDict: '重置本地词典',
    resetting: '重置中…',
    downloading: '下载中…',
    downloadLocalDictHint: '从远程服务器下载 CEDICT 词典并加载到本地数据库。总大小约 10mb。',
    dictEntriesCount: '本地词典中共 {{count}} 条词条',
    randomEntrySample: '示例：短语、谚语、成语',
    showAnotherRandomEntry: '显示另一条随机词条',
    downloadFailed: '下载失败',

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
    loadLocalDictFirstHint: '请先加载本地词典以查看释义',
    setupLocalDict: '设置本地词典',
    getPleco: '获取 Pleco',
    openPlecoWebsite: '打开 Pleco 官网',
    wordMissingInLocalDict: '该词不在本地词典中，请尝试使用 Pleco 或报告缺失。',
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
    networkUnstableOrOff: '网络连接不稳定或已断开。',
    serverError: '服务器错误，请稍后重试。',
    errorNotFound: '未找到。',
    articleNotFound: '文章未找到',
    failedToLoadArticles: '加载文章失败。',
    failedToRefresh: '刷新失败。',
    failedToLoadMore: '加载更多失败。',
  },
} as const;
