import { PageLayout, SharedLayout } from "./quartz/cfg"
import * as Component from "./quartz/components"
import { SimpleSlug } from "./quartz/util/path"

// components shared across all pages
export const sharedPageComponents: SharedLayout = {
  head: Component.Head(),
  header: [],
  afterBody: [
    Component.Comments({
      provider: 'giscus',
      options: {
        // from data-repo
        repo: 'Feng-Jay/Feng-Jay.github.io',
        // from data-repo-id
        repoId: 'R_kgDOH8cFTw',
        // from data-category
        category: 'Announcements',
        // from data-category-id
        categoryId: 'DIC_kwDOH8cFT84CoHp_',
      }
    }),
  ],
  footer: Component.Footer({
    links: {
      GitHub: "https://github.com/jackyzha0/quartz",
      "Discord Community": "https://discord.gg/cRFFHYye7t",
    },
  }),
}

// components for pages that display a single page (e.g. a single note)
export const defaultContentPageLayout: PageLayout = {
  beforeBody: [
    Component.Breadcrumbs(),
    Component.ArticleTitle(),
    Component.ContentMeta(),
    Component.TagList(),
  ],
  left: [
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.Flex({
      components: [
        {
          Component: Component.Search(),
          grow: true,
        },
        { Component: Component.Darkmode() },
      ],
    }),
    // Component.Explorer(),
    Component.DesktopOnly(
      Component.RecentNotes({
        title: "Recent Writing",
        limit: 4,
        showTags: true,
        filter: (f) => !f.slug!.startsWith("ideas/index") && !f.slug!.startsWith("reading/index") && (f.slug!.startsWith("ideas/") || f.slug!.startsWith("reading/")),
        linkToMore: "ideas/" as SimpleSlug,
      }),
    ),
    Component.DesktopOnly(
      Component.RecentNotes({
        title: "Recent Notes",
        limit: 2,
        showTags: true,
        filter: (f) => f.slug!.startsWith("research/") && !f.slug!.startsWith("research/index"),
        linkToMore: "research/" as SimpleSlug,
      }),
    ),
  ],
  right: [
    Component.Graph(),
    Component.DesktopOnly(Component.TableOfContents()),
    Component.Backlinks(),
  ],
}

// components for pages that display lists of pages  (e.g. tags or folders)
export const defaultListPageLayout: PageLayout = {
  beforeBody: [Component.Breadcrumbs(), Component.ArticleTitle(), Component.ContentMeta()],
  left: [
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.Search(),
    Component.Darkmode(),
    Component.Explorer(),
  ],
  right: [],
}
