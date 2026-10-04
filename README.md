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

## Use

```js
import {fromMarkdown, markdownToHast, propNames, keywordNames} from '@itslil/lil2-remark-gfm'

fromMarkdown('| a |\n| :- |\n| ~~b~~ |', true) // mdast columns, as lil2-mdast-util-from-markdown's
markdownToHast('- [x] done', false)          // hast columns, as lil2-mdast-util-to-hast's
```

`fromMarkdown(value, singleTilde)` returns the mdast columns; a table's `num` is the offset of its alignment run
in `aux` (a count, then one `ALIGN_*` per column). `markdownToHast(value, allowDangerousHtml)` returns the hast
columns. Both builds exist: `dist/` and `dist/browser/` (the `browser` condition, which decodes named character
references with the document instead of shipping the 2,125-entry table).

## Measured (2026-10-04)

The `browser` build against remark-gfm@4.0.1 bundled for the browser with esbuild and minified by Terser, esbuild and Oxc
(the smallest shown). Each objective is its own LilScript build (effort level 12, `lazy_functions`).

| | lil2 | upstream, best minifier | difference |
|---|---:|---:|---:|
| raw | 74,981 | 95,678 (Terser) | −21.6% |
| gzip (9) | 24,071 | 26,065 (Terser) | −7.7% |
| Brotli (11) | 21,028 | 23,016 (Terser) | −8.6% |

Speed, upstream → lil2: markdown with GFM to HTML, median per call in a fresh browser context per lane, after checking that both
give the same output (Playwright; Chromium 151, Firefox 153; AMD EPYC 7763 64-Core Processor). Cold rows are the first import and the
first call of a fresh page.

| | Chromium | Firefox |
|---|---:|---:|
| gfm (15 KB) | 13.0 → 5.45 ms (0.42×) | 27.0 → 12.0 ms (0.44×) |
| readme (26 KB) | 22.1 → 8.28 ms (0.37×) | 40.0 → 17.0 ms (0.42×) |
| import, cold | 5.80 → 6.10 ms | 13.0 → 13.0 ms |
| first call, cold | 57.1 → 45.3 ms | 75.0 → 51.0 ms |

## Behaviour

`test/differential.test.mjs` parses 1,453 documents (all 672 examples of the GFM spec, cmark-gfm's extension
tests, GFM edge cases and the CommonMark corpus) with micromark-extension-gfm + mdast-util-gfm and with lil2,
and compares the mdast (with and without `singleTilde`) and the hast (with and without dangerous HTML) as rows of
indexed arrays: every node, field and position. `test/browser.test.mjs` does the same with the browser build in
Chromium and Firefox. All are equal.

## License

MIT; see NOTICE.md.
