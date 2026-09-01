const shellCommands = [
  "help",
  "about",
  "research",
  "publications",
  "education",
  "interests",
  "kb",
  "judgement",
  "open kb",
  "open judgement",
  "github",
  "scholar",
  "pwd",
  "whoami",
  "clear",
]

const shellAliases: Record<string, string> = {
  ls: "help",
  profile: "about",
  whoami: "about",
  focus: "research",
  pubs: "publications",
  publication: "publications",
  edu: "education",
  reading: "interests",
  notes: "kb",
  judgment: "judgement",
}

function normalizeShellCommand(value: string) {
  return value.trim().toLowerCase().replace(/^\/+/, "").replace(/\s+/g, " ")
}

function setupHomeTerminal() {
  const form = document.querySelector<HTMLFormElement>(".shell-command-line")
  const output = document.querySelector<HTMLElement>("#terminal-output")
  const input = form?.querySelector<HTMLInputElement>("#shell-command")
  if (!form || !output || !input) return

  const commandButtons = document.querySelectorAll<HTMLButtonElement>("[data-command]")
  const history: string[] = []
  let historyIndex = 0

  function promptLine(command: string) {
    const line = document.createElement("p")
    line.className = "shell-echo"
    const prompt = document.createElement("span")
    prompt.className = "shell-prompt"
    prompt.textContent = "fengjie@wise:~$"
    line.append(prompt, document.createTextNode(` ${command}`))
    return line
  }

  function appendTextResult(command: string, message: string, state = "normal") {
    const entry = document.createElement("div")
    entry.className = "shell-entry"
    entry.append(promptLine(command))
    const result = document.createElement("p")
    result.className = `shell-message shell-message-${state}`
    result.textContent = message
    entry.append(result)
    output.append(entry)
    entry.scrollIntoView({ block: "nearest" })
  }

  function appendTemplateResult(command: string, templateName: string) {
    const template = document.querySelector<HTMLElement>(
      `[data-terminal-template="${templateName}"]`,
    )
    const result = template?.firstElementChild?.cloneNode(true)
    if (!result) {
      appendTextResult(command, `missing output: ${templateName}`, "error")
      return
    }

    const entry = document.createElement("div")
    entry.className = "shell-entry"
    entry.append(promptLine(command), result)
    output.append(entry)
    entry.scrollIntoView({ block: "nearest" })
  }

  function runCommand(rawCommand: string) {
    const command = normalizeShellCommand(rawCommand)
    if (!command) return

    history.push(command)
    historyIndex = history.length
    const canonical = shellAliases[command] ?? command

    if (canonical === "clear") {
      output.replaceChildren()
      return
    }

    if (canonical === "pwd") {
      appendTextResult(command, "/home/fengjie", "success")
      return
    }

    if (canonical === "open kb") {
      appendTextResult(command, "Opening ~/knowledge-base…", "success")
      window.location.assign("/kb")
      return
    }

    if (canonical === "open judgement" || canonical === "open judgment") {
      appendTextResult(command, "Opening ~/my-judgement…", "success")
      window.location.assign("https://feng-jay.github.io/my-judgement/")
      return
    }

    if (canonical === "github" || canonical === "open github") {
      window.location.assign("https://github.com/Feng-Jay")
      return
    }

    if (canonical === "scholar" || canonical === "open scholar") {
      window.location.assign("https://scholar.google.com/citations?user=btcwJ_EAAAAJ&hl=en")
      return
    }

    if (shellCommands.includes(canonical)) {
      appendTemplateResult(command, canonical)
      return
    }

    appendTextResult(command, `command not found: ${command}. Type help to list commands.`, "error")
  }

  function onSubmit(event: SubmitEvent) {
    event.preventDefault()
    const command = input.value
    input.value = ""
    runCommand(command)
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === "Tab") {
      const partial = normalizeShellCommand(input.value)
      if (!partial) return
      const matches = shellCommands.filter((command) => command.startsWith(partial))
      if (matches.length > 0) {
        event.preventDefault()
        input.value = matches[0]
        input.setSelectionRange(input.value.length, input.value.length)
        if (matches.length > 1) {
          appendTextResult(partial, `matches: ${matches.join("  ")}`)
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
    runCommand(command)
    input.focus({ preventScroll: true })
  }

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
