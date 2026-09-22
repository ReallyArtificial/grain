# AgentSpec Specification v1.0

A universal, structured data format for describing AI agents.

## Overview

AgentSpec defines a portable, language-agnostic format for specifying AI agent behavior. Agents are defined in `.agent.yaml` (or `.agent.json`) files and validated against the JSON Schema at `agentspec.schema.json`.

### Design Principles

1. **Declarative over imperative** — describe WHAT the agent is, not HOW to implement it
2. **Quantified over qualitative** — measurable 0-1 parameters instead of free-text where possible
3. **Composable** — agents can extend/inherit from other agent specs
4. **Runtime-agnostic** — works with any framework (LangChain, CrewAI, custom, etc.)
5. **Channel-aware** — same agent adapts to different communication channels
6. **Bounded adaptation** — agents can self-modify within defined drift limits
7. **Validatable** — every field has a type, range, or enum constraint

### File Format

Agents are defined in YAML (`.agent.yaml`) or JSON (`.agent.json`). YAML is preferred for human authoring. The file should reference the schema for editor support:

```yaml
$schema: https://grain.reallyartificial.org/v1/schema.json
specVersion: "1.0"
id: my-agent
version: 1.0.0
# ...
```

---

## Top-Level Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `specVersion` | `"1.0"` | Yes | Schema version for forward compatibility |
| `id` | `string` | Yes | Unique identifier, kebab-case (`^[a-z0-9-]+$`) |
| `version` | `string` | Yes | Semver version of this agent definition |
| `extends` | `string \| {id, version}` | No | Inherit from another AgentSpec |
| `meta` | `AgentMeta` | Yes | Human-readable metadata |
| `identity` | `AgentIdentity` | Yes | Who the agent IS |
| `voice` | `AgentVoice` | Yes | How the agent SOUNDS |
| `cognition` | `AgentCognition` | Yes | How the agent THINKS |
| `capabilities` | `AgentCapabilities` | Yes | What the agent CAN DO |
| `behavior` | `AgentBehavior` | Yes | How the agent BEHAVES |
| `memory` | `AgentMemory` | Yes | What the agent REMEMBERS |
| `communication` | `AgentCommunication` | Yes | How the agent COMMUNICATES |
| `adaptation` | `AgentAdaptation` | Yes | How the agent EVOLVES |
| `observability` | `AgentObservability` | Yes | How the agent is OBSERVED |

---

## Sections

### Meta

Human-readable metadata about the agent.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | `string` | Yes | Human-readable agent name |
| `description` | `string` | Yes | What this agent does |
| `author` | `string` | No | Author or organization |
| `license` | `string` | No | License identifier |
| `tags` | `string[]` | No | Searchable tags |
| `url` | `string` (URI) | No | Documentation or homepage URL |
| `model` | `ModelPreference` | No | Model requirements |

**ModelPreference:**

| Field | Type | Required |
|-------|------|----------|
| `minimumTier` | `"small" \| "medium" \| "large" \| "frontier"` | Yes |
| `preferredProvider` | `string` | No |
| `preferredModel` | `string` | No |
| `minimumContext` | `integer` | No |
| `requiresToolCalling` | `boolean` | No |
| `requiresMultimodal` | `boolean` | No |

### Identity

Who the agent IS — identity and purpose.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | `string` | Yes | Conversational name |
| `role` | `string` | Yes | One-line role description |
| `purpose.primary` | `string` | Yes | Core purpose |
| `purpose.secondary` | `string[]` | No | Additional objectives |
| `expertise` | `DomainExpertise[]` | Yes | Domain expertise with proficiency |
| `relationships` | `AgentRelationship[]` | No | Relationships to other agents |

**DomainExpertise:** `{domain, proficiency: UnitFloat, subtopics?: string[]}`
- `proficiency`: 0 = awareness, 0.5 = working knowledge, 1.0 = deep expertise

**AgentRelationship:** `{target, type, permissions?}`
- `type`: `reports-to | delegates-to | collaborates-with | supervises | escalates-to`
- `permissions`: `read | write | execute | delegate`

### Voice

How the agent SOUNDS — quantified personality and language style.

#### PersonalityVector

All values are **UnitFloat** (0-1 inclusive). This is the core innovation: personality is quantified, not described in prose.

| Dimension | 0 | 1 | Description |
|-----------|---|---|-------------|
| `formality` | casual/informal | highly formal | Tone register |
| `warmth` | cold/clinical | warm/empathetic | Emotional temperature |
| `humor` | dead serious | playful/witty | Levity level |
| `assertiveness` | passive/reactive | proactive/assertive | Initiative level |
| `verbosity` | brief/terse | detailed/verbose | Response length |
| `confidence` | cautious/hedging | bold/decisive | Certainty expression |
| `concreteness` | abstract/theoretical | concrete/practical | Specificity level |
| `urgency` | patient/thorough | urgent/action-oriented | Speed vs quality |

#### Big Five (OCEAN) Mapping

The 8-dimension PersonalityVector maps to the Big Five personality traits used in psychology:

| Big Five Trait | AgentSpec Dimensions | Mapping |
|---------------|---------------------|---------|
| **Openness** | `humor` + `concreteness` (inverse) | High openness = high humor, low concreteness |
| **Conscientiousness** | `formality` + `urgency` (inverse) + `concreteness` | High conscientiousness = formal, thorough, concrete |
| **Extraversion** | `warmth` + `assertiveness` + `verbosity` | High extraversion = warm, assertive, verbose |
| **Agreeableness** | `warmth` + `assertiveness` (inverse) | High agreeableness = warm, not assertive |
| **Neuroticism** | `confidence` (inverse) + `urgency` | High neuroticism = low confidence, high urgency |

This mapping is informational. The 8-dimension model is optimized for prompt generation, while Big Five provides scientific grounding for research and comparison.

#### LanguageStyle

| Field | Values | Description |
|-------|--------|-------------|
| `locale` | BCP 47 tag | Primary language (e.g., `en-US`) |
| `sentenceLength` | `short \| medium \| long` | Sentence style |
| `jargonLevel` | `none \| moderate \| heavy` | Technical terminology usage |
| `emojiUsage` | `never \| sparingly \| frequently` | Emoji/kaomoji usage |
| `structure` | `prose \| bullets \| mixed` | Response structure |
| `usesAnalogies` | `boolean` | Whether to use analogies |
| `addressing` | `first-person \| third-person \| neutral` | Self-reference style |

#### Channel Overrides

`channelOverrides` is a map of channel ID to partial `PersonalityVector` + `LanguageStyle` fields. Overrides are merged on top of the base values.

### Cognition

How the agent THINKS — reasoning and decision patterns.

**ReasoningStyle:**

| Field | Values |
|-------|--------|
| `primary` | `analytical \| creative \| systematic \| intuitive \| socratic` |
| `showReasoning` | `boolean` |
| `analysisDepth` | `surface \| moderate \| deep \| exhaustive` |
| `multiPerspective` | `boolean` |

**DecisionMaking:**

| Field | Type | Description |
|-------|------|-------------|
| `speed` | UnitFloat | 0 = deliberate, 1 = snap |
| `evidenceThreshold` | UnitFloat | 0 = little evidence, 1 = extensive |
| `reversibilityPreference` | enum | `prefer-reversible \| neutral \| bias-to-action` |
| `autonomy` | enum | `always-ask \| ask-for-major \| decide-unless-ambiguous \| fully-autonomous` |

**UncertaintyHandling:**

| Field | Type |
|-------|------|
| `lowConfidenceAction` | `ask \| hedge \| state-assumption \| refuse` |
| `confidenceFloor` | UnitFloat |
| `communicateUncertainty` | `boolean` |
| `conflictResolution` | `ask-user \| use-most-recent \| use-most-authoritative \| present-both` |

**TaskStrategy:**

| Field | Type |
|-------|------|
| `decomposition` | `top-down \| bottom-up \| iterative` |
| `maxParallelism` | `integer >= 1` |
| `checkpointing` | `boolean` |
| `blockingStrategy` | `wait \| skip-and-return \| find-alternative \| escalate` |

### Capabilities

What the agent CAN DO — tools, skills, knowledge.

All sub-fields (`tools`, `skills`, `knowledge`, `outputFormats`) are optional arrays.

**ToolCapability:** `{id, usage, requiresConfirmation?, rateLimit?}`

**SkillDefinition:** `{name, description, requiredTools?, steps?, successCriteria?}`

**KnowledgeSource:** `{id, type, domain, freshness?, priority?}`
- `type`: `embedded | retrieval | api | file-system | database`

**OutputFormat:** `{format, condition?}` — format is a MIME type string.

### Behavior

How the agent BEHAVES — typed rules, boundaries, triggers.

#### BehaviorRule

Rules are typed, conditional instructions — NOT free-text. Each rule has:

| Field | Type | Required |
|-------|------|----------|
| `id` | `string` | Yes |
| `condition` | `RuleCondition` | Yes |
| `action` | `RuleAction` | Yes |
| `priority` | `integer` | No |
| `overridable` | `boolean` | No |

**RuleCondition types:**
- `always` — always applies
- `when-topic` — when discussing specific topics
- `when-sentiment` — when user sentiment matches (`positive | negative | neutral | frustrated`)
- `when-context` — when in a specific context
- `when-user-role` — when user has specific roles
- `when-capability-missing` — when a capability is unavailable
- `when-confidence-below` — when confidence drops below threshold
- `compound` — `AND`/`OR` composition of other conditions

**RuleAction types:**
- `respond-with-style` — adjust personality parameters
- `use-tool` — invoke a specific tool
- `escalate` — escalate to target with reason
- `refuse` — decline with message
- `redirect` — redirect to another agent/target
- `adjust-depth` — change analysis depth
- `require-confirmation` — ask for confirmation
- `log-event` — log an event
- `custom` — custom handler

#### Boundaries

Hard or soft limits the agent must respect.

| Field | Type | Required |
|-------|------|----------|
| `description` | `string` | Yes |
| `category` | `content \| action \| data \| scope \| safety` | Yes |
| `enforcement` | `hard \| soft` | Yes |
| `onViolation` | `refuse \| warn \| redirect \| escalate` | Yes |
| `message` | `string` | No |

#### Escalation Policy

| Field | Type | Required |
|-------|------|----------|
| `conditions` | `EscalationCondition[]` | Yes |
| `defaultTarget` | `string` | Yes |
| `handoffStrategy` | `full-transcript \| summary \| structured-handoff` | Yes |
| `maxRetries` | `integer` | No |

### Memory

What the agent REMEMBERS — retention and context management.

**RetentionPolicy:** `{category, duration, days?, maxItems?, priority?}`
- `category`: `user-preferences | conversation-history | task-state | learned-patterns | corrections | facts`
- `duration`: `conversation | session | days | permanent`

**ContextStrategy:** `{overflow, prioritize, autoSummarize}`
- `overflow`: `summarize | sliding-window | smart-select | truncate`
- `prioritize`: array of `recent | user-stated | task-relevant | corrections`

**StateSchema:** `{key, type, description, defaultValue?, agentWritable}`

### Communication

How the agent COMMUNICATES — channels, formats, protocols.

**ChannelConfig:** `{channel, enabled, voiceOverrides?, constraints?}`

**InputProcessing:** `{languages, typoTolerance, ambiguityResolution, modalities}`

**OutputProcessing:** `{defaultFormat, citations, maxLength?, structuredOutput}`

**InterAgentConfig:** `{protocols, exposedCapabilities, requestableCapabilities, auth?}`

### Adaptation

How the agent EVOLVES — bounded self-modification.

**DriftBound:** `{parameter, maxDrift, driftRate, resetsPerConversation}`
- `parameter`: dot-path to the parameter (e.g., `voice.personality.warmth`)
- `maxDrift`: UnitFloat — maximum absolute drift from original value
- `driftRate`: `immediate | gradual | slow`

**LearningConfig:** `{sources, minSamples, requiresApproval}`

**FeedbackConfig:** `{collection, application, conflictResolution}`

### Observability

How the agent is OBSERVED — logging, metrics, success criteria.

**LoggingConfig:** `{level, alwaysLog, conversationLogging, piiHandling}`

**MetricDefinition:** `{name, description, type, event}`
- `type`: `counter | gauge | histogram | rate`

**SuccessCriterion:** `{description, metric, target: {operator, value}, window?}`

---

## Prompt Generation Algorithm

The canonical algorithm for converting an AgentSpec into a system prompt. All conforming SDKs MUST implement this algorithm to ensure identical output across languages.

### Input

- `spec`: A validated AgentSpec object
- `channel` (optional): Channel identifier for channel-specific overrides

### Algorithm

```
function generateSystemPrompt(spec, channel):
  sections = []

  // 1. Identity Section
  sections.push(generateIdentity(spec))

  // 2. Voice Section (channel-aware)
  sections.push(generateVoice(spec, channel))

  // 3. Cognition Section
  sections.push(generateCognition(spec))

  // 4. Behavior Rules Section
  sections.push(generateBehaviorRules(spec))

  // 5. Boundaries Section
  sections.push(generateBoundaries(spec))

  return join(sections, "\n\n")  // double newline between sections
```

### 1. Identity Section

```
function generateIdentity(spec):
  lines = []
  id = spec.identity

  lines.push("You are {id.name}, a {id.role}.")
  lines.push("Your primary purpose: {id.purpose.primary}")

  if id.purpose.secondary is not empty:
    lines.push("Secondary objectives: {join(id.purpose.secondary, '; ')}")

  expertAreas = [e.domain for e in id.expertise where e.proficiency > 0.7]
  if expertAreas is not empty:
    lines.push("You have deep expertise in: {join(expertAreas, ', ')}.")

  return join(lines, "\n")
```

### 2. Voice Section (Channel Override Resolution)

```
function generateVoice(spec, channel):
  // Start with base personality and language
  personality = copy(spec.voice.personality)
  language = copy(spec.voice.language)

  // Apply channel overrides by merging on top
  if channel is not null AND spec.voice.channelOverrides[channel] exists:
    override = spec.voice.channelOverrides[channel]
    merge(personality, override)  // override fields win
    merge(language, override)     // override fields win

  lines = ["## Communication Style"]
  lines.push(...personalityToDirectives(personality))
  lines.push(...languageToDirectives(language))

  return join(lines, "\n")
```

**Channel Override Resolution Rules:**
1. Start with base `personality` and `language` values
2. If a channel is specified and has overrides, merge override fields on top
3. Only fields present in the override are changed; unspecified fields keep base values
4. This is a shallow merge — each field is replaced entirely

### 3. Personality-to-Directives Mapping

Each personality dimension maps to a natural language directive based on thresholds:

```
function personalityToDirectives(p):
  directives = []

  // Formality
  if p.formality > 0.7: "Maintain a professional, formal tone at all times."
  else if p.formality < 0.3: "Be casual and conversational. Skip formalities."
  else: "Use a balanced tone — professional but approachable."

  // Warmth
  if p.warmth > 0.7: "Be warm and empathetic. Acknowledge feelings and show care."
  else if p.warmth < 0.3: "Be direct and clinical. Focus on facts, not feelings."
  // else: no directive (neutral warmth needs no instruction)

  // Humor
  if p.humor > 0.7: "Use humor, wit, and playfulness when appropriate."
  else if p.humor < 0.2: "Stay serious. Avoid jokes or playful language."

  // Assertiveness
  if p.assertiveness > 0.7: "Be proactive. Make recommendations and push the conversation forward."
  else if p.assertiveness < 0.3: "Be reactive. Wait for direction. Ask before acting."

  // Verbosity
  if p.verbosity > 0.7: "Provide detailed, thorough explanations."
  else if p.verbosity < 0.3: "Keep responses brief and to the point. No fluff."

  // Confidence
  if p.confidence > 0.7: "Be decisive. State things clearly without excessive hedging."
  else if p.confidence < 0.3: "Communicate uncertainty openly. Use qualifiers when unsure."

  // Concreteness
  if p.concreteness > 0.7: "Use concrete examples, specific numbers, and actionable steps."
  else if p.concreteness < 0.3: "Focus on concepts, frameworks, and high-level thinking."

  // Urgency
  if p.urgency > 0.7: "Move quickly. Prioritize action over perfection."
  else if p.urgency < 0.3: "Take time to be thorough. Quality over speed."

  return directives
```

### 4. Language-to-Directives Mapping

```
function languageToDirectives(l):
  directives = []

  if l.sentenceLength == "short": "Use short, punchy sentences."
  if l.sentenceLength == "long": "Use longer, more flowing sentences when explaining."

  if l.jargonLevel == "none": "Avoid technical jargon. Explain in plain language."
  if l.jargonLevel == "heavy": "Use domain-specific terminology freely — your audience is technical."

  if l.emojiUsage == "frequently": "Use emoji to add personality and visual breaks."
  if l.emojiUsage == "never": "Never use emoji."

  if l.structure == "bullets": "Prefer bullet points and lists over dense paragraphs."
  if l.structure == "prose": "Write in flowing prose rather than bullet points."

  if l.usesAnalogies == true: "Use analogies and metaphors to explain complex ideas."

  return directives
```

### 5. Cognition Section

```
function generateCognition(spec):
  lines = ["## Thinking Approach"]
  c = spec.cognition

  if c.reasoningStyle.showReasoning:
    "Show your reasoning process step by step."
  if c.reasoningStyle.multiPerspective:
    "Consider multiple perspectives before concluding."
  if c.reasoningStyle.analysisDepth in ["deep", "exhaustive"]:
    "Analyze problems deeply before responding. Don't settle for surface-level answers."

  if c.decisionMaking.autonomy == "fully-autonomous":
    "Make decisions autonomously. Only ask when truly blocked."
  else if c.decisionMaking.autonomy == "always-ask":
    "Always confirm with the user before taking significant actions."

  if c.uncertainty.communicateUncertainty:
    "Explicitly state your confidence level when uncertain."
  if c.uncertainty.lowConfidenceAction == "ask":
    "If your confidence drops below {round(c.uncertainty.confidenceFloor * 100)}%, ask for clarification rather than guessing."

  return join(lines, "\n")
```

### 6. Behavior Rules Section

```
function generateBehaviorRules(spec):
  rules = spec.behavior.rules
  if rules is empty: return ""

  lines = ["## Behavioral Rules"]

  // Sort by priority descending (higher = more important)
  sorted = sort(rules, by: priority DESC, default: 0)

  for rule in sorted:
    condition = conditionToText(rule.condition)
    action = actionToText(rule.action)
    lines.push("- {condition}: {action}")

  return join(lines, "\n")
```

**Condition to text:**

| Type | Output |
|------|--------|
| `always` | `"Always"` |
| `when-topic` | `"When discussing {topics joined with ' or '}"` |
| `when-sentiment` | `"When the user seems {sentiment}"` |
| `when-context` | `"In the context of {context}"` |
| `when-user-role` | `"When the user is a {roles joined with ' or '}"` |
| `when-capability-missing` | `"When unable to {capability}"` |
| `when-confidence-below` | `"When confidence is below {threshold * 100}%"` |
| `compound (and)` | `"{sub1} AND {sub2} AND ..."` |
| `compound (or)` | `"{sub1} OR {sub2} OR ..."` |

**Action to text:**

| Type | Output |
|------|--------|
| `respond-with-style` | `"adjust communication style accordingly"` |
| `use-tool` | `"use the {tool} tool"` |
| `escalate` | `"escalate to {target} ({reason})"` |
| `refuse` | `"decline with: \"{message}\""` |
| `redirect` | `"redirect to {target}"` |
| `adjust-depth` | `"provide {depth}-level analysis"` |
| `require-confirmation` | `"ask for confirmation before proceeding"` |
| `log-event` | `"log {event}"` |
| `custom` | `"execute {handler}"` |

### 7. Boundaries Section

```
function generateBoundaries(spec):
  hard = [b for b in spec.behavior.boundaries where b.enforcement == "hard"]
  if hard is empty: return ""

  lines = ["## Hard Boundaries (Never Violate)"]
  for boundary in hard:
    lines.push("- NEVER: {boundary.description}")

  return join(lines, "\n")
```

---

## Behavior Rule Priority and Conflict Resolution

When multiple rules match the current context:

1. **Sort by priority** — higher priority number wins
2. **Same priority** — rules are applied in order (first match wins for conflicting actions)
3. **Non-conflicting rules** — all matching rules apply simultaneously
4. **Overridable flag** — if `overridable: false`, channel overrides cannot suppress the rule
5. **Boundaries always win** — hard boundaries override any rule action

---

## Inheritance (`extends`)

When `extends` is specified:

1. Load the parent spec
2. Deep merge parent into child (child fields override parent fields)
3. Arrays are replaced, not merged (child's `rules` replaces parent's `rules`)
4. Validate the merged result against the schema

---

## UnitFloat

A `UnitFloat` is a number in the range `[0, 1]` inclusive. SDKs MUST validate this constraint at parse time. The JSON Schema enforces `minimum: 0, maximum: 1`.
