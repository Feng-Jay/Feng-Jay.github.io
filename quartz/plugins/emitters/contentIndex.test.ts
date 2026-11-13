import assert from "node:assert/strict"
import { mkdtemp, readFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import test, { TestContext } from "node:test"
import { BuildCtx } from "../../util/ctx"
import { FullSlug } from "../../util/path"
import { defaultProcessedContent, QuartzPluginData } from "../vfile"
import { ContentIndex } from "./contentIndex"

function page(slug: string, title: string, date: string, rss = false) {
  const created = new Date(date)
  return defaultProcessedContent({
    slug: slug as FullSlug,
    frontmatter: { title, rss },
    text: `${title} body`,
    description: `${title} description`,
    dates: { created, modified: created, published: created },
  })
}

async function emitIndex(t: TestContext, options: Parameters<typeof ContentIndex>[0] = {}) {
  const output = await mkdtemp(path.join(tmpdir(), "quartz-rss-filter-"))
  t.after(() => rm(output, { recursive: true, force: true }))
  const ctx = {
    argv: { output },
    cfg: {
      configuration: {
        pageTitle: "Test site",
        baseUrl: "example.com",
        locale: "en-US",
        defaultDateType: "created",
      },
    },
  } as BuildCtx
  const content = [
    page("index", "Homepage", "2026-11-13"),
    page("ideas/index", "Ideas", "2026-11-12"),
    page("ideas/older", "Older article", "2026-11-10", true),
    page("reading/newer", "Newer article", "2026-11-11", true),
    page("research/oldest", "Oldest article", "2026-11-09", true),
  ]
  const emitted = await ContentIndex(options).emit(ctx, content, {
    css: [],
    js: [],
    additionalHead: [],
  })
  return {
    emitted,
    read: (file: string) => readFile(path.join(output, file), "utf8"),
  }
}

function itemLinks(rss: string) {
  return Array.from(rss.matchAll(/<item>[\s\S]*?<link>(.*?)<\/link>/g), (match) => match[1])
}

const markedForRSS = (file: QuartzPluginData) => file.frontmatter?.rss === true

test("RSS filtering uses file metadata before sorting and limiting articles", async (t) => {
  const output = await emitIndex(t, { rssFilter: markedForRSS, rssLimit: 2 })
  const rss = await output.read("index.xml")
  assert.deepEqual(itemLinks(rss), [
    "https://example.com/reading/newer",
    "https://example.com/ideas/older",
  ])
  assert.match(rss, /<guid>https:\/\/example.com\/reading\/newer<\/guid>/)
  assert.match(rss, /<pubDate>Wed, 11 Nov 2026 00:00:00 GMT<\/pubDate>/)
})

test("pages excluded from RSS remain in the sitemap and search index", async (t) => {
  const output = await emitIndex(t, { rssFilter: markedForRSS })
  const sitemap = await output.read("sitemap.xml")
  const search = JSON.parse(await output.read("static/contentIndex.json"))
  assert.match(sitemap, /<loc>https:\/\/example.com\/<\/loc>/)
  assert.match(sitemap, /<loc>https:\/\/example.com\/ideas\/<\/loc>/)
  assert.equal(search.index.title, "Homepage")
  assert.equal(search["ideas/index"].title, "Ideas")
  assert.equal(Object.keys(search).length, 5)
})

test("omitting the RSS filter preserves all indexed pages in the feed", async (t) => {
  const output = await emitIndex(t)
  assert.deepEqual(itemLinks(await output.read("index.xml")), [
    "https://example.com/",
    "https://example.com/ideas/",
    "https://example.com/reading/newer",
    "https://example.com/ideas/older",
    "https://example.com/research/oldest",
  ])
})

test("no eligible pages produces an empty RSS channel", async (t) => {
  const output = await emitIndex(t, { rssFilter: () => false })
  const rss = await output.read("index.xml")
  assert.deepEqual(itemLinks(rss), [])
  assert.match(rss, /^<\?xml version="1\.0" encoding="UTF-8" \?>\s*<rss version="2\.0">/)
  assert.match(rss, /<channel>\s*<title>Test site<\/title>/)
  assert.match(rss, /<\/channel>\s*<\/rss>\s*$/)
})

test("disabled RSS does not invoke the RSS filter", async (t) => {
  const output = await emitIndex(t, {
    enableRSS: false,
    rssFilter: () => {
      assert.fail("RSS filter must not run when RSS is disabled")
    },
  })
  assert.equal(
    output.emitted.some((file) => file.endsWith("/index.xml")),
    false,
  )
  assert.equal(Object.keys(JSON.parse(await output.read("static/contentIndex.json"))).length, 5)
})
