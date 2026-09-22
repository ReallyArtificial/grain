#!/usr/bin/env node
import { Grain } from "./grain.js"

const args = process.argv.slice(2)
const command = args[0]

function printHelp() {
  console.log(`grain — CLI for Grain agent definitions

Usage:
  grain validate <file>              Validate a .agent.yaml file
  grain generate <file> [--channel]  Generate system prompt
  grain info <file>                  Show agent summary
  grain builder [--port N]           Open visual agent builder

Examples:
  grain validate my-agent.agent.yaml
  grain generate my-agent.agent.yaml --channel slack
  grain info my-agent.agent.yaml
  grain builder`)
}

function validate(file: string) {
  try {
    const g = Grain.load(file)
    const errors = g.validate()
    if (errors.length > 0) {
      console.error(`Validation warnings for ${file}:`)
      for (const err of errors) {
        console.error(`  ${err.path}: ${err.message}`)
      }
      process.exit(1)
    }
    console.log(`${file} is valid`)
  } catch (e) {
    console.error(e instanceof Error ? e.message : String(e))
    process.exit(1)
  }
}

function generate(file: string, channel?: string) {
  try {
    const g = Grain.load(file)
    const prompt = g.toPrompt(channel)
    console.log(prompt)
  } catch (e) {
    console.error(e instanceof Error ? e.message : String(e))
    process.exit(1)
  }
}

function info(file: string) {
  try {
    const g = Grain.load(file)
    console.log(`Name:        ${g.name}`)
    console.log(`ID:          ${g.id}`)
    console.log(`Version:     ${g.version}`)
    console.log(`Description: ${g.data.meta.description}`)
    console.log(`Role:        ${g.data.identity.role}`)

    if (g.data.voice.channelOverrides) {
      const channels = Object.keys(g.data.voice.channelOverrides)
      console.log(`Channels:    ${channels.join(", ")}`)
    }

    const p = g.personality
    const traits: string[] = []
    if (p.formality > 0.7) traits.push("formal")
    else if (p.formality < 0.3) traits.push("casual")
    if (p.warmth > 0.7) traits.push("warm")
    if (p.humor > 0.5) traits.push("humorous")
    if (p.assertiveness > 0.7) traits.push("assertive")
    if (p.confidence > 0.7) traits.push("confident")
    if (p.concreteness > 0.7) traits.push("concrete")
    if (traits.length) {
      console.log(`Personality: ${traits.join(", ")}`)
    }

    console.log(`Rules:       ${g.rules.length}`)
    console.log(`Boundaries:  ${g.boundaries.length}`)
    if (g.tools.length) {
      console.log(`Tools:       ${g.tools.map(t => t.id).join(", ")}`)
    }
  } catch (e) {
    console.error(e instanceof Error ? e.message : String(e))
    process.exit(1)
  }
}

if (!command || command === "--help" || command === "-h") {
  printHelp()
  process.exit(0)
}

if (command === "builder") {
  const portIdx = args.indexOf("--port")
  const port = portIdx !== -1 ? parseInt(args[portIdx + 1]) : undefined
  const { startBuilder } = await import("./builder-server.js")
  startBuilder(port)
} else {
  const file = args[1]
  if (!file) {
    console.error(`Error: missing file argument\n`)
    printHelp()
    process.exit(1)
  }

  switch (command) {
    case "validate":
      validate(file)
      break
    case "generate": {
      const channelIdx = args.indexOf("--channel")
      const channel = channelIdx !== -1 ? args[channelIdx + 1] : undefined
      generate(file, channel)
      break
    }
    case "info":
      info(file)
      break
    default:
      console.error(`Unknown command: ${command}\n`)
      printHelp()
      process.exit(1)
  }
}
