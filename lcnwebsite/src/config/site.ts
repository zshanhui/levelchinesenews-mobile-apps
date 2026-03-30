export const siteConfig = {
  brandName: 'LearnChineseNews',
  contactEmail: 'shanhui.dev@proton.me',
  cta: {
    expoLabel: 'Get on Expo',
    expoUrl: '',
    githubLabel: 'View on GitHub',
    githubUrl: '',
  },
  heroScreens: [
    {
      src: '/screenshots/showcase/reader-screen-01.jpg',
      alt: 'Main article reader screen.',
    },
    {
      src: '/screenshots/showcase/reader-screen-bookmark.jpg',
      alt: 'Bookmarks where you left off reading',
    },
    {
      src: '/screenshots/showcase/my-articles-saved.jpg',
      alt: 'Saved articles to read later',
    },
    {
      src: '/screenshots/showcase/local-dict-settings.jpg',
      alt: 'Offline local dictionary with 115,000 words from CE-DICT',
    },
    {
      src: '/screenshots/showcase/native-languages.jpg',
      alt: 'Supports 5 native languages with translation support, more to be added',
    },
    {
      src: '/screenshots/showcase/parse-articles-01.jpg',
      alt: 'Parse news articles you are interested in reading',
    },
    {
      src: '/screenshots/showcase/read-articles-list.jpg',
      alt: 'Always fresh news article content, added daily',
    },
    // {
    //   src: '/screenshots/showcase/reader-screen-03.jpg',
    //   alt: 'Bookmark the exact location where you left off',
    // },
  ],
} as const;
