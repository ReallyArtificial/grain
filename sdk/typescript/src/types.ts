/**
 * AgentSpec TypeScript type definitions.
 * Aligned with spec/agentspec.schema.json (source of truth).
 */

// ============================================================================
// TOP-LEVEL SPEC
// ============================================================================

export interface AgentSpec {
  $schema?: string
  specVersion: "1.0"
  id: string
  version: string
  extends?: string | { id: string; version: string }
  meta: AgentMeta
  identity: AgentIdentity
  voice: AgentVoice
  cognition: AgentCognition
  capabilities: AgentCapabilities
  behavior: AgentBehavior
  memory: AgentMemory
  communication: AgentCommunication
  adaptation: AgentAdaptation
  observability: AgentObservability
}

// ============================================================================
// META
// ============================================================================

export interface AgentMeta {
  name: string
  description: string
  author?: string
  license?: string
  tags?: string[]
  url?: string
  model?: ModelPreference
}

export interface ModelPreference {
  minimumTier: "small" | "medium" | "large" | "frontier"
  preferredProvider?: string
  preferredModel?: string
  minimumContext?: number
  requiresToolCalling?: boolean
  requiresMultimodal?: boolean
}

// ============================================================================
// IDENTITY
// ============================================================================

export interface AgentIdentity {
  name: string
  role: string
  purpose: {
    primary: string
    secondary?: string[]
  }
  expertise: DomainExpertise[]
  relationships?: AgentRelationship[]
}

export interface DomainExpertise {
  domain: string
  proficiency: number
  subtopics?: string[]
}

export interface AgentRelationship {
  target: string
  type: "reports-to" | "delegates-to" | "collaborates-with" | "supervises" | "escalates-to"
  permissions?: ("read" | "write" | "execute" | "delegate")[]
}

// ============================================================================
// VOICE
// ============================================================================

export interface AgentVoice {
  personality: PersonalityVector
  language: LanguageStyle
  channelOverrides?: Record<string, Partial<PersonalityVector & LanguageStyle>>
}

export interface PersonalityVector {
  formality: number
  warmth: number
  humor: number
  assertiveness: number
  verbosity: number
  confidence: number
  concreteness: number
  urgency: number
}

export interface LanguageStyle {
  locale: string
  sentenceLength: "short" | "medium" | "long"
  jargonLevel: "none" | "moderate" | "heavy"
  emojiUsage: "never" | "sparingly" | "frequently"
  structure: "prose" | "bullets" | "mixed"
  usesAnalogies: boolean
  addressing: "first-person" | "third-person" | "neutral"
}

/**
 * Big Five (OCEAN) personality mapping.
 * Optional — provides scientific grounding for the 8-dimension model.
 * See SPECIFICATION.md for mapping details.
 */
export interface BigFiveMapping {
  openness: number
  conscientiousness: number
  extraversion: number
  agreeableness: number
  neuroticism: number
}

/**
 * Derives approximate Big Five scores from a PersonalityVector.
 */
export function toBigFive(p: PersonalityVector): BigFiveMapping {
  return {
    openness: (p.humor + (1 - p.concreteness)) / 2,
    conscientiousness: (p.formality + (1 - p.urgency) + p.concreteness) / 3,
    extraversion: (p.warmth + p.assertiveness + p.verbosity) / 3,
    agreeableness: (p.warmth + (1 - p.assertiveness)) / 2,
    neuroticism: ((1 - p.confidence) + p.urgency) / 2,
  }
}

// ============================================================================
// COGNITION
// ============================================================================

export interface AgentCognition {
  reasoningStyle: ReasoningStyle
  decisionMaking: DecisionMaking
  uncertainty: UncertaintyHandling
  taskStrategy: TaskStrategy
}

export interface ReasoningStyle {
  primary: "analytical" | "creative" | "systematic" | "intuitive" | "socratic"
  showReasoning: boolean
  analysisDepth: "surface" | "moderate" | "deep" | "exhaustive"
  multiPerspective: boolean
}

export interface DecisionMaking {
  speed: number
  evidenceThreshold: number
  reversibilityPreference: "prefer-reversible" | "neutral" | "bias-to-action"
  autonomy: "always-ask" | "ask-for-major" | "decide-unless-ambiguous" | "fully-autonomous"
}

export interface UncertaintyHandling {
  lowConfidenceAction: "ask" | "hedge" | "state-assumption" | "refuse"
  confidenceFloor: number
  communicateUncertainty: boolean
  conflictResolution: "ask-user" | "use-most-recent" | "use-most-authoritative" | "present-both"
}

export interface TaskStrategy {
  decomposition: "top-down" | "bottom-up" | "iterative"
  maxParallelism: number
  checkpointing: boolean
  blockingStrategy: "wait" | "skip-and-return" | "find-alternative" | "escalate"
}

// ============================================================================
// CAPABILITIES
// ============================================================================

export interface AgentCapabilities {
  tools?: ToolCapability[]
  skills?: SkillDefinition[]
  knowledge?: KnowledgeSource[]
  outputFormats?: OutputFormat[]
}

export interface ToolCapability {
  id: string
  usage: string
  requiresConfirmation?: boolean
  rateLimit?: { max: number; per: "message" | "conversation" | "hour" }
}

export interface SkillDefinition {
  name: string
  description: string
  requiredTools?: string[]
  steps?: string[]
  successCriteria?: string[]
}

export interface KnowledgeSource {
  id: string
  type: "embedded" | "retrieval" | "api" | "file-system" | "database"
  domain: string
  freshness?: "static" | "daily" | "real-time"
  priority?: number
}

export interface OutputFormat {
  format: string
  condition?: string
}

// ============================================================================
// BEHAVIOR
// ============================================================================

export interface AgentBehavior {
  rules: BehaviorRule[]
  boundaries: Boundary[]
  triggers?: BehaviorTrigger[]
  escalation?: EscalationPolicy
}

export interface BehaviorRule {
  id: string
  condition: RuleCondition
  action: RuleAction
  priority?: number
  overridable?: boolean
}

export type RuleCondition =
  | { type: "always" }
  | { type: "when-topic"; topics: string[] }
  | { type: "when-sentiment"; sentiment: "positive" | "negative" | "neutral" | "frustrated" }
  | { type: "when-context"; context: string }
  | { type: "when-user-role"; roles: string[] }
  | { type: "when-capability-missing"; capability: string }
  | { type: "when-confidence-below"; threshold: number }
  | { type: "compound"; operator: "and" | "or"; conditions: RuleCondition[] }

export type RuleAction =
  | { type: "respond-with-style"; style: Partial<PersonalityVector> }
  | { type: "use-tool"; tool: string; params?: Record<string, unknown> }
  | { type: "escalate"; target: string; reason: string }
  | { type: "refuse"; message: string }
  | { type: "redirect"; target: string }
  | { type: "adjust-depth"; depth: "surface" | "moderate" | "deep" }
  | { type: "require-confirmation" }
  | { type: "log-event"; event: string; level: "info" | "warn" | "error" }
  | { type: "custom"; handler: string; params?: Record<string, unknown> }

export interface Boundary {
  description: string
  category: "content" | "action" | "data" | "scope" | "safety"
  enforcement: "hard" | "soft"
  onViolation: "refuse" | "warn" | "redirect" | "escalate"
  message?: string
}

export interface BehaviorTrigger {
  event: TriggerEvent
  action: RuleAction
  cooldown?: number
}

export type TriggerEvent =
  | { type: "keyword"; keywords: string[] }
  | { type: "intent"; intents: string[] }
  | { type: "silence"; durationSeconds: number }
  | { type: "error"; errorType?: string }
  | { type: "threshold"; metric: string; operator: "gt" | "lt" | "eq"; value: number }
  | { type: "schedule"; cron: string }

export interface EscalationPolicy {
  conditions: EscalationCondition[]
  defaultTarget: string
  handoffStrategy: "full-transcript" | "summary" | "structured-handoff"
  maxRetries?: number
}

export interface EscalationCondition {
  trigger: "confidence-low" | "user-frustrated" | "out-of-scope" | "safety-concern" | "repeated-failure" | "explicit-request"
  threshold?: number
  target?: string
}

// ============================================================================
// MEMORY
// ============================================================================

export interface AgentMemory {
  retention: RetentionPolicy[]
  contextStrategy: ContextStrategy
  persistentState?: StateSchema[]
}

export interface RetentionPolicy {
  category: "user-preferences" | "conversation-history" | "task-state" | "learned-patterns" | "corrections" | "facts"
  duration: "conversation" | "session" | "days" | "permanent"
  days?: number
  maxItems?: number
  priority?: number
}

export interface ContextStrategy {
  overflow: "summarize" | "sliding-window" | "smart-select" | "truncate"
  prioritize: ("recent" | "user-stated" | "task-relevant" | "corrections")[]
  autoSummarize: boolean
}

export interface StateSchema {
  key: string
  type: "string" | "number" | "boolean" | "array" | "object"
  description: string
  defaultValue?: unknown
  agentWritable: boolean
}

// ============================================================================
// COMMUNICATION
// ============================================================================

export interface AgentCommunication {
  channels: ChannelConfig[]
  input: InputProcessing
  output: OutputProcessing
  interAgent?: InterAgentConfig
}

export interface ChannelConfig {
  channel: string
  enabled: boolean
  voiceOverrides?: Partial<PersonalityVector & LanguageStyle>
  constraints?: {
    maxLength?: number
    supportsMarkdown?: boolean
    supportsImages?: boolean
    supportsButtons?: boolean
  }
}

export interface InputProcessing {
  languages: string[]
  typoTolerance: boolean
  ambiguityResolution: "ask" | "best-guess" | "ask-if-high-stakes"
  modalities: ("text" | "image" | "audio" | "file")[]
}

export interface OutputProcessing {
  defaultFormat: "text" | "markdown" | "html" | "json"
  citations: "always" | "when-available" | "never"
  maxLength?: { value: number; unit: "tokens" | "characters" }
  structuredOutput: boolean
}

export interface InterAgentConfig {
  protocols: ("a2a" | "mcp" | "custom")[]
  exposedCapabilities: string[]
  requestableCapabilities: string[]
  auth?: "none" | "token" | "mutual-tls" | "oauth"
}

// ============================================================================
// ADAPTATION
// ============================================================================

export interface AgentAdaptation {
  enabled: boolean
  driftBounds?: DriftBound[]
  learning?: LearningConfig
  feedback?: FeedbackConfig
}

export interface DriftBound {
  parameter: string
  maxDrift: number
  driftRate: "immediate" | "gradual" | "slow"
  resetsPerConversation: boolean
}

export interface LearningConfig {
  sources: ("user-feedback" | "task-outcomes" | "corrections" | "examples")[]
  minSamples: number
  requiresApproval: boolean
}

export interface FeedbackConfig {
  collection: "explicit-ask" | "implicit-signals" | "both"
  application: "immediate" | "batched" | "manual-review"
  conflictResolution: "latest-wins" | "majority-wins" | "ask-user"
}

// ============================================================================
// OBSERVABILITY
// ============================================================================

export interface AgentObservability {
  logging: LoggingConfig
  metrics: MetricDefinition[]
  successCriteria: SuccessCriterion[]
}

export interface LoggingConfig {
  level: "debug" | "info" | "warn" | "error"
  alwaysLog: ("tool-use" | "escalation" | "boundary-hit" | "error" | "rule-fired")[]
  conversationLogging: "full" | "summary" | "none"
  piiHandling: "redact" | "hash" | "allow"
}

export interface MetricDefinition {
  name: string
  description: string
  type: "counter" | "gauge" | "histogram" | "rate"
  event: string
}

export interface SuccessCriterion {
  description: string
  metric: string
  target: { operator: "gt" | "lt" | "eq" | "gte" | "lte"; value: number }
  window?: "per-conversation" | "per-day" | "per-week"
}
