export const siteConfig = {
  brandName: 'LevelChinese',
  contactEmail: 'contact@levelchinese.app',
  cta: {
    expoLabel: 'Download Android v0.7.6 apk',
    expoUrl: 'https://expo.dev/artifacts/eas/DdpNswTXyOOo2bYRtR4DMiG5U-YSGqJkES6ykV_Kr-w.apk',
    githubLabel: 'View on GitHub',
    githubUrl: 'https://github.com/zshanhui/levelchinesenews-mobile-apps',
  },
  heroScreens: [
    {
      src: '/screenshots/showcase/reader-screen-01.jpg',
      alt: 'Read articles with pinyin and popup dictionary',
    },
    {
      src: '/screenshots/showcase/articlecontent-header.jpg',
      alt: 'Read articles with pinyin support, turn off when not needed',
    },
    {
      src: '/screenshots/showcase/article-reader-translation-02.jpg',
      alt: 'Translate any Chinese sentence with a single tap'
    },
    {
      src: '/screenshots/showcase/article-reader-bookmark-saved.jpg',
      alt: 'Bookmark exactly where you left off reading, come back later',
    },
    {
      src: '/screenshots/showcase/myarticles-chinese-title.jpg',
      alt: 'Saved articles to read later',
    },
    {
      src: "/screenshots/showcase/lcn-example-sentences-search.jpg",
      alt: "Search example sentences for Chinese words you want to learn",
    },
    // {
    //   src: '/screenshots/showcase/settings-screen-01.jpg',
    //   alt: 'Adjust text size, spacing, and native language on settings screen'
    // },
    {
      src: '/screenshots/showcase/local-dict-settings.jpg',
      alt: 'Offline local dictionary with 115,000 words from CE-DICT',
    },
    // {
    //   src: '/screenshots/showcase/settings-native-languages-v061.jpg',
    //   alt: 'Supports 8+ native languages with translation support, more to be added',
    // },
    // {
    //   src: '/screenshots/showcase/article-parse-created-01.jpg',
    //   alt: 'Parse news articles you are interested in reading',
    // },
    {
      src: '/screenshots/showcase/articles-list-01.jpg',
      alt: 'Always fresh news article content, added daily',
    },
    {
      src: '/screenshots/showcase/myarticles-summary-open.jpg',
      alt: 'Know what to read with English title and summaries for every article'
    },
    {
      src: '/screenshots/showcase/filters-tags.jpg',
      alt: 'search news articles by topics'
    }
    // {
    //   src: '/screenshots/showcase/reader-screen-03.jpg',
    //   alt: 'Bookmark the exact location where you left off',
    // },
  ],
} as const;
