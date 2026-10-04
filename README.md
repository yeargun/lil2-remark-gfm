# lil2-remark-gfm

[remark-gfm](https://github.com/remarkjs/remark-gfm) 4.0.1 rewritten in typed [LilScript](https://lilscript.eddocu.com):
GitHub Flavored Markdown (autolink literals, footnotes, strikethrough, tables, task lists) on the flat **lil2**
pipeline, with the same trees as upstream.

It reimplements what remark-gfm bundles: micromark-extension-gfm (the syntax) and mdast-util-gfm (the mdast
handlers and the literal-autolink transform). mdast-util-to-hast handles GFM nodes by default, as upstream does.
Inside the family it is compiled into [lil2-react-markdown](https://github.com/yeargun/lil2-react-markdown)'s
`gfm` flavor; on its own it turns markdown into mdast and hast columns.

## Integers, not strings

| upstream | lil2-remark-gfm |
|---|---|
| token types `'table'`, `'strikethrough'`, … | ints in the GFM range (`TYPES_GFM + n`) |
| construct names for `disable` | construct ids (`CONSTRUCTS_GFM + n`) |
| `parser.gfmFootnotes` (an array of labels) | interned identifier ids with a defined-as-footnote flag |
| `table.align: ['left', null, …]` | an int run (`ALIGN_LEFT`, `ALIGN_NONE`, …) the table node points into |
| hast `align: 'left'` | a keyword property value (`KW_LEFT`) |
| footnote and definition lookups by uppercased label | arrays indexed by identifier id |

## In a chat app

This package is a layer of [lil2-react-markdown](https://github.com/yeargun/lil2-react-markdown), measured here as a whole: A chat of LLM-style replies (lists, code, tables, math, about 2.5 KB of markdown each), every reply streamed into the
page a few tokens at a time and rendered by React with GFM, math and KaTeX: react-markdown 10.1.0 with remark-gfm,
remark-math and rehype-katex → **this package's `/full` flavor**. Main-thread time, measured with Playwright in
Chromium 151, with Chrome's CPU throttling standing in for phones (4×: Lighthouse's mid-tier mobile; 6×: DevTools'
low-end mobile); median of 2 runs, libraries alternating, each in a fresh tab.

| | short chat (5 replies) | average chat (20 replies) | long chat (60 replies) |
|---|---:|---:|---:|
| CPU while the replies stream, mid-tier phone (4×) | 7.1 s → **3.2 s** (2.2×) | 29.1 s → **11.5 s** (2.5×) | 1.3 min → **31.0 s** (2.5×) |
| CPU while the replies stream, low-end phone (6×) | 11.2 s → **4.7 s** (2.4×) | 45.9 s → **17.7 s** (2.6×) | 2.0 min → **47.4 s** (2.5×) |
| CPU while the replies stream, this machine | 1.6 s → **0.8 s** (2.1×) | 6.8 s → **2.7 s** (2.5×) | 17.6 s → **7.0 s** (2.5×) |
| updates slower than a frame (16.7 ms), low-end phone (6×) | 125 → **6 of 1,053** | 671 → **6 of 4,615** | 1,318 → **67 of 12,897** |
| opening the saved chat, low-end phone (6×) | 417 ms → **317 ms** (1.3×) | 843 ms → **519 ms** (1.6×) | 1.77 s → **960 ms** (1.8×) |

Every streamed update renders exactly react-markdown's DOM ([`test/chat.test.mjs`](https://github.com/yeargun/lil2-react-markdown/blob/main/test/chat.test.mjs), Chromium and Firefox).
Reproduce with `npm run bench:chat` in lil2-react-markdown; the numbers are in [`bench/chat/results/mobile.json`](https://github.com/yeargun/lil2-react-markdown/blob/main/bench/chat/results/mobile.json).
The machine is one core of an AMD EPYC 7763; real phones vary.

## Install

```bash
npm install @itslil/lil2-remark-gfm
```

TypeScript types are included. One ES module per entry; Node, Deno, Bun and workers get `dist/`, bundlers targeting
browsers get `dist/browser/` through the `browser` condition.

## Use

```ts
import {fromMarkdown, markdownToHast} from '@itslil/lil2-remark-gfm'
import {ALIGN_CENTER, ALIGN_LEFT, ALIGN_NONE, ALIGN_RIGHT, K_DELETE, K_TABLE} from '@itslil/lil2-remark-gfm/constants'

const tree = fromMarkdown('| name | qty | price |\n|:-----|:---:|------:|\n| tea | 2 | 4.50 |\n\n~~sold out~~', true)
const [kind, , , , , , , num, , , , , , , , aux] = tree

// A table's `num` is the offset of its alignments in `aux`: a count, then one ALIGN_* per column.
const table = kind.indexOf(K_TABLE)
const names = {[ALIGN_NONE]: 'none', [ALIGN_LEFT]: 'left', [ALIGN_CENTER]: 'center', [ALIGN_RIGHT]: 'right'}
const align = aux.slice(num[table] + 1, num[table] + 1 + aux[num[table]]).map(a => names[a as keyof typeof names])
console.log(align) // [ 'left', 'center', 'right' ]
console.log(kind.includes(K_DELETE)) // true

const hast = markdownToHast('- [x] done\n- [ ] next')
console.log(hast[18].includes('input')) // task list checkboxes
```

`fromMarkdown(value, singleTilde?)` is remark-parse with remark-gfm (`singleTilde` defaults to `false` here; pass `true`
for remark-gfm's default); `markdownToHast(value, allowDangerousHtml?)` adds remark-rehype. The columns are
[lil2-mdast-util-from-markdown](https://github.com/yeargun/lil2-mdast-util-from-markdown#use)'s and
[lil2-mdast-util-to-hast](https://github.com/yeargun/lil2-mdast-util-to-hast#use)'s; the constants come from
`@itslil/lil2-remark-gfm/constants`. In React, use `@itslil/lil2-react-markdown/gfm`.

### Which package

| you want | package |
|---|---|
| React elements | [`@itslil/lil2-react-markdown`](https://github.com/yeargun/lil2-react-markdown) (`/gfm`, `/full` for GFM, math, KaTeX) |
| an HTML string, CommonMark | [`@itslil/lil2-micromark`](https://github.com/yeargun/lil2-micromark) |
| an HTML string with GFM, math or KaTeX | `renderToStaticMarkup` of lil2-react-markdown's `/full` flavor (below) |
| mdast (syntax tree) | [`lil2-mdast-util-from-markdown`](https://github.com/yeargun/lil2-mdast-util-from-markdown); with GFM [`lil2-remark-gfm`](https://github.com/yeargun/lil2-remark-gfm), math [`lil2-remark-math`](https://github.com/yeargun/lil2-remark-math), breaks [`lil2-remark-breaks`](https://github.com/yeargun/lil2-remark-breaks) |
| elements from hast columns through any JSX runtime | [`lil2-hast-util-to-jsx-runtime`](https://github.com/yeargun/lil2-hast-util-to-jsx-runtime) |
| hast (HTML tree) | [`lil2-mdast-util-to-hast`](https://github.com/yeargun/lil2-mdast-util-to-hast) and the same three, or [`lil2-rehype-katex`](https://github.com/yeargun/lil2-rehype-katex) with formulas rendered |

Every package is one self-contained ES module with no runtime dependencies (React and KaTeX aside), ships its
TypeScript types, and resolves to a Node build or a browser build through its `exports` conditions.
## Measured (2026-10-04)

The `browser` build against remark-gfm@4.0.1 bundled for the browser with esbuild and minified by Terser, esbuild and Oxc
(the smallest shown). Each objective is its own LilScript build (effort level 12, `lazy_functions`).

| | lil2 | upstream, best minifier | difference |
|---|---:|---:|---:|
| raw | 74,981 | 95,678 (Terser) | −21.6% |
| gzip (9) | 24,071 | 26,065 (Terser) | −7.7% |
| Brotli (11) | 20,971 | 23,016 (Terser) | −8.9% |

Speed, upstream → lil2: markdown with GFM to HTML, median per call in a fresh browser context per lane, after checking that both
give the same output (Playwright; Chromium 151, Firefox 153; AMD EPYC 7763 64-Core Processor). Cold rows are the first import and the
first call of a fresh page.

| | Chromium | Firefox |
|---|---:|---:|
| gfm (15 KB) | 13.6 → 5.35 ms (0.39×) | 27.0 → 12.0 ms (0.44×) |
| readme (26 KB) | 22.4 → 8.45 ms (0.38×) | 39.0 → 17.0 ms (0.44×) |
| import, cold | 5.80 → 6.00 ms | 13.0 → 13.0 ms |
| first call, cold | 57.0 → 46.2 ms | 73.0 → 50.0 ms |

## Behaviour

`test/differential.test.mjs` parses 1,453 documents (all 672 examples of the GFM spec, cmark-gfm's extension
tests, GFM edge cases and the CommonMark corpus) with micromark-extension-gfm + mdast-util-gfm and with lil2,
and compares the mdast (with and without `singleTilde`) and the hast (with and without dangerous HTML) as rows of
indexed arrays: every node, field and position. `test/browser.test.mjs` does the same with the browser build in
Chromium and Firefox. All are equal.

## License

MIT; see NOTICE.md.
