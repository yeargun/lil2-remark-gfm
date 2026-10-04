// Same mdast and hast as upstream remark-gfm (micromark-extension-gfm + mdast-util-gfm, then
// mdast-util-to-hast), compared as rows of indexed arrays, on the GFM spec and the CommonMark corpus.
import assert from 'node:assert/strict'
import {test} from 'node:test'
import {fromMarkdown as upstreamFromMarkdown} from 'mdast-util-from-markdown'
import {gfm} from 'micromark-extension-gfm'
import {gfmFromMarkdown} from 'mdast-util-gfm'
import {toHast} from 'mdast-util-to-hast'
import {corpus} from './corpus.mjs'
import * as mdastRows from './rows-mdast.mjs'
import * as hastRows from './rows-hast.mjs'
const lib = await import(new URL(process.env.LIL2_ARTIFACT ?? '../.dev/dist/remark-gfm.js', import.meta.url))
const upstream = (markdown, singleTilde) => upstreamFromMarkdown(markdown, {extensions: [gfm({singleTilde})], mdastExtensions: [gfmFromMarkdown()]})

for (const singleTilde of [true, false]) {
  test(`mdast equals upstream (singleTilde: ${singleTilde})`, () => {
    const failures = []
    for (const c of corpus()) {
      try {
        assert.deepStrictEqual(mdastRows.fromColumns(lib.fromMarkdown(c.markdown, singleTilde)), mdastRows.fromObjects(upstream(c.markdown, singleTilde)))
      } catch (error) {
        failures.push({name: c.name, markdown: c.markdown.slice(0, 160), error: String(error.message).slice(0, 900)})
      }
    }
    if (failures.length) console.log(JSON.stringify({failures: failures.length, first: failures.slice(0, 3)}, null, 1))
    assert.equal(failures.length, 0)
  })
}

for (const allowDangerousHtml of [false, true]) {
  test(`hast equals upstream (allowDangerousHtml: ${allowDangerousHtml})`, () => {
    const failures = []
    for (const c of corpus()) {
      try {
        assert.deepStrictEqual(hastRows.fromColumns(lib.markdownToHast(c.markdown, allowDangerousHtml), lib.propNames, lib.keywordNames), hastRows.fromObjects(toHast(upstream(c.markdown, true), {allowDangerousHtml})))
      } catch (error) {
        failures.push({name: c.name, markdown: c.markdown.slice(0, 160), error: String(error.message).slice(0, 900)})
      }
    }
    if (failures.length) console.log(JSON.stringify({failures: failures.length, first: failures.slice(0, 3)}, null, 1))
    assert.equal(failures.length, 0)
  })
}
