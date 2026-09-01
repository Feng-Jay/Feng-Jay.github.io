type ContentRecord = {
  slug: string
  title?: string
  content?: string
  tags?: string[]
}

type VirtualEntry = {
  name: string
  path: string
  kind: "directory" | "file" | "link"
}

const shellCommandNames = [
  "help",
  "ls",
  "tree",
  "cd",
  "cat",
  "less",
  "open",
  "pwd",
  "about",
  "research",
  "publications",
  "education",
  "interests",
  "kb",
  "judgement",
  "github",
  "scholar",
  "clear",
]

const templateFiles: Record<string, string> = {
  "about.md": "about",
  "research.md": "research",
  "publications.md": "publications",
  "education.md": "education",
  "interests.md": "interests",
}

const templateAliases: Record<string, string> = {
  about: "about.md",
  profile: "about.md",
  whoami: "about.md",
  research: "research.md",
  focus: "research.md",
  publications: "publications.md",
  publication: "publications.md",
  pub: "publications.md",
  pubs: "publications.md",
  education: "education.md",
  edu: "education.md",
  interests: "interests.md",
  reading: "interests.md",
}

const externalLinks: Record<string, string> = {
  "judgement.url": "https://feng-jay.github.io/my-judgement/",
  "github.url": "https://github.com/Feng-Jay",
  "scholar.url": "https://scholar.google.com/citations?user=btcwJ_EAAAAJ&hl=en",
}

const publishedRoots = new Set(["ideas", "reading", "research"])

function normalizeShellCommand(value: string) {
  return value.trim().replace(/^\/+([a-z])/i, "$1").replace(/\s+/g, " ")
}

function setupHomeTerminal() {
  const form = document.querySelector<HTMLFormElement>(".shell-command-line")
  const output = document.querySelector<HTMLElement>("#terminal-output")
  const input = form?.querySelector<HTMLInputElement>("#shell-command")
  const activePrompt = form?.querySelector<HTMLElement>(".shell-prompt")
  if (!form || !output || !input || !activePrompt) return

  const commandButtons = document.querySelectorAll<HTMLButtonElement>("[data-command]")
  const history: string[] = []
  const kbFiles = new Map<string, ContentRecord>()
  const kbDirectories = new Set<string>(["kb"])
  let historyIndex = 0
  let currentDirectory = ""

  const contentIndexReady = fetch("/static/contentIndex.json")
    .then((response) => {
      if (!response.ok) throw new Error(`content index returned ${response.status}`)
      return response.json() as Promise<Record<string, ContentRecord>>
    })
    .then((index) => {
      buildKbFileSystem(index)
    })
    .catch((error) => {
      console.error("Unable to load the virtual knowledge base", error)
    })

  function buildKbFileSystem(index: Record<string, ContentRecord>) {
    const kbIndex = index.kb
    if (kbIndex) kbFiles.set("kb/README.md", kbIndex)

    for (const record of Object.values(index)) {
      const slug = record.slug
      const segments = slug.split("/").filter(Boolean)
      if (segments.length === 0 || !publishedRoots.has(segments[0])) continue

      const leaf = segments.at(-1) ?? ""
      const isDirectoryIndex = leaf === "index"
      const draftLike =
        record.tags?.some((tag) => ["draft", "草稿"].includes(tag.toLowerCase())) ||
        /^(draft|草稿)(\b|\s|[:：_-])/i.test(record.title?.trim() ?? "")
      if (draftLike || (!isDirectoryIndex && !record.content?.trim())) continue

      const parentSegments = leaf === "index" ? segments.slice(0, -1) : segments.slice(0, -1)
      const fileName = leaf === "index" ? "README.md" : leaf.endsWith(".md") ? leaf : `${leaf}.md`
      const virtualSegments = ["kb", ...parentSegments, fileName]
      const virtualPath = virtualSegments.join("/")
      kbFiles.set(virtualPath, record)

      for (let depth = 1; depth < virtualSegments.length - 1; depth++) {
        kbDirectories.add(virtualSegments.slice(0, depth + 1).join("/"))
      }
    }
  }

  function displayDirectory(path = currentDirectory) {
    return path ? `~/${path}` : "~"
  }

  function promptText() {
    return `fengjie@wise:${displayDirectory()}$`
  }

  function updatePrompt() {
    activePrompt.textContent = promptText()
  }

  function resetOutputScroll() {
    window.requestAnimationFrame(() => {
      output.scrollTop = 0
    })
  }

  function promptLine(command: string) {
    const line = document.createElement("p")
    line.className = "shell-echo"
    const prompt = document.createElement("span")
    prompt.className = "shell-prompt"
    prompt.textContent = promptText()
    line.append(prompt, document.createTextNode(` ${command}`))
    return line
  }

  function showNode(command: string, node: Node) {
    const entry = document.createElement("div")
    entry.className = "shell-entry"
    entry.append(promptLine(command), node)
    output.replaceChildren(entry)
    resetOutputScroll()
  }

  function showText(command: string, message: string, state = "normal") {
    const result = document.createElement("p")
    result.className = `shell-message shell-message-${state}`
    result.textContent = message
    showNode(command, result)
  }

  function showTemplate(command: string, templateName: string) {
    const template = document.querySelector<HTMLElement>(
      `[data-terminal-template="${templateName}"]`,
    )
    const result = template?.firstElementChild?.cloneNode(true)
    if (!result) {
      showText(command, `missing output: ${templateName}`, "error")
      return
    }
    showNode(command, result)
  }

  function resolvePath(rawPath: string) {
    let path = rawPath.trim()
    if (!path || path === ".") return currentDirectory

    let segments: string[]
    if (path === "~" || path === "/" || path === "/home/fengjie") {
      return ""
    } else if (path.startsWith("~/")) {
      segments = path.slice(2).split("/")
    } else if (path.startsWith("/home/fengjie/")) {
      segments = path.slice("/home/fengjie/".length).split("/")
    } else if (path.startsWith("/")) {
      segments = path.slice(1).split("/")
    } else {
      segments = [...currentDirectory.split("/").filter(Boolean), ...path.split("/")]
    }

    const resolved: string[] = []
    for (const segment of segments) {
      if (!segment || segment === ".") continue
      if (segment === "..") resolved.pop()
      else resolved.push(segment)
    }
    return resolved.join("/")
  }

  function findFile(rawPath: string) {
    const alias = templateAliases[rawPath.toLowerCase()]
    const resolved = resolvePath(alias ?? rawPath)
    if (templateFiles[resolved]) return { path: resolved, template: templateFiles[resolved] }
    const kbPath = kbFiles.has(resolved) ? resolved : `${resolved}.md`
    const record = kbFiles.get(kbPath)
    return record ? { path: kbPath, record } : undefined
  }

  function directoryEntries(path: string): VirtualEntry[] {
    if (path === "") {
      return [
        ...Object.keys(templateFiles).map((name) => ({ name, path: name, kind: "file" as const })),
        { name: "kb", path: "kb", kind: "directory" as const },
        ...Object.keys(externalLinks).map((name) => ({ name, path: name, kind: "link" as const })),
      ]
    }

    const entries = new Map<string, VirtualEntry>()
    for (const directory of kbDirectories) {
      const parts = directory.split("/")
      const parent = parts.slice(0, -1).join("/")
      if (parent === path) {
        entries.set(parts.at(-1) ?? directory, {
          name: parts.at(-1) ?? directory,
          path: directory,
          kind: "directory",
        })
      }
    }
    for (const filePath of kbFiles.keys()) {
      const parts = filePath.split("/")
      const parent = parts.slice(0, -1).join("/")
      if (parent === path) {
        entries.set(parts.at(-1) ?? filePath, {
          name: parts.at(-1) ?? filePath,
          path: filePath,
          kind: "file",
        })
      }
    }
    return [...entries.values()].sort((left, right) => {
      if (left.kind !== right.kind) return left.kind === "directory" ? -1 : 1
      return left.name.localeCompare(right.name)
    })
  }

  async function listDirectory(command: string, rawPath: string) {
    await contentIndexReady
    const path = resolvePath(rawPath)
    const file = findFile(rawPath)
    if (file) {
      showText(command, file.path, "success")
      return
    }
    if (path !== "" && !kbDirectories.has(path)) {
      showText(command, `ls: no such file or directory: ${rawPath || path}`, "error")
      return
    }

    const result = document.createElement("div")
    result.className = "shell-result shell-directory"
    const heading = document.createElement("h2")
    heading.textContent = displayDirectory(path)
    const list = document.createElement("div")
    list.className = "shell-file-list"
    for (const entry of directoryEntries(path)) {
      const item = document.createElement("span")
      item.className = `shell-file shell-file-${entry.kind}`
      item.textContent = entry.kind === "directory" ? `${entry.name}/` : entry.name
      list.append(item)
    }
    if (list.childElementCount === 0) list.textContent = "(empty)"
    result.append(heading, list)
    showNode(command, result)
  }

  async function printTree(command: string, rawPath: string) {
    await contentIndexReady
    const path = resolvePath(rawPath)
    if (path !== "" && !kbDirectories.has(path)) {
      showText(command, `tree: not a directory: ${rawPath || path}`, "error")
      return
    }

    const lines: string[] = [displayDirectory(path)]
    function walk(directory: string, prefix: string, depth: number) {
      const entries = directoryEntries(directory)
      entries.forEach((entry, index) => {
        const last = index === entries.length - 1
        lines.push(`${prefix}${last ? "└──" : "├──"} ${entry.name}${entry.kind === "directory" ? "/" : ""}`)
        if (entry.kind === "directory" && depth < 3) {
          walk(entry.path, `${prefix}${last ? "    " : "│   "}`, depth + 1)
        }
      })
    }
    walk(path, "", 0)
    const result = document.createElement("pre")
    result.className = "shell-tree"
    result.textContent = lines.join("\n")
    showNode(command, result)
  }

  async function readFile(command: string, rawPath: string) {
    await contentIndexReady
    const file = findFile(rawPath)
    if (!file) {
      const resolved = resolvePath(rawPath)
      const reason = kbDirectories.has(resolved) ? "is a directory" : "no such file"
      showText(command, `cat: ${reason}: ${rawPath}`, "error")
      return
    }
    if (file.template) {
      showTemplate(command, file.template)
      return
    }

    const record = file.record
    if (!record) return
    const result = document.createElement("div")
    result.className = "shell-result shell-cat"
    const path = document.createElement("p")
    path.className = "shell-path"
    path.textContent = `~/${file.path}`
    const heading = document.createElement("h2")
    heading.textContent = record.title ?? file.path.split("/").at(-1) ?? file.path
    const content = document.createElement("pre")
    content.className = "shell-cat-text"
    const fullText = record.content?.trim() || "(This page has no readable text.)"
    const limit = 50000
    content.textContent = fullText.length > limit ? `${fullText.slice(0, limit)}\n\n[output truncated]` : fullText
    const link = document.createElement("a")
    link.href = `/${encodeURI(record.slug)}`
    link.textContent = "open full page →"
    result.append(path, heading, content, link)
    showNode(command, result)
  }

  async function changeDirectory(command: string, rawPath: string) {
    await contentIndexReady
    const target = resolvePath(rawPath || "~")
    if (target !== "" && !kbDirectories.has(target)) {
      showText(command, `cd: no such directory: ${rawPath}`, "error")
      return
    }
    currentDirectory = target
    updatePrompt()
    showText(command, `working directory: ${displayDirectory()}`, "success")
  }

  async function openPath(command: string, rawPath: string) {
    await contentIndexReady
    const externalName = rawPath.toLowerCase().endsWith(".url")
      ? rawPath.toLowerCase()
      : `${rawPath.toLowerCase()}.url`
    if (externalLinks[externalName]) {
      window.location.assign(externalLinks[externalName])
      return
    }

    const file = findFile(rawPath)
    if (file?.template) {
      showTemplate(command, file.template)
      return
    }
    if (file?.record) {
      window.location.assign(`/${encodeURI(file.record.slug)}`)
      return
    }

    const target = resolvePath(rawPath)
    if (target === "kb") {
      window.location.assign("/kb")
      return
    }
    if (kbDirectories.has(target) && target.startsWith("kb/")) {
      window.location.assign(`/${encodeURI(target.slice(3))}/`)
      return
    }
    showText(command, `open: no such file or directory: ${rawPath}`, "error")
  }

  async function runCommand(rawCommand: string) {
    const command = normalizeShellCommand(rawCommand)
    if (!command) return

    history.push(command)
    historyIndex = history.length
    const firstSpace = command.indexOf(" ")
    const name = (firstSpace === -1 ? command : command.slice(0, firstSpace)).toLowerCase()
    const argument = firstSpace === -1 ? "" : command.slice(firstSpace + 1).trim()

    if (name === "clear") {
      output.replaceChildren()
      output.scrollTop = 0
      return
    }
    if (name === "help") {
      showTemplate(command, "help")
      return
    }
    if (name === "pwd") {
      showText(command, `/home/fengjie${currentDirectory ? `/${currentDirectory}` : ""}`, "success")
      return
    }
    if (name === "ls") {
      await listDirectory(command, argument)
      return
    }
    if (name === "tree") {
      await printTree(command, argument)
      return
    }
    if (name === "cd") {
      await changeDirectory(command, argument)
      return
    }
    if (name === "cat" || name === "less") {
      if (!argument) showText(command, `${name}: missing file operand`, "error")
      else await readFile(command, argument)
      return
    }
    if (name === "open") {
      if (!argument) showText(command, "open: missing path", "error")
      else await openPath(command, argument)
      return
    }

    const templateFile = templateAliases[name]
    if (templateFile) {
      showTemplate(command, templateFiles[templateFile])
      return
    }
    if (name === "kb" || name === "notes") {
      showTemplate(command, "kb")
      return
    }
    if (name === "judgement" || name === "judgment") {
      showTemplate(command, "judgement")
      return
    }
    if (name === "github" || name === "scholar") {
      window.location.assign(externalLinks[`${name}.url`])
      return
    }
    showText(command, `command not found: ${name}. Type help to list commands.`, "error")
  }

  async function completePath(commandName: string, rawPath: string) {
    await contentIndexReady
    const slashIndex = rawPath.lastIndexOf("/")
    const parentText = slashIndex === -1 ? "" : rawPath.slice(0, slashIndex + 1)
    const partialName = slashIndex === -1 ? rawPath : rawPath.slice(slashIndex + 1)
    const parent = resolvePath(parentText || ".")
    const entries = directoryEntries(parent).filter((entry) => {
      if (commandName === "cd") return entry.kind === "directory"
      return true
    })
    const matches = entries.filter((entry) =>
      entry.name.toLowerCase().startsWith(partialName.toLowerCase()),
    )
    if (matches.length === 0) return

    const completion = matches[0]
    input.value = `${commandName} ${parentText}${completion.name}${completion.kind === "directory" ? "/" : ""}`
    input.setSelectionRange(input.value.length, input.value.length)
    if (matches.length > 1) {
      showText(rawPath || commandName, `matches: ${matches.map((entry) => entry.name).join("  ")}`)
    }
  }

  function onSubmit(event: SubmitEvent) {
    event.preventDefault()
    const command = input.value
    input.value = ""
    void runCommand(command)
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === "Tab") {
      event.preventDefault()
      const value = normalizeShellCommand(input.value)
      const firstSpace = value.indexOf(" ")
      if (firstSpace === -1) {
        const matches = shellCommandNames.filter((command) => command.startsWith(value.toLowerCase()))
        if (matches.length > 0) {
          input.value = matches[0]
          input.setSelectionRange(input.value.length, input.value.length)
          if (matches.length > 1) showText(value, `matches: ${matches.join("  ")}`)
        }
      } else {
        const commandName = value.slice(0, firstSpace).toLowerCase()
        if (["cat", "less", "open", "cd", "ls", "tree"].includes(commandName)) {
          void completePath(commandName, value.slice(firstSpace + 1))
        }
      }
      return
    }

    if (event.key === "ArrowUp") {
      if (history.length === 0) return
      event.preventDefault()
      historyIndex = Math.max(0, historyIndex - 1)
      input.value = history[historyIndex]
      input.setSelectionRange(input.value.length, input.value.length)
    }
    if (event.key === "ArrowDown") {
      if (history.length === 0) return
      event.preventDefault()
      historyIndex = Math.min(history.length, historyIndex + 1)
      input.value = historyIndex === history.length ? "" : history[historyIndex]
    }
  }

  function onCommandClick(event: Event) {
    const button = event.currentTarget as HTMLButtonElement
    const command = button.dataset.command
    if (!command) return
    void runCommand(command)
    input.focus({ preventScroll: true })
  }

  updatePrompt()
  form.addEventListener("submit", onSubmit)
  input.addEventListener("keydown", onKeyDown)
  commandButtons.forEach((button) => button.addEventListener("click", onCommandClick))

  window.addCleanup(() => {
    form.removeEventListener("submit", onSubmit)
    input.removeEventListener("keydown", onKeyDown)
    commandButtons.forEach((button) => button.removeEventListener("click", onCommandClick))
  })
}

document.addEventListener("nav", setupHomeTerminal)
