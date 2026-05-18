---
title: "LevelChinese News v0.6.2 is Now Available for Android"
description: "Android v0.6.2: faster long-article reading with FlashList, new filters, more languages and sources, DeepseekV4Flash summaries and translations, and improved caching and word segmentation."
pubDate: 2026-05-18
draft: false
---

## Main improvements

1. Reading render performance on long articles (over 1000 words) is much improved, we used FlashList to render the sentence blocks and fixed an issue with dead spots when scrolling

2. We added article filters for improved discovery including topic filters, date filters for Published and Created At

3. We added more languages support for Indonesian, Russian, Vietnamese, now supporting more than 8 languages. More media sources added such as World Journal for US based Chinese news, The Paper CN, 海峡网 for Fujian based Chinese news, and early preview ZhipuQA integration for Quora like question and answer type content

4. We switch to DeepseekV4Flash for the article English summaries and per sentence translations, generation speed has improved by 2-3x and it is also less expensive for us which is important since the app is 100% free and no Ads! Lots of technical performance improvements on the backend including better caching with Cloudflare, so overall speed should feel a lot quicker during both article list and article content load.

5. We started integrating our extended dictionary into the word segmentation so there should be gradually (over time) be fewer mistakes in how the words are segmented such as 英伟达 (correct now) vs 英伟/大 (wrong before) When the word segmentation is improve, this also improves the local dictionary as a second order effect. PS: we are looking for native Chinese contributors to improve our word segmentation and local dictionary even more!

### What's coming next in the next release:

  - We will working on Anki integration so that new you come across during reading can be added to your Anki deck with 1 click. In addition, we want to have a way where "learned words" can be tracked so pinyin can be turned off for known words. And it is always a good feeling to see this list grow over time!

  - More content sources like ZhipuQA and intermediate level reading content. Contact me if you know any free domain sources for easier Chinese content.

  - We will make the image downloads more efficient for data use, some of LCN users are from countries where data bandwidth is expensive or slow. We have first class offline support (it's pretty good already) and options to turn off image downloads, including making the fonts downloadable at runtime to keep the initial apk download smaller.

  - Improve the article reading experience with better Chinese fonts and better sentence highlighting. The current sentence focus is not the best and we are experimenting with ways to improve it.

  - We are trying to find a good Chinese -> Arabic dictionary to include as a local dictionary. The app should have first class support for Arabic language just like English.
