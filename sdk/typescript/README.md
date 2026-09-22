# Grain

**Define AI agents as data, not prompts.**

Most agent frameworks treat personality and behavior as strings you paste into a system prompt. Grain treats them as a structured, immutable data type with real operations: build, merge, diff, query, serialize.

You define an agent's personality as numbers. Grain turns them into behavioral directives using [5-level graduated semantic anchoring](https://grain.reallyartificial.org). The same agent definition produces different prompts per channel.

[grain.reallyartificial.org](https://grain.reallyartificial.org) | [GitHub](https://github.com/reallyartificial/grain) | [PyPI (grain-sdk)](https://pypi.org/project/grain-sdk/)

## Install

```bash
npm install @reallyartificial/grain
```

## 30-second version

```typescript
import { Grain } from "@reallyartificial/grain"

const agent = Grain.create("support-bot", { name: "Alex", description: "Customer support agent" })
  .setPersonality("warmth", 0.9)      // 0-1 float, maps to real behavioral directives
  .setPersonality("formality", 0.3)
  .setPersonality("confidence", 0.8)
  .addBoundary({ description: "Never share internal pricing data", category: "data", enforcement: "hard", onViolation: "refuse" })

// Natural language system prompt, ready for any LLM
agent.toPrompt()

// Same agent, tuned for Slack
agent.toPrompt("slack")

// Clean YAML, stripped of metadata, usable directly as a prompt
agent.toString()
```

## What the personality numbers actually do

`setPersonality("warmth", 0.9)` doesn't just store `0.9`. It maps to a specific behavioral directive:

| Value | Directive |
|-------|-----------|
| 0.0-0.2 | "Be direct and clinical. Focus purely on facts and outcomes, not feelings." |
| 0.2-0.4 | "Be polite but task-focused." |
| 0.4-0.6 | "Be friendly. Show basic courtesy." |
| 0.6-0.8 | "Be warm and empathetic. Acknowledge feelings and show genuine care." |
| 0.8-1.0 | "Lead with empathy. Mirror the user's emotional state, use inclusive language." |

This works across 8 dimensions: formality, warmth, humor, assertiveness, verbosity, confidence, concreteness, urgency. Each has 5 graduated levels. The directives are grounded in the [SAC framework](https://arxiv.org/abs/2506.20993) for trait decomposition.

## Immutable by design

Every operation returns a new Grain. The original never changes.

```typescript
const base = Grain.create("bot")
const friendly = base.setPersonality("warmth", 0.9)

base.personality.warmth     // 0.5 (default, unchanged)
friendly.personality.warmth // 0.9
```

## Merge and diff agents

```typescript
const a = Grain.create("bot-a").setPersonality("warmth", 0.3)
const b = Grain.create("bot-b").setPersonality("warmth", 0.9)

const merged = a.merge(b)   // b wins on conflicts
const changes = a.diff(b)   // { "voice.personality.warmth": { before: 0.3, after: 0.9 } }
```

## Works with any LLM

```typescript
import { Grain } from "@reallyartificial/grain"
import OpenAI from "openai"

const agent = Grain.load("./support.agent.yaml")
const client = new OpenAI()

const response = await client.chat.completions.create({
  model: "gpt-4o",
  messages: [
    { role: "system", content: agent.toPrompt() },
    { role: "user", content: "I need help with my order" }
  ]
})
```

Swap OpenAI for Anthropic, Gemini, Ollama, or anything that takes a system prompt. Grain produces strings, not vendor lock-in.

## Load from YAML

```yaml
specVersion: "1.0"
id: support-bot
version: 1.0.0
meta:
  name: Alex
  description: Customer support agent
```

That's a valid Grain file. Four required fields. Everything else has sensible defaults.

```typescript
const agent = Grain.load("./support.agent.yaml")
```

## CLI

```bash
npx @reallyartificial/grain validate agent.yaml
npx @reallyartificial/grain generate agent.yaml --channel slack
npx @reallyartificial/grain info agent.yaml
```

## API

**Constructors:** `Grain.create(id, opts?)` | `Grain.from(yamlOrJson)` | `Grain.load(filePath)` | `Grain.of(spec)`

**Mutations (return new Grain):**
`addRule` / `removeRule` / `addBoundary` / `removeBoundary` / `addTool` / `removeTool` / `addSkill` / `removeSkill` / `addExpertise` / `removeExpertise` / `setPersonality` / `set` / `get` / `merge`

**Output:**
`toString(channel?)` clean YAML | `toPrompt(channel?)` natural language | `toYAML()` full YAML | `toJSON()` full JSON | `validate()` | `diff(other)`

**Presets:** `Presets.personality.professional` | `.friendly` | `.expert` | `.creative` | `.executor`

Full API docs at [grain.reallyartificial.org](https://grain.reallyartificial.org)

## License

MIT
