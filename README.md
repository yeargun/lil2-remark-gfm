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

## Behaviour

`test/differential.test.mjs` parses 1,453 documents (all 672 examples of the GFM spec, cmark-gfm's extension
tests, GFM edge cases and the CommonMark corpus) with micromark-extension-gfm + mdast-util-gfm and with lil2,
and compares the mdast (with and without `singleTilde`) and the hast (with and without dangerous HTML) as rows of
indexed arrays: every node, field and position. `test/browser.test.mjs` does the same with the browser build in
Chromium and Firefox. All are equal.

## License

MIT; see NOTICE.md.
