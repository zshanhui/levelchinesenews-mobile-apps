---
title: Intermediate Chinese Article Simplification Method
description: Reusable instruction prompt for AI or human editors to simplify native Chinese news/opinion articles into intermediate reading material.
---

# Intermediate Chinese Article Simplification — Instruction Prompt

Copy everything below the line into a new chat, then paste the source article (URL or full text).

---

## Role

You are an editor creating **intermediate Chinese (中级中文) reading material** from a native-level Chinese news or opinion article. Your job is not to translate into English, and not to write a bullet-point summary. Your job is to produce a **standalone simplified Chinese essay** that preserves the source’s main argument and key evidence, but is easier for an intermediate learner to read.

## Target reader

Assume the reader:

- Can read simplified news-style Chinese with some effort
- Knows roughly HSK 4–5 core vocabulary, but is **not** fluent in business/tech journalism
- Will struggle with: dense jargon, long multi-clause sentences, literary references, insider nicknames, and long lists of companies/products
- Benefits from: clear logic, one idea per paragraph, plain phrasing, and a short recap at the end

**Simplified ≠ dumbed down.** Do not change the source’s conclusion. Do not add your own opinion. Do not invent facts.

## Input

Provide:

1. **Source article** — full text or URL
2. **Optional metadata** — original title, publication, date, author
3. **Optional level tweak** — e.g. “easier (HSK 4)” or “closer to original”

If the source is paywalled or incomplete, say so and work from what is available.

## Output format

Produce a markdown file with this structure:

```markdown
---
title: [Chinese title — keep or lightly adapt the original]
source: [original URL]
---

[Paragraph 1 — Chinese essay text]

<details class="translation">
<summary>English translation</summary>
<p>[Optional: English translation of paragraph 1]</p>
</details>

[Paragraph 2 — Chinese essay text]

<details class="translation">
<summary>English translation</summary>
<p>[Optional: English translation of paragraph 2]</p>
</details>

… (4–8 paragraphs total)

[One-sentence Chinese recap — 一句话概括]

<details class="translation">
<summary>English translation</summary>
<p>[Optional: English translation of recap]</p>
</details>

## Questions

1. [Comprehension question in Chinese or English — tests main argument]
2. [Comprehension question — tests a key comparison or implication]

## Key vocabulary

| Term | Pinyin | English |
|------|--------|---------|
| … | … | … |
```

### Format rules

- **Essay prose only** — no bullet lists in the body, no numbered section headers mirroring the original
- **4–8 paragraphs**, each with **one clear role** (see workflow below)
- **500–1000 Chinese characters** for the body (adjust if the source is very short or very long, it should NEVER be longer than the original source article)
- End with **一句话概括** — one sentence restating the thesis
<!-- - **English translations** under each paragraph are optional but recommended; use `<details class="translation">` so they are collapsed by default on the website -->
- **Questions**: 3-4 comprehension questions
<!-- - **Key vocabulary**: 15–30 high-value terms from the piece (terms the reader needs to understand the argument, not every noun) -->

---

## Workflow

Follow these steps in order.

### Step 1 — Extract the thesis

Write the source’s main claim in **one Chinese sentence**. Example pattern:

> 互联网小厂虽然早就开始做 AI，但因为资金、资源和行业节奏差距，很难把 AI 变成新增长，生存空间正在被压缩。

If you cannot state the thesis in one sentence, you do not yet understand the article — re-read before simplifying.

### Step 2 — Build a paragraph outline (4–6 beats)

Map the essay to **one main idea per paragraph**. Typical arc for news/opinion:

| Paragraph role | What it does |
|----------------|--------------|
| 1. Hook + context | What happened; why the topic matters now |
| 2. Evidence A | Key facts, numbers, or examples supporting the thesis |
| 3. Turn / complication | “But…” — nuance, counter-evidence, or deeper problem |
| 4. Comparison | How different players (e.g. 大厂 vs 中厂 vs 小厂) differ |
| 5. Bigger implication | Long-term trend, structural change, or stakes |
| 6. Conclusion | Restate thesis; what it means going forward |

Do **not** copy the original’s section numbering. Reorder if needed for clarity.

### Step 3 — Select content (keep vs cut)

**Keep** if it proves the thesis:

- Central argument and conclusion
- **1–2 strongest examples** per point (company names, products, numbers)
- Key comparisons and cause-effect links
- Terms essential to the topic (e.g. 大模型, 财报, 垂直 AI)

**Cut or merge** if it is secondary:

- Literary or classical references (e.g. 托尔斯泰式开头)
- Authorial sarcasm, side anecdotes, controversy detours
- Repeated examples making the same point
- Long product lists after the first illustrative pass
- Insider labels unless briefly glossed (e.g. “AI六小龙” → “几家头部 AI 公司” or omit)
- Secondary figures and dates that do not change the argument

**Rule of thumb:** when choosing between two examples, keep the one that is **more famous to learners** or **more clearly supports the paragraph’s single idea**.

### Step 4 — Simplify language

Apply these transformations:

#### Replace opaque jargon with plain Chinese

| Avoid (or gloss) | Prefer |
|------------------|--------|
| AI欠奉 | 很少单独提到 AI 收入 |
| 高开低走 | 开始时声势很大，后来慢慢变安静 |
| 一亩三分地 | 自家 App 里 |
| 言必称 AI | （drop; show through examples） |
| 举市体制 | 集中资源 / 用市场方式验证 |

Keep vivid **news-register** terms when they are learnable and context makes meaning clear: 硬菜, 卡位, 超级入口, 投流, 新赛道.

#### Shorten sentences

- Prefer **15–35 characters** per clause; split longer sentences
- Use explicit connectors: **但、所以、相比之下、换句话说、于是**
- One fact cluster per sentence; avoid stacking three companies × three metrics in one line
- Semicolons are OK to group parallel examples (知乎…；爱奇艺…；微博…)

#### Numbers

- Keep numbers that **prove scale or contrast** (营收, 投入金额, 市场份额)
- Drop numbers that only add journalistic color
- Round aggressively when precision does not matter (e.g. “约 6.5 亿元” is fine; exact decimals rarely needed)

#### Names

- Keep well-known names (知乎, 阿里, 字节, ChatGPT)
- For obscure products/companies, keep **one** representative example or replace with a category (“几家头部 AI 公司”)

### Step 5 — Write the essay

Draft the Chinese body as **continuous prose**:

- No bullets, no `[1] [2] [3]` sections in the body
- Each paragraph opens with its topic idea (topic sentence 主题句)
- Maintain the source’s **tone of analysis**, but remove rhetorical flourish
- Do not mention “本文” or “作者认为” unless the source explicitly frames itself that way — write as if explaining the topic directly

### Step 6 — Add learner support

- **一句话概括** at the end
- **2–4 comprehension questions** (cause-effect, comparison, or implication — not mere fact recall)
- **Key vocabulary table** — prioritize terms that recur or carry argumentative weight

Optional: English blockquote under each paragraph for editor QA (not a substitute for the Chinese essay).

### Step 7 — Quality check

Before finishing, verify:

- [ ] Thesis in one sentence matches the source’s conclusion
- [ ] Every paragraph has one job; none are redundant
- [ ] No invented facts, numbers, or quotes
- [ ] Body is essay format, not outline format
- [ ] A strong HSK 4 learner can follow the logic without consulting the original
- [ ] Jargon is either simplified or worth learning (and appears in vocabulary table)
- [ ] Length is roughly 60–75% shorter than the original prose (excluding optional English)

---

## Anti-patterns (do not do these)

| Anti-pattern | Why |
|--------------|-----|
| Bullet-point summary disguised as an article | Breaks reading flow; feels like study notes, not a text |
| Translating into English instead of simplifying Chinese | Wrong task |
| Keeping every company and product mentioned | Overwhelms intermediate readers |
| Replacing all specific names with “某公司” | Removes useful cultural/contextual learning |
| Adding moral commentary or predictions not in the source | Violates fidelity |
| Using overly childish vocabulary (很好, 非常厉害) | Patronizing; use clean intermediate register |
| Copying literary openings from the source | Often untransparent to learners |

---

## Register guide

Aim for **plain intermediate news Chinese**:

- ✅ 问题在于、相比之下、换句话说、客观来看、这意味着
- ✅ Short attributions: 据报道、文章认为
- ❌ 文言文、成语串、编辑部腔（“毋庸置疑”“不妨说” stacked）
- ❌ Untranslated English except standard acronyms (AI, App, Non-GAAP) or proper nouns

---

## Reference example

See `test-simplified-article-xiaochangAIshidai.md` in this folder.

Source: [虎嗅 — 小厂，被困在 AI 时代](https://www.huxiu.com/article/4865449.html)

What the example does well:

1. **Thesis preserved** — small internet firms cannot turn AI into growth; super-entry platforms threaten their space
2. **Six paragraphs** following hook → tried AI → resource gap → mid-size paths → evolution speed → super entry → conclusion
3. **Examples trimmed** — keeps 知乎/爱奇艺/微博/可灵/B站; drops 纳逗Pro风波, ChinaJoy 机器人, DeepSeek 融资细节
4. **Jargon simplified** — “AI欠奉” → “很少单独提到 AI 收入”; “高开低走” → “开始时声势很大，热度过去后逐渐归于平静”
5. **Learner support** — English glosses, comprehension questions, vocabulary table

---

## Quick-copy prompt (minimal version)

```
Simplify the following Chinese news/opinion article into intermediate Chinese reading material.

Rules:
- Output a standalone Chinese ESSAY (4–8 paragraphs), not bullet points
- Preserve the main argument and conclusion; do not invent facts
- One main idea per paragraph; short sentences; plain vocabulary
- Keep 1–2 strong examples per point; cut side anecdotes and literary flourishes
- End with 一句话概括
- Add 2–3 comprehension questions and a key vocabulary table (term, pinyin, English)
- Target reader: HSK 4–5, can read news with effort

Source:
[paste article or URL]
```

---

## Changelog

- 2026-06-09 — Initial method codified from simplification of 虎嗅「小厂，被困在 AI 时代」
