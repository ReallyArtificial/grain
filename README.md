# Grain

**Define AI agents as data, not prompts.**

Grain is a structured, immutable data type for an AI agent: identity, an eight-dimension personality, typed behaviour rules, hard boundaries, tools, and per-channel overrides. You define the agent once, in a `.agent.yaml` file or in code, and Grain turns it into a system prompt for whichever channel and model you are using. The same definition can be validated, diffed, merged, tested and versioned like any other data.

[grain.reallyartificial.org](https://grain.reallyartificial.org) · [npm](https://www.npmjs.com/package/@reallyartificial/grain) · [PyPI](https://pypi.org/project/grain-sdk/) · by [ReallyArtificial](https://github.com/ReallyArtificial) · MIT

## The problem

Every agent starts as a system prompt. Then it grows:

```python
system_prompt = """You are Alex, a friendly support agent.
Be warm but professional. Use emoji on Slack but not email.
If the user is frustrated, be extra empathetic.
Never share internal details. Never process refunds over $500.
If you're not confident, escalate to a human.
Oh and on weekends use a more casual tone..."""
```

You cannot diff it, test it, version it, or share behaviour across agents. With ten agents on five channels it is string soup.

## The same agent as data

```yaml
# customer-support.agent.yaml
$schema: https://grain.reallyartificial.org/v1/schema.json
specVersion: "1.0"
id: acme-support-agent
version: 2.1.0
meta:
  name: Acme Support Agent
  description: Customer-facing support agent

identity:
  name: Alex
  role: Senior Support Specialist
  purpose:
    primary: Resolve customer issues quickly while maintaining satisfaction

voice:
  personality:
    formality: 0.5
    warmth: 0.8
    humor: 0.2
    assertiveness: 0.6
    verbosity: 0.4
    confidence: 0.7
    concreteness: 0.9
    urgency: 0.7
  channelOverrides:
    slack: { formality: 0.3, emojiUsage: "frequently" }
    email: { formality: 0.8, emojiUsage: "never" }

behavior:
  rules:
    - id: frustrated-user
      priority: 10
      condition: { type: when-sentiment, sentiment: frustrated }
      action: { type: respond-with-style, style: { warmth: 1.0 } }
  boundaries:
    - description: Never process refunds over $500 without human approval
      enforcement: hard
```

One file. Diffable. Testable. It generates the right prompt for each channel.

## Install

```bash
npm install @reallyartificial/grain     # TypeScript / JavaScript, includes the `grain` CLI
pip install grain-sdk                   # Python
```

## 30-second version

```typescript
import { Grain } from "@reallyartificial/grain"

const agent = Grain.create("support-bot", { name: "Alex", description: "Customer support agent" })
  .setPersonality("warmth", 0.9)
  .setPersonality("formality", 0.3)
  .addBoundary({ description: "Never share internal pricing data", category: "data", enforcement: "hard", onViolation: "refuse" })

agent.toPrompt()          // natural-language system prompt, ready for any LLM
agent.toPrompt("slack")   // same agent, tuned for Slack
agent.toString()          // clean YAML with metadata stripped, usable as a prompt

const fromFile = Grain.load("./customer-support.agent.yaml")
```

```python
from grain import Grain

agent = (
    Grain.create("support-bot", name="Alex", description="Customer support agent")
    .set_personality("warmth", 0.9)
    .set_personality("formality", 0.3)
    .add_boundary({"description": "Never share internal pricing data", "category": "data", "enforcement": "hard", "onViolation": "refuse"})
)

agent.to_prompt()
agent.to_prompt("slack")
from_file = Grain.load("./customer-support.agent.yaml")
```

Every operation returns a new Grain. The original never changes, so a base agent can be specialised into variants without side effects, and `diff(other)` shows exactly what differs.

## What the personality numbers do

`setPersonality("warmth", 0.9)` does not just store a float. Each of the eight dimensions maps to five graduated behavioural directives, so the prompt says something specific at every level:

| Warmth | Directive |
|--------|-----------|
| 0.0 to 0.2 | Be direct and clinical. Focus purely on facts and outcomes, not feelings. |
| 0.2 to 0.4 | Be polite but task-focused. |
| 0.4 to 0.6 | Be friendly. Show basic courtesy. |
| 0.6 to 0.8 | Be warm and empathetic. Acknowledge feelings and show genuine care. |
| 0.8 to 1.0 | Lead with empathy. Mirror the user's emotional state, use inclusive language. |

The eight dimensions are formality, warmth, humor, assertiveness, verbosity, confidence, concreteness and urgency. Trait decomposition follows the [SAC framework](https://arxiv.org/abs/2506.20993).

## Channel overrides

```yaml
voice:
  personality: { formality: 0.5, warmth: 0.8 }
  channelOverrides:
    slack: { formality: 0.3, emojiUsage: frequently, structure: bullets }
    email: { formality: 0.8, verbosity: 0.7, emojiUsage: never }
```

`toPrompt("slack")` is casual and emoji-friendly. `toPrompt("email")` is formal and structured. One definition, channel-appropriate behaviour.

## Typed rules and boundaries

```yaml
behavior:
  rules:
    - id: low-confidence-escalate
      priority: 20
      condition: { type: when-confidence-below, threshold: 0.3 }
      action: { type: escalate, target: human-support-lead, reason: "Low confidence" }
    - id: billing-confirmation
      priority: 15
      condition: { type: when-topic, topics: [refund, cancellation] }
      action: { type: require-confirmation }
  boundaries:
    - description: Never process refunds over $500 without human approval
      enforcement: hard
```

Rules are sorted by priority and rendered as natural language in the generated prompt. Boundaries are rendered as hard constraints.

## CLI

```bash
grain validate my-agent.agent.yaml
grain generate my-agent.agent.yaml --channel slack
grain info     my-agent.agent.yaml
```

## Start minimal

Four fields make a valid agent. Add sections as it grows.

```yaml
specVersion: "1.0"
id: faq-bot
version: 1.0.0
meta: { name: FAQ Bot, description: Answers frequently asked questions }
```

| Tier | Required | Use case |
|------|----------|----------|
| Minimal | `specVersion`, `id`, `version`, `meta` | Prototypes, simple bots |
| Standard | plus `identity`, `voice` | Most production agents |
| Full | plus `cognition`, `behavior`, `memory`, tools, skills | Complex multi-channel agents |

## The format

The file format Grain wraps is called AgentSpec. It is a language-agnostic JSON Schema (Draft 2020-12) at [`spec/agentspec.schema.json`](./spec/agentspec.schema.json), described in [`spec/SPECIFICATION.md`](./spec/SPECIFICATION.md), and served at `https://grain.reallyartificial.org/v1/schema.json` for editor autocomplete:

```yaml
$schema: https://grain.reallyartificial.org/v1/schema.json
```

## Repository layout

```
spec/            AgentSpec schema and specification
sdk/typescript/  @reallyartificial/grain: Grain class, presets, CLI
sdk/python/      grain-sdk: the same API in Python
examples/        four .agent.yaml files, from minimal to full
builder/         Next.js visual builder that produces .agent.yaml
api/             Vercel function behind grain.reallyartificial.org/api/build
docs/            static site and the hosted schema
```

## Development

```bash
cd sdk/typescript && npm install && npm test     # 60 tests
cd sdk/python && python3 -m venv .venv && .venv/bin/pip install -e '.[dev]' && .venv/bin/pytest
cd builder && npm install && npm run dev         # visual builder at localhost:3000
```

## License

MIT
