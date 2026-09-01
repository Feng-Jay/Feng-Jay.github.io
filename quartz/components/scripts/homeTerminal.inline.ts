const terminalCommands = [
  "help",
  "about",
  "education",
  "publications",
  "research",
  "interests",
  "kb",
  "judgement",
  "top",
  "open kb",
  "open judgement",
  "github",
  "scholar",
  "clear",
]

const terminalTargets: Record<string, string> = {
  about: "profile-title",
  profile: "profile-title",
  whoami: "profile-title",
  education: "education-title",
  edu: "education-title",
  publications: "publications-title",
  publication: "publications-title",
  pubs: "publications-title",
  research: "focus-title",
  focus: "focus-title",
  interests: "reading-title",
  reading: "reading-title",
  kb: "kb-title",
  notes: "kb-title",
  judgement: "judgement-title",
  judgment: "judgement-title",
  top: "home",
  home: "home",
}

function normalizeTerminalCommand(value: string) {
  return value.trim().toLowerCase().replace(/^\/+/, "").replace(/\s+/g, " ")
}

function setupHomeTerminal() {
  const form = document.querySelector<HTMLFormElement>(".cv-console-form")
  if (!form) return

  const input = form.querySelector<HTMLInputElement>("#cv-command-input")
  const response = document.querySelector<HTMLElement>(".cv-console-response")
  const commandButtons = document.querySelectorAll<HTMLButtonElement>(".cv-command-menu [data-command]")
  if (!input || !response) return

  const commandHistory: string[] = []
  let historyIndex = 0

  function writeResponse(message: string, state = "ready") {
    response.textContent = message
    response.dataset.state = state
  }

  function jumpTo(targetId: string, label: string) {
    const target = document.getElementById(targetId)
    if (!target) {
      writeResponse(`Section not found: ${label}`, "error")
      return
    }

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" })
    window.history.replaceState(null, "", targetId === "home" ? window.location.pathname : `#${targetId}`)
    writeResponse(`Jumped to ./${label}`, "success")
  }

  function runCommand(rawCommand: string) {
    const command = normalizeTerminalCommand(rawCommand)
    if (!command) {
      writeResponse("Enter a command, or type help to see the command list.", "error")
      return
    }

    commandHistory.push(command)
    historyIndex = commandHistory.length

    if (command === "help" || command === "ls") {
      writeResponse(
        "about · education · publications · research · interests · kb · judgement · top · open kb · open judgement · github · scholar · clear",
      )
      return
    }

    if (command === "pwd") {
      writeResponse("/home/fengjie", "success")
      return
    }

    if (command === "clear") {
      writeResponse("")
      return
    }

    if (command === "open kb") {
      writeResponse("Opening the Quartz knowledge base…", "success")
      window.location.assign("/kb")
      return
    }

    if (command === "open judgement" || command === "open judgment") {
      writeResponse("Opening My Judgement…", "success")
      window.location.assign("https://feng-jay.github.io/my-judgement/")
      return
    }

    if (command === "github" || command === "open github") {
      window.location.assign("https://github.com/Feng-Jay")
      return
    }

    if (command === "scholar" || command === "open scholar") {
      window.location.assign("https://scholar.google.com/citations?user=btcwJ_EAAAAJ&hl=en")
      return
    }

    const targetId = terminalTargets[command]
    if (targetId) {
      jumpTo(targetId, command)
      return
    }

    writeResponse(`command not found: ${command}. Type help to list commands.`, "error")
  }

  function onSubmit(event: SubmitEvent) {
    event.preventDefault()
    const command = input.value
    input.value = ""
    runCommand(command)
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === "Tab") {
      const partial = normalizeTerminalCommand(input.value)
      if (!partial) return
      const matches = terminalCommands.filter((command) => command.startsWith(partial))
      if (matches.length > 0) {
        event.preventDefault()
        input.value = matches[0]
        input.setSelectionRange(input.value.length, input.value.length)
        if (matches.length > 1) writeResponse(`Matches: ${matches.join(" · ")}`)
      }
      return
    }

    if (event.key === "ArrowUp") {
      if (commandHistory.length === 0) return
      event.preventDefault()
      historyIndex = Math.max(0, historyIndex - 1)
      input.value = commandHistory[historyIndex]
    }

    if (event.key === "ArrowDown") {
      if (commandHistory.length === 0) return
      event.preventDefault()
      historyIndex = Math.min(commandHistory.length, historyIndex + 1)
      input.value = historyIndex === commandHistory.length ? "" : commandHistory[historyIndex]
    }
  }

  function onCommandClick(event: Event) {
    const button = event.currentTarget as HTMLButtonElement
    const command = button.dataset.command
    if (!command) return
    input.value = command
    runCommand(command)
    input.value = ""
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
