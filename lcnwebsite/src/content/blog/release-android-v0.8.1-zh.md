---
title: "LevelChinese News v0.8.1 现已登陆 Android"
description: "Android v0.8.1：生词本与已学词、按 HSK 隐藏拼音、全新筛选，还有更多改进。"
pubDate: 2026-09-06
draft: false
---

我们很高兴地发布 [v0.8.1 for Android](https://apk-download.levelchinese.app/v0.8.1-build-1788709444419.apk)。这是一次重大更新，为中级中文学习者带来了许多改进。

最重要的新功能是**生词本与已学词**。点击任意词语即可加入你的学习列表。当你复习过几次、确信自己已经掌握这个词后，可以把它移入已学列表。已学词默认不再显示拼音，也不会弹出词典释义——双击词语仍可打开词典弹窗。随着你学会的词越来越多，阅读水平不断提升，文章会越来越接近母语文章的效果。我们的理念是：通过阅读真实内容来学词，而不是靠单词卡片或生造的例句。

这个功能与例句搜索配合使用效果尤其好。在学习列表中，点击任何一个正在学习的词，就能找到它的更多例句。在已学列表中同样可以这样做。

<img
  src="/screenshots/word-list-feature/learn-study-word-option.jpg"
  alt=""
  width="650"
  style="max-width: 100%; height: auto; display: block; margin: 1rem 0; border-radius: 8px;"
/>

你还可以选择一个 HSK 等级，低于或等于该等级的词将隐藏助力提示。整句层面的助力功能（如音频和翻译）仍然由句子助手栏提供，对整个句子生效。

<img
  src="/screenshots/word-list-feature/hsk-level-hide-option.jpg"
  alt=""
  width="650"
  style="max-width: 100%; height: auto; display: block; margin: 1rem 0; border-radius: 8px;"
/>

在学习列表和已学列表中，你可以查看所有保存过的词。这些词表将用于未来的 AI 个性化功能，所以请把学过的或想学的词都坚持添加进去。

<img
  src="/screenshots/word-list-feature/study-word-list.jpg"
  alt=""
  width="650"
  style="max-width: 100%; height: auto; display: block; margin: 1rem 0; border-radius: 8px;"
/>

## 弹出词典改进

- 词典条目更紧凑，默认只显示 3 行，点击可展开查看更多。
- 当一个词或字有多条词典释义时，现在可以浏览全部条目。此前只返回第一条，而它往往不是符合上下文的那条释义。
- Pleco 搜索按钮经过重新设计。现在从 Pleco 返回应用时，总能恢复文章和你的精确阅读位置，即使系统在后台杀掉了应用。

<img
  src="/screenshots/v0.8.1-screens/improved-popup-dict.jpg"
  alt=""
  width="650"
  style="max-width: 100%; height: auto; display: block; margin: 1rem 0; border-radius: 8px;"
/>

## 阅读体验打磨

我们对阅读体验进行了几处小而重要的改进：

- 阅读器现在会对你已学会的词、常见停用词，以及低于所选 HSK 等级的词隐藏拼音。
- 单词背景高亮改为括号标记，视觉焦点更干净。
- 在阅读中关闭应用后重新打开，总能恢复文章和你的精确阅读位置。
- 顶栏和设置按钮变小了，给阅读留出更多空间。应用内的返回按钮已移除，统一使用 Android 系统返回键。

## 内容发现与筛选

- 现在可以按文章长度筛选新闻：短篇、中篇、长篇。
- 筛选栏新增了「简化版」筛选。这是即将推出的 AI 辅助文章简化功能的预览，届时会为觉得母语文章太难的学习者提供更多 L4/L5 级别的内容。
- 文章标签现在显示在每篇文章末尾。点击标签即可自动搜索带有相同标签的其他文章。
- 现已支持日语和德语，让更多人无论母语是什么都能学中文！
  - 已有语言包括英语、西班牙语、阿拉伯语、印尼语、马来语、越南语和俄语。

<img
  src="/screenshots/v0.8.1-screens/article-length-filter.jpg"
  alt=""
  width="650"
  style="max-width: 100%; height: auto; display: block; margin: 1rem 0; border-radius: 8px;"
/>

## 应用版本管理

- 现在可以直接在设置中更新应用。有新版本可用时，应用会自动检测并显示更新按钮。
- 设置页和解析页还有许多小的 UX 改进，包括全新的版面布局。

## 即将推出

- 更多 L4/L5 中级内容——比母语级别文章更容易读的文章。
- 期待已久的 AI 辅助文章简化功能已接近完成，将在下个版本发布，可以把任意母语文章降低 1–2 个 HSK 等级。
- 我们还在构建一个每日自动更新的词频表，基于我们收录的真实新闻文章的真实分布。现有的许多词频表已经 20 年之久，语料库也很有限；我们的词频表将反映整个中文互联网。
- 中阿词典（中文—阿拉伯语）仍在推进中。我们找到了一个很有希望的选择，但它是一本纸质书，所以我们正在努力用 OCR 把书页数字化，从而打造免费的中文—阿拉伯语词典。
- 我们正在开发 LevelChineseNews API，让其他中文学习工具和教育工作者可以利用我们的数据和基础设施，构建更多中文学习解决方案。如果你有应用场景，欢迎来信 contact@levelchinese.app。

在此下载 v0.8.1：<https://apk-download.levelchinese.app/v0.8.1-build-1788709444419.apk>
