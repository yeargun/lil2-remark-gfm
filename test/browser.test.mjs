// The browser build (the `browser` condition) in real browsers, where named references are decoded by
// the document: same mdast and hast as upstream remark-gfm, compared as rows.
import assert from 'node:assert/strict'
import {test} from 'node:test'
import {fromMarkdown as upstreamFromMarkdown} from 'mdast-util-from-markdown'
import {gfm} from 'micromark-extension-gfm'
import {gfmFromMarkdown} from 'mdast-util-gfm'
import {toHast} from 'mdast-util-to-hast'
import {browsers, inBrowser} from './browser.mjs'
import {corpus} from './corpus.mjs'
import * as mdastRows from './rows-mdast.mjs'
import * as hastRows from './rows-hast.mjs'
const artifact = new URL(process.env.LIL2_BROWSER_ARTIFACT ?? '../dist/browser/remark-gfm.js', import.meta.url)
const cases = corpus()

for (const name of browsers) {
  test(`browser build in ${name}: mdast and hast equal upstream`, async () => {
    const out = await inBrowser(name, artifact, (lib, markdowns) => ({
      propNames: lib.propNames, keywordNames: lib.keywordNames,
      trees: markdowns.map(m => [lib.fromMarkdown(m, true), lib.markdownToHast(m, false)])
    }), cases.map(c => c.markdown))
    const failures = []
    cases.forEach((c, i) => {
      const tree = upstreamFromMarkdown(c.markdown, {extensions: [gfm()], mdastExtensions: [gfmFromMarkdown()]})
      try {
        assert.deepStrictEqual(mdastRows.fromColumns(out.trees[i][0]), mdastRows.fromObjects(tree))
        assert.deepStrictEqual(hastRows.fromColumns(out.trees[i][1], out.propNames, out.keywordNames), hastRows.fromObjects(toHast(tree)))
      } catch (error) {
        failures.push({name: c.name, error: String(error.message).slice(0, 500)})
      }
    })
    if (failures.length) console.log(JSON.stringify({failures: failures.length, first: failures.slice(0, 3)}, null, 1))
    assert.equal(failures.length, 0)
  })
}
