import { FullSlug, resolveRelative } from "../util/path"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"
import { i18n } from "../i18n"

interface Options {
  title?: string
  rootSlug?: FullSlug
}

export default ((opts?: Options) => {
  const PageTitle: QuartzComponent = ({ fileData, cfg, displayClass }: QuartzComponentProps) => {
    const title = opts?.title ?? cfg?.pageTitle ?? i18n(cfg.locale).propertyDefaults.title
    const baseDir = resolveRelative(fileData.slug!, opts?.rootSlug ?? ("index" as FullSlug))
    return (
      <h2 class={classNames(displayClass, "page-title")}>
        <a href={baseDir}>{title}</a>
      </h2>
    )
  }

  PageTitle.css = `
.page-title {
  font-size: 1.75rem;
  margin: 0;
}
`

  return PageTitle
}) satisfies QuartzComponentConstructor<Options>
