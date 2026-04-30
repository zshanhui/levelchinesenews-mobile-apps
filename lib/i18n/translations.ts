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
    articleFeedNotSupportedOnWeb:
      'The article feed is not available in the web app. Use the iOS or Android app to browse news articles.',
    retry: 'Retry',
    noArticlesYet: 'no articles yet',
    addArticlesHint: 'add articles from the create tab by pasting a news url',
    loadMore: 'Load more',
    articleSortBy: 'Sort by',
    articleSortPublishedDate: 'published date',
    articleSortAddedDate: 'created date',
    articleFilterByTopics: 'Filter by topics',
    articleTopicsComingSoon: 'coming soon...',

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
    parseNotSupportedOnWeb:
      'Parsing article URLs is not available in the web app. Use the iOS or Android app to fetch articles from a link.',
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
    localDatabaseNotSupportedOnWeb:
      'The local dictionary and other offline database features are not available in the web reader. Download the Android app to use the full features',
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
    appNativePlatformsOnly:
      'This app is only available on iOS and Android.',
    readOriginalArticleCta:
      'We recommend you read and support the original article from {{mediaSource}} as your Chinese improves.',
    originalArticleSourceFallback: 'the publisher',
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
    langIndonesian: '🇮🇩 Bahasa Indonesia',
    langVietnamese: '🇻🇳 Tiếng Việt',
    langRussian: '🇷🇺 Russian',
    langArabic: '🇪🇬 العربية',
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
    articleFeedNotSupportedOnWeb:
      'El feed de artículos no está disponible en la web. Usa la app de iOS o Android para leer noticias.',
    retry: 'Reintentar',
    noArticlesYet: 'aún no hay artículos',
    addArticlesHint:
      'añade artículos desde la pestaña crear pegando una url de noticias',
    loadMore: 'Cargar más',
    articleSortBy: 'Ordenar por',
    articleSortPublishedDate: 'fecha de publicación',
    articleSortAddedDate: 'fecha de creación',
    articleFilterByTopics: 'Filtrar por temas',
    articleTopicsComingSoon: 'próximamente…',

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
    parseNotSupportedOnWeb:
      'Analizar URLs de artículos no está disponible en la web. Usa la app de iOS o Android para obtener artículos desde un enlace.',
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
    localDatabaseNotSupportedOnWeb:
      'El diccionario local y otras funciones de base de datos sin conexión no están disponibles en el lector web. Descarga la app de Android para usar todas las funciones.',
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
    appNativePlatformsOnly:
      'Esta aplicación solo está disponible en iOS y Android.',
    readOriginalArticleCta:
      'Te recomendamos leer y apoyar el artículo original de {{mediaSource}} a medida que mejore tu chino.',
    originalArticleSourceFallback: 'la fuente',
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
    langIndonesian: '🇮🇩 Indonesio',
    langVietnamese: '🇻🇳 Vietnamita',
    langRussian: '🇷🇺 Ruso',
    langArabic: '🇪🇬 العربية',
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
    articleFeedNotSupportedOnWeb:
      'Suapan artikel tidak tersedia dalam app web. Gunakan app iOS atau Android untuk membaca berita.',
    retry: 'Cuba semula',
    noArticlesYet: 'belum ada artikel',
    addArticlesHint:
      'tambah artikel daripada tab cipta dengan menampal url berita',
    loadMore: 'Muat lagi',
    articleSortBy: 'Susun mengikut',
    articleSortPublishedDate: 'tarikh terbit',
    articleSortAddedDate: 'tarikh dicipta',
    articleFilterByTopics: 'Tapis mengikut topik',
    articleTopicsComingSoon: 'akan datang…',

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
    parseNotSupportedOnWeb:
      'Hurai URL artikel tidak tersedia dalam app web. Gunakan app iOS atau Android untuk mengambil artikel daripada pautan.',
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
    localDatabaseNotSupportedOnWeb:
      'Kamus tempatan dan ciri pangkalan data luar talian lain tidak tersedia dalam pembaca web. Muat turun app Android untuk ciri penuh.',
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
    appNativePlatformsOnly:
      'Apl ini hanya tersedia di iOS dan Android.',
    readOriginalArticleCta:
      'Kami mengesyorkan anda membaca dan menyokong artikel asal daripada {{mediaSource}} apabila tahap bahasa Cina anda bertambah baik.',
    originalArticleSourceFallback: 'the publisher',
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
    langIndonesian: '🇮🇩 Bahasa Indonesia',
    langVietnamese: '🇻🇳 Tiếng Việt',
    langRussian: '🇷🇺 Bahasa Rusia',
    langArabic: '🇪🇬 العربية',
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
  id: {
    // Brand & tabs
    brand: 'LevelChineseNews',
    'tabs.articles': 'Baca',
    'tabs.create': 'Buat',
    'tabs.settings': 'Pengaturan',

    // Articles list (index)
    loadingArticles: 'Memuat artikel…',
    articleFeedNotSupportedOnWeb:
      'Umpan artikel tidak tersedia di aplikasi web. Gunakan aplikasi iOS atau Android untuk membaca berita.',
    retry: 'Coba lagi',
    noArticlesYet: 'belum ada artikel',
    addArticlesHint:
      'tambahkan artikel dari tab buat dengan menempelkan URL berita',
    loadMore: 'Muat lebih banyak',
    articleSortBy: 'Urutkan berdasarkan',
    articleSortPublishedDate: 'tanggal terbit',
    articleSortAddedDate: 'tanggal dibuat',
    articleFilterByTopics: 'Filter berdasarkan topik',
    articleTopicsComingSoon: 'segera hadir…',

    // Create tab
    parse: 'urai',
    myArticles: 'artikel saya ({{count}})',
    noArticlesParseFirst: 'belum ada artikel — urai satu terlebih dahulu',
    savedArticlesLoadFailed: 'tidak dapat memuat artikel tersimpan',
    fetching: 'mengambil…',
    indexing: 'mengindeks…',
    articleSaved: 'artikel disimpan',
    newArticleCreated: 'artikel baru dibuat',
    articleAlreadyCreated:
      'Artikel ini sudah dibuat — tidak perlu diambil lagi',
    fetchAnotherArticle: 'ambil artikel lain',
    enterUrl: 'Masukkan URL yang didukung untuk mengambil artikel',
    urlPlaceholder: 'https://zaobao.com/...',
    dailyLimitReached: 'batas harian tercapai — kembali besok',
    parsesRemaining: '{{remaining}} dari {{max}} penguraian tersisa hari ini',
    supportedSites: 'situs yang didukung',
    parseArticleUrl: 'Urai URL artikel',
    parseNotSupportedOnWeb:
      'Mengurai URL artikel tidak tersedia di aplikasi web. Gunakan aplikasi iOS atau Android untuk mengambil artikel dari tautan.',
    myArticlesFilterUnread: 'belum dibaca ({{count}})',
    myArticlesFilterFinished: 'selesai ({{count}})',
    myArticlesFilterEmptyUnread: 'tidak ada artikel yang belum dibaca',
    myArticlesFilterEmptyRead: 'belum ada artikel yang selesai',

    // Settings
    settings: 'pengaturan',
    configurePreferences: 'bahasa dan preferensi umum',
    darkMode: 'mode gelap (cyberpunk)',
    configureLocalDict: 'konfigurasi kamus lokal',
    downloadAndReset: 'unduh dan reset',
    localDatabaseNotSupportedOnWeb:
      'Kamus lokal dan fitur database offline lainnya tidak tersedia di pembaca web. Unduh aplikasi Android untuk fitur lengkap.',
    readerPreferences: 'preferensi pembaca',
    useNotoSansSc: 'gunakan Noto Sans SC untuk bahasa Tionghoa',
    showPinyin: 'tampilkan pinyin dalam artikel',
    adjustLineSpacing: 'sesuaikan jarak baris di konten artikel',
    lineSpacingCompact: 'rapat',
    lineSpacingNormal: 'normal',
    lineSpacingRelaxed: 'longgar',
    lineSpacingNumbersCompact: '0px, 8px',
    lineSpacingNumbersNormal: '6px, 24px',
    lineSpacingNumbersRelaxed: '14px, 40px',
    adjustFontSize: 'sesuaikan ukuran font artikel',
    debugEnvVars: 'Debug – variabel lingkungan',
    aboutLink: 'Tentang',
    contactLink: 'Kontak',

    // Article detail
    article: 'artikel',
    back: 'kembali',
    loading: 'memuat…',
    cached: 'tersimpan dalam cache',
    seed: 'data contoh',
    noContentAvailable: 'tidak ada konten',
    openSettings: 'Buka pengaturan',
    openSourceArticle: 'buka artikel sumber',
    markRead: 'tandai sudah dibaca',
    appNativePlatformsOnly:
      'Aplikasi ini hanya tersedia di iOS dan Android.',
    readOriginalArticleCta:
      'Kami menyarankan Anda membaca dan mendukung artikel asli dari {{mediaSource}} seiring kemajuan bahasa Mandarin Anda.',
    originalArticleSourceFallback: 'the publisher',
    markUnread: 'tandai belum dibaca',
    markedReadStatus: 'ditandai sudah dibaca',
    saveToMyArticles: 'Simpan ke artikel saya',
    savedToMyArticles: 'Disimpan ke artikel saya',
    removeFromMyArticles: 'Hapus dari artikel saya',
    removedFromMyArticles: 'Dihapus dari artikel saya',
    saveArticleFailed: 'Tidak dapat menyimpan artikel',
    bookmarkSentence: 'Tandai kalimat',
    removeSentenceBookmark: 'Hapus penanda kalimat',
    sentenceBookmarkSaved: 'Kalimat ditandai',
    sentenceBookmarkRemoved: 'Penanda kalimat dihapus',
    sentenceBookmarkFailed: 'Tidak dapat memperbarui penanda kalimat',
    aiTranslatedWithDeepseek: 'Diterjemahkan AI dengan DeepSeek',

    // Not found
    notFound: 'ups! tidak ditemukan',
    goBackHome: 'kembali ke beranda',

    // Local dict / dictionary
    localDictionary: 'kamus lokal',
    localDictionarySettings: 'pengaturan kamus lokal',
    downloadLocalDict: 'Muat kamus dari server',
    resetLocalDict: 'Reset kamus lokal',
    resetting: 'Mereset…',
    downloading: 'Mengunduh…',
    downloadLocalDictHint:
      'Unduh kamus CEDICT dari server jarak jauh dan muat ke basis data lokal Anda. Ukuran total sekitar 10 MB.',
    dictEntriesCount: '{{count}} entri dalam kamus lokal',
    randomEntrySample: 'contoh frasa, peribahasa, 成语',
    showAnotherRandomEntry: 'Tampilkan entri acak lainnya',
    downloadFailed: 'Gagal mengunduh',

    // Article card (translation)
    translationFailed: 'Terjemahan gagal',
    couldNotGenerateTranslation:
      'Tidak dapat membuat terjemahan. Silakan coba lagi.',
    generatingTranslation: 'Membuat terjemahan…',
    showChineseTitle: 'Tampilkan judul bahasa Tionghoa',
    showEnglishTranslation: 'Tampilkan terjemahan bahasa Inggris',
    requestTranslation: 'Minta terjemahan',
    openArticle: 'buka artikel: {{title}}',

    // Native language selector
    nativeLanguage: 'bahasa ibu',
    nativeLanguageHint:
      'Bahasa ibu Anda dipakai untuk terjemahan dan petunjuk bermanfaat lainnya.',
    selectNativeLanguage: 'pilih bahasa ibu',
    select: 'Pilih',
    langEnglish: '🇺🇸 English',
    langSpanish: '🇪🇸 Español',
    langMalay: '🇲🇾 Bahasa Melayu',
    langIndonesian: '🇮🇩 Bahasa Indonesia',
    langVietnamese: '🇻🇳 Tiếng Việt',
    langRussian: '🇷🇺 Rusia',
    langArabic: '🇪🇬 العربية',
    langChinese: '🇨🇳 简体中文 (only UI)',

    // Article content
    nativeLanguageDefinitionPlaceholder:
      'definisi dalam bahasa ibu akan muncul di sini..',
    loadLocalDictFirstHint:
      'muat kamus lokal terlebih dahulu untuk melihat definisi di sini',
    setupLocalDict: 'atur kamus lokal',
    getPleco: 'Dapatkan Pleco',
    openPlecoWebsite: 'Buka situs web Pleco',
    wordMissingInLocalDict:
      'Kata tidak ada dalam kamus lokal—coba Pleco atau laporkan kata yang hilang.',
    openInPleco: 'Buka di kamus Pleco',
    pleco: 'Pleco',
    plecoSource: 'Level Chinese News',

    // Cache / seed indicators
    cachedLabel: 'Cache {{label}}',
    seedData: 'Data contoh',

    // Errors (api / useArticles)
    somethingWentWrong: 'Terjadi kesalahan. Silakan coba lagi.',
    requestTimedOut: 'Permintaan habis waktu. Silakan coba lagi.',
    unableToConnect:
      'Tidak dapat terhubung. Periksa koneksi internet Anda.',
    networkUnstableOrOff:
      'Koneksi jaringan Anda tidak stabil atau terputus.',
    serverError: 'Kesalahan server. Silakan coba lagi nanti.',
    errorNotFound: 'Tidak ditemukan.',
    articleNotFound: 'Artikel tidak ditemukan',
    failedToLoadArticles: 'Gagal memuat artikel.',
    failedToRefresh: 'Gagal memperbarui.',
    failedToLoadMore: 'Gagal memuat lebih banyak.',
  },
  vi: {
    // Brand & tabs
    brand: 'LevelChineseNews',
    'tabs.articles': 'Đọc',
    'tabs.create': 'Tạo',
    'tabs.settings': 'Cài đặt',

    // Articles list (index)
    loadingArticles: 'Đang tải bài viết…',
    articleFeedNotSupportedOnWeb:
      'Bản web không có bảng tin bài viết. Hãy dùng ứng dụng iOS hoặc Android để đọc tin.',
    retry: 'Thử lại',
    noArticlesYet: 'chưa có bài viết',
    addArticlesHint:
      'thêm bài từ tab Tạo bằng cách dán URL tin tức',
    loadMore: 'Tải thêm',
    articleSortBy: 'Sắp xếp theo',
    articleSortPublishedDate: 'ngày xuất bản',
    articleSortAddedDate: 'ngày tạo',
    articleFilterByTopics: 'Lọc theo chủ đề',
    articleTopicsComingSoon: 'sắp ra mắt…',

    // Create tab
    parse: 'phân tích',
    myArticles: 'bài viết của tôi ({{count}})',
    noArticlesParseFirst: 'chưa có bài viết — hãy phân tích một bài trước',
    savedArticlesLoadFailed: 'không tải được bài viết đã lưu',
    fetching: 'đang lấy…',
    indexing: 'đang lập chỉ mục…',
    articleSaved: 'đã lưu bài viết',
    newArticleCreated: 'đã tạo bài viết mới',
    articleAlreadyCreated:
      'Bài viết này đã được tạo — không cần tải lại',
    fetchAnotherArticle: 'lấy bài viết khác',
    enterUrl: 'Nhập URL được hỗ trợ để lấy bài viết',
    urlPlaceholder: 'https://zaobao.com/...',
    dailyLimitReached: 'đã hết hạn mức trong ngày — quay lại vào ngày mai',
    parsesRemaining: 'hôm nay còn {{remaining}}/{{max}} lần phân tích',
    supportedSites: 'trang được hỗ trợ',
    parseArticleUrl: 'Phân tích URL bài viết',
    parseNotSupportedOnWeb:
      'Phân tích URL bài viết không có trên bản web. Hãy dùng ứng dụng iOS hoặc Android để tải bài từ liên kết.',
    myArticlesFilterUnread: 'chưa đọc ({{count}})',
    myArticlesFilterFinished: 'đã đọc xong ({{count}})',
    myArticlesFilterEmptyUnread: 'không có bài chưa đọc',
    myArticlesFilterEmptyRead: 'chưa có bài đã đọc xong',

    // Settings
    settings: 'cài đặt',
    configurePreferences: 'ngôn ngữ và tùy chọn chung',
    darkMode: 'chế độ tối (cyberpunk)',
    configureLocalDict: 'cấu hình từ điển cục bộ',
    downloadAndReset: 'tải xuống và đặt lại',
    localDatabaseNotSupportedOnWeb:
      'Từ điển cục bộ và các tính năng cơ sở dữ liệu ngoại tuyến khác không có trên trình đọc web. Tải ứng dụng Android để dùng đầy đủ tính năng.',
    readerPreferences: 'tùy chọn đọc',
    useNotoSansSc: 'dùng Noto Sans SC cho chữ Hán',
    showPinyin: 'hiện phiên âm trong bài viết',
    adjustLineSpacing: 'căn chỉnh khoảng cách dòng trong nội dung',
    lineSpacingCompact: 'chật',
    lineSpacingNormal: 'bình thường',
    lineSpacingRelaxed: 'thoáng',
    lineSpacingNumbersCompact: '0px, 8px',
    lineSpacingNumbersNormal: '6px, 24px',
    lineSpacingNumbersRelaxed: '14px, 40px',
    adjustFontSize: 'cỡ chữ trong bài viết',
    debugEnvVars: 'Gỡ lỗi – biến môi trường',
    aboutLink: 'Giới thiệu',
    contactLink: 'Liên hệ',

    // Article detail
    article: 'bài viết',
    back: 'quay lại',
    loading: 'đang tải…',
    cached: 'đã lưu cache',
    seed: 'dữ liệu mẫu',
    noContentAvailable: 'không có nội dung',
    openSettings: 'Mở cài đặt',
    openSourceArticle: 'mở bài viết gốc',
    markRead: 'đánh dấu đã đọc',
    appNativePlatformsOnly:
      'Ứng dụng này chỉ có trên iOS và Android.',
    readOriginalArticleCta:
      'Chúng tôi khuyên bạn đọc và ủng hộ bài viết gốc từ {{mediaSource}} khi tiếng Trung của bạn tiến bộ.',
    originalArticleSourceFallback: 'the publisher',
    markUnread: 'đánh dấu chưa đọc',
    markedReadStatus: 'đã đánh dấu đã đọc',
    saveToMyArticles: 'Lưu vào bài viết của tôi',
    savedToMyArticles: 'Đã lưu vào bài viết của tôi',
    removeFromMyArticles: 'Gỡ khỏi bài viết của tôi',
    removedFromMyArticles: 'Đã gỡ khỏi bài viết của tôi',
    saveArticleFailed: 'Không lưu được bài viết',
    bookmarkSentence: 'Đánh dấu câu này',
    removeSentenceBookmark: 'Bỏ đánh dấu câu này',
    sentenceBookmarkSaved: 'Đã lưu đánh dấu câu',
    sentenceBookmarkRemoved: 'Đã bỏ đánh dấu câu',
    sentenceBookmarkFailed: 'Không cập nhật được đánh dấu câu',
    aiTranslatedWithDeepseek: 'Bản dịch AI bằng DeepSeek',

    // Not found
    notFound: 'Ôi! Không thấy trang',
    goBackHome: 'về trang chủ',

    // Local dict / dictionary
    localDictionary: 'từ điển cục bộ',
    localDictionarySettings: 'cài đặt từ điển cục bộ',
    downloadLocalDict: 'Tải từ điển từ máy chủ',
    resetLocalDict: 'Đặt lại từ điển cục bộ',
    resetting: 'Đang đặt lại…',
    downloading: 'Đang tải…',
    downloadLocalDictHint:
      'Tải bộ từ điển CEDICT từ máy chủ xa về cơ sở dữ liệu cục bộ. Dung lượng khoảng 10 MB.',
    dictEntriesCount: '{{count}} mục trong từ điển cục bộ',
    randomEntrySample: 'ví dụ: cụm, tục ngữ, 成语',
    showAnotherRandomEntry: 'Hiện mục ngẫu nhiên khác',
    downloadFailed: 'Tải thất bại',

    // Article card (translation)
    translationFailed: 'Dịch thất bại',
    couldNotGenerateTranslation:
      'Không tạo được bản dịch. Vui lòng thử lại.',
    generatingTranslation: 'Đang tạo bản dịch…',
    showChineseTitle: 'Hiện tiêu đề tiếng Trung',
    showEnglishTranslation: 'Hiện bản dịch tiếng Anh',
    requestTranslation: 'Yêu cầu dịch',
    openArticle: 'mở bài viết: {{title}}',

    // Native language selector
    nativeLanguage: 'ngôn ngữ mẹ đẻ',
    nativeLanguageHint:
      'Ngôn ngữ mẹ đẻ dùng để hiển thị bản dịch và gợi ý hữu ích khác.',
    selectNativeLanguage: 'chọn ngôn ngữ mẹ đẻ',
    select: 'Chọn',
    langEnglish: '🇺🇸 English',
    langSpanish: '🇪🇸 Español',
    langMalay: '🇲🇾 Bahasa Melayu',
    langIndonesian: '🇮🇩 Bahasa Indonesia',
    langVietnamese: '🇻🇳 Tiếng Việt',
    langRussian: '🇷🇺 Tiếng Nga',
    langArabic: '🇪🇬 العربية',
    langChinese: '🇨🇳 简体中文 (only UI)',

    // Article content
    nativeLanguageDefinitionPlaceholder:
      'định nghĩa bằng ngôn ngữ của bạn sẽ hiện tại đây..',
    loadLocalDictFirstHint:
      'hãy tải từ điển cục bộ trước để xem nghĩa tại đây',
    setupLocalDict: 'thiết lập từ điển cục bộ',
    getPleco: 'Tải Pleco',
    openPlecoWebsite: 'Mở trang web Pleco',
    wordMissingInLocalDict:
      'Từ không có trong từ điển cục bộ — thử Pleco hoặc báo thiếu.',
    openInPleco: 'Mở trong từ điển Pleco',
    pleco: 'Pleco',
    plecoSource: 'Level Chinese News',

    // Cache / seed indicators
    cachedLabel: 'Đã cache {{label}}',
    seedData: 'Dữ liệu mẫu',

    // Errors (api / useArticles)
    somethingWentWrong: 'Đã có lỗi. Vui lòng thử lại.',
    requestTimedOut: 'Hết thời gian chờ. Vui lòng thử lại.',
    unableToConnect:
      'Không kết nối được. Kiểm tra mạng.',
    networkUnstableOrOff:
      'Kết nối mạng không ổn định hoặc đã tắt.',
    serverError: 'Lỗi máy chủ. Vui lòng thử sau.',
    errorNotFound: 'Không tìm thấy.',
    articleNotFound: 'Không thấy bài viết',
    failedToLoadArticles: 'Không tải được danh sách bài.',
    failedToRefresh: 'Không làm mới được.',
    failedToLoadMore: 'Không tải thêm được.',
  },
  ru: {
    // Brand & tabs
    brand: 'LevelChineseNews',
    'tabs.articles': 'Чтение',
    'tabs.create': 'Создание',
    'tabs.settings': 'Настройки',

    // Articles list (index)
    loadingArticles: 'Загрузка статей…',
    articleFeedNotSupportedOnWeb:
      'Лента статей недоступна в веб-приложении. Используйте приложение для iOS или Android.',
    retry: 'Повторить',
    noArticlesYet: 'пока нет статей',
    addArticlesHint:
      'добавьте статьи на вкладке «Создание», вставив URL новости',
    loadMore: 'Загрузить ещё',
    articleSortBy: 'Сортировать по',
    articleSortPublishedDate: 'дата публикации',
    articleSortAddedDate: 'дата создания',
    articleFilterByTopics: 'Фильтр по темам',
    articleTopicsComingSoon: 'скоро…',

    // Create tab
    parse: 'разобрать',
    myArticles: 'мои статьи ({{count}})',
    noArticlesParseFirst: 'пока нет статей — сначала разберите одну',
    savedArticlesLoadFailed: 'не удалось загрузить сохранённые статьи',
    fetching: 'получение…',
    indexing: 'индексация…',
    articleSaved: 'статья сохранена',
    newArticleCreated: 'создана новая статья',
    articleAlreadyCreated:
      'Эта статья уже создана — повторно загружать не нужно',
    fetchAnotherArticle: 'загрузить другую статью',
    enterUrl: 'Введите поддерживаемый URL, чтобы загрузить статью',
    urlPlaceholder: 'https://zaobao.com/...',
    dailyLimitReached: 'дневной лимит исчерпан — зайдите завтра',
    parsesRemaining: 'сегодня осталось {{remaining}} из {{max}} разборов',
    supportedSites: 'поддерживаемые сайты',
    parseArticleUrl: 'Разобрать URL статьи',
    parseNotSupportedOnWeb:
      'Разбор URL статей недоступен в веб-приложении. Используйте приложение для iOS или Android.',
    myArticlesFilterUnread: 'непрочитанные ({{count}})',
    myArticlesFilterFinished: 'прочитанные ({{count}})',
    myArticlesFilterEmptyUnread: 'нет непрочитанных статей',
    myArticlesFilterEmptyRead: 'пока нет прочитанных статей',

    // Settings
    settings: 'настройки',
    configurePreferences: 'язык и общие параметры',
    darkMode: 'тёмная тема (киберпанк)',
    configureLocalDict: 'настроить локальный словарь',
    downloadAndReset: 'скачать и сбросить',
    localDatabaseNotSupportedOnWeb:
      'Локальный словарь и другие функции офлайн-базы данных недоступны в веб-читалке. Скачайте приложение для Android, чтобы пользоваться всеми функциями.',
    readerPreferences: 'настройки чтения',
    useNotoSansSc: 'использовать Noto Sans SC для китайского текста',
    showPinyin: 'показывать пиньинь в статьях',
    adjustLineSpacing: 'межстрочный интервал в тексте статьи',
    lineSpacingCompact: 'плотный',
    lineSpacingNormal: 'обычный',
    lineSpacingRelaxed: 'свободный',
    lineSpacingNumbersCompact: '0px, 8px',
    lineSpacingNumbersNormal: '6px, 24px',
    lineSpacingNumbersRelaxed: '14px, 40px',
    adjustFontSize: 'размер шрифта статьи',
    debugEnvVars: 'Отладка – переменные среды',
    aboutLink: 'О приложении',
    contactLink: 'Контакты',

    // Article detail
    article: 'статья',
    back: 'назад',
    loading: 'загрузка…',
    cached: 'кэш',
    seed: 'демо-данные',
    noContentAvailable: 'нет содержимого',
    openSettings: 'Открыть настройки',
    openSourceArticle: 'открыть исходную статью',
    markRead: 'пометить прочитанным',
    appNativePlatformsOnly:
      'Это приложение доступно только на iOS и Android.',
    readOriginalArticleCta:
      'Рекомендуем читать оригинальную статью на {{mediaSource}} и поддерживать издание по мере роста вашего китайского.',
    originalArticleSourceFallback: 'the publisher',
    markUnread: 'пометить непрочитанным',
    markedReadStatus: 'отмечено прочитанным',
    saveToMyArticles: 'Сохранить в мои статьи',
    savedToMyArticles: 'Сохранено в мои статьи',
    removeFromMyArticles: 'Удалить из моих статей',
    removedFromMyArticles: 'Удалено из моих статей',
    saveArticleFailed: 'Не удалось сохранить статью',
    bookmarkSentence: 'Закладка на предложение',
    removeSentenceBookmark: 'Убрать закладку',
    sentenceBookmarkSaved: 'Закладка сохранена',
    sentenceBookmarkRemoved: 'Закладка удалена',
    sentenceBookmarkFailed: 'Не удалось обновить закладку',
    aiTranslatedWithDeepseek: 'Перевод ИИ (DeepSeek)',

    // Not found
    notFound: 'ой! страница не найдена',
    goBackHome: 'на главную',

    // Local dict / dictionary
    localDictionary: 'локальный словарь',
    localDictionarySettings: 'настройки локального словаря',
    downloadLocalDict: 'Загрузить словарь с сервера',
    resetLocalDict: 'Сбросить локальный словарь',
    resetting: 'Сброс…',
    downloading: 'Загрузка…',
    downloadLocalDictHint:
      'Скачайте словарь CEDICT с удалённого сервера и загрузите его в локальную базу. Размер около 10 МБ.',
    dictEntriesCount: 'записей в локальном словаре: {{count}}',
    randomEntrySample: 'пример: фраза, пословица, 成语',
    showAnotherRandomEntry: 'Показать другую случайную запись',
    downloadFailed: 'Ошибка загрузки',

    // Article card (translation)
    translationFailed: 'Ошибка перевода',
    couldNotGenerateTranslation:
      'Не удалось создать перевод. Попробуйте ещё раз.',
    generatingTranslation: 'Создание перевода…',
    showChineseTitle: 'Показать заголовок на китайском',
    showEnglishTranslation: 'Показать перевод на английском',
    requestTranslation: 'Запросить перевод',
    openArticle: 'открыть статью: {{title}}',

    // Native language selector
    nativeLanguage: 'родной язык',
    nativeLanguageHint:
      'Родной язык используется для переводов и подсказок.',
    selectNativeLanguage: 'выберите родной язык',
    select: 'Выбрать',
    langEnglish: '🇺🇸 English',
    langSpanish: '🇪🇸 Español',
    langMalay: '🇲🇾 Bahasa Melayu',
    langIndonesian: '🇮🇩 Bahasa Indonesia',
    langVietnamese: '🇻🇳 Tiếng Việt',
    langRussian: '🇷🇺 Русский',
    langArabic: '🇪🇬 العربية',
    langChinese: '🇨🇳 简体中文 (only UI)',

    // Article content
    nativeLanguageDefinitionPlaceholder:
      'здесь будет определение на вашем языке..',
    loadLocalDictFirstHint:
      'сначала загрузите локальный словарь, чтобы видеть определения',
    setupLocalDict: 'настроить локальный словарь',
    getPleco: 'Скачать Pleco',
    openPlecoWebsite: 'Сайт Pleco',
    wordMissingInLocalDict:
      'Слова нет в локальном словаре — попробуйте Pleco или сообщите об отсутствии.',
    openInPleco: 'Открыть в словаре Pleco',
    pleco: 'Pleco',
    plecoSource: 'Level Chinese News',

    // Cache / seed indicators
    cachedLabel: 'Кэш: {{label}}',
    seedData: 'Демо-данные',

    // Errors (api / useArticles)
    somethingWentWrong: 'Что-то пошло не так. Попробуйте ещё раз.',
    requestTimedOut: 'Время запроса истекло. Попробуйте ещё раз.',
    unableToConnect:
      'Нет подключения. Проверьте интернет.',
    networkUnstableOrOff:
      'Соединение нестабильно или отсутствует.',
    serverError: 'Ошибка сервера. Попробуйте позже.',
    errorNotFound: 'Не найдено.',
    articleNotFound: 'Статья не найдена',
    failedToLoadArticles: 'Не удалось загрузить статьи.',
    failedToRefresh: 'Не удалось обновить.',
    failedToLoadMore: 'Не удалось загрузить ещё.',
  },
  ar: {
    // Brand & tabs
    brand: 'LevelChineseNews',
    'tabs.articles': 'قراءة',
    'tabs.create': 'إنشاء',
    'tabs.settings': 'الإعدادات',

    // Articles list (index)
    loadingArticles: 'جاري تحميل المقالات…',
    articleFeedNotSupportedOnWeb:
      'موجز المقالات غير متاح في تطبيق الويب. استخدم تطبيق iOS أو Android لقراءة الأخبار.',
    retry: 'إعادة المحاولة',
    noArticlesYet: 'لا توجد مقالات بعد',
    addArticlesHint:
      'أضف مقالات من تبويب إنشاء عن طريق لصق رابط خبر',
    loadMore: 'تحميل المزيد',
    articleSortBy: 'ترتيب حسب',
    articleSortPublishedDate: 'تاريخ النشر',
    articleSortAddedDate: 'تاريخ الإنشاء',
    articleFilterByTopics: 'تصفية حسب المواضيع',
    articleTopicsComingSoon: 'قريباً…',

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
    parseNotSupportedOnWeb:
      'تحليل روابط المقالات غير متاح في تطبيق الويب. استخدم تطبيق iOS أو Android لجلب المقالات من الرابط.',
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
    localDatabaseNotSupportedOnWeb:
      'القاموس المحلي وميزات قاعدة البيانات دون الاتصال غير متوفرة في قارئ الويب. نزّل تطبيق أندرويد لاستخدام جميع الميزات.',
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
    appNativePlatformsOnly:
      'هذا التطبيق متاح فقط على نظامي iOS وAndroid.',
    readOriginalArticleCta:
      'ننصحك بقراءة المقال الأصلي من {{mediaSource}} ودعمه مع تحسّن مستواك في اللغة الصينية.',
    originalArticleSourceFallback: 'الناشر',
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
    langIndonesian: '🇮🇩 الإندونيسية',
    langVietnamese: '🇻🇳 الفيتنامية',
    langRussian: '🇷🇺 الروسية',
    langArabic: '🇪🇬 العربية',
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
    articleFeedNotSupportedOnWeb:
      '网页版不提供文章资讯流。请使用 iOS 或 Android 应用浏览新闻文章。',
    retry: '重试',
    noArticlesYet: '暂无文章',
    addArticlesHint: '在创建标签页粘贴新闻链接添加文章',
    loadMore: '加载更多',
    articleSortBy: '排序方式',
    articleSortPublishedDate: '发布日期',
    articleSortAddedDate: '创建日期',
    articleFilterByTopics: '按主题筛选',
    articleTopicsComingSoon: '即将推出…',

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
    parseNotSupportedOnWeb:
      '网页版不支持从链接解析文章。请使用 iOS 或 Android 应用从链接抓取文章。',
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
    localDatabaseNotSupportedOnWeb:
      '网页阅读器不支持本地词典及其他离线数据库功能。请下载 Android 应用以使用完整功能。',
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
    appNativePlatformsOnly: '本应用仅提供 iOS 与 Android 版本。',
    readOriginalArticleCta:
      '随着中文水平的提高，我们建议您阅读并支持 {{mediaSource}} 的原文。',
    originalArticleSourceFallback: '出版方',
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
    langIndonesian: '🇮🇩 印尼语',
    langVietnamese: '🇻🇳 越南语',
    langRussian: '🇷🇺 俄语',
    langArabic: '🇪🇬 العربية',
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
