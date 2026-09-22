"""Generate system prompts from AgentSpec data.

Uses 5-level graduated semantic anchoring for personality dimensions,
inspired by SAC (Specific Attribute Control) research (arxiv:2506.20993).
Implements the same canonical algorithm as the TypeScript SDK.
"""
from __future__ import annotations


def generate_system_prompt(spec: dict, channel: str | None = None) -> str:
    sections: list[str] = []
    sections.append(_identity_section(spec))
    sections.append(_voice_section(spec, channel))
    sections.append(_cognition_section(spec))
    sections.append(_behavior_section(spec))
    sections.append(_boundaries_section(spec))
    return "\n\n".join(s for s in sections if s)


def _identity_section(spec: dict) -> str:
    identity = spec["identity"]
    lines: list[str] = []
    lines.append(f"You are {identity['name']}, a {identity['role']}.")
    lines.append(f"Your primary purpose: {identity['purpose']['primary']}")

    secondary = identity["purpose"].get("secondary")
    if secondary:
        lines.append(f"Secondary objectives: {'; '.join(secondary)}")

    expertise = identity.get("expertise", [])
    expert_areas = [e["domain"] for e in expertise if e.get("proficiency", 0) > 0.7]
    if expert_areas:
        lines.append(f"You have deep expertise in: {', '.join(expert_areas)}.")

    return "\n".join(lines)


def _voice_section(spec: dict, channel: str | None = None) -> str:
    personality = {**spec["voice"]["personality"]}
    language = {**spec["voice"]["language"]}

    overrides = spec["voice"].get("channelOverrides", {})
    if channel and channel in overrides:
        override = overrides[channel]
        personality = {**personality, **override}
        language = {**language, **override}

    lines: list[str] = ["## Communication Style"]
    lines.extend(_personality_directives(personality))
    lines.extend(_language_directives(language))
    return "\n".join(lines)


# =============================================================================
# 5-LEVEL GRADUATED SEMANTIC ANCHORING
#
# Each personality dimension maps to 5 intensity bands with specific
# behavioral anchors. Inspired by SAC framework (arxiv:2506.20993).
#
# Bands: [0, 0.2) → level 1 | [0.2, 0.4) → level 2 | [0.4, 0.6) → level 3
#        [0.6, 0.8) → level 4 | [0.8, 1.0] → level 5
# =============================================================================

PERSONALITY_DIRECTIVES: dict[str, list[tuple[float, str]]] = {
    "formality": [
        (0.2, "- Be very casual. Use slang, contractions, and an informal register freely."),
        (0.4, "- Be conversational and approachable. Minimal formalities, relaxed tone."),
        (0.6, "- Use a balanced tone — professional but approachable."),
        (0.8, "- Be professional and polished. Use measured, clear language."),
        (1.01, "- Maintain a highly formal, precise tone. Use institutional register and proper structure."),
    ],
    "warmth": [
        (0.2, "- Be direct and clinical. Focus purely on facts and outcomes, not feelings."),
        (0.4, "- Be polite but task-focused. Acknowledge emotions only when they directly affect the task."),
        (0.6, "- Be friendly. Show basic courtesy and acknowledge the human behind the request."),
        (0.8, "- Be warm and empathetic. Acknowledge feelings and show genuine care before addressing problems."),
        (1.01, "- Lead with empathy. Mirror the user's emotional state, use inclusive language ('let's', 'we can'), and validate feelings before solutions."),
    ],
    "humor": [
        (0.2, "- Stay serious and focused. No jokes, wordplay, or playful language."),
        (0.4, "- Keep things mostly serious. Light tone is acceptable but avoid overt humor."),
        (0.6, "- A touch of wit is fine when it serves clarity, but don't force it."),
        (0.8, "- Use humor and wit naturally. Lighten the mood when appropriate."),
        (1.01, "- Be playful and witty throughout. Use wordplay, gentle teasing, and humor as a core communication tool."),
    ],
    "assertiveness": [
        (0.2, "- Be passive and deferential. Always wait for explicit direction. Never presume."),
        (0.4, "- Be reactive. Offer options but let the user drive decisions."),
        (0.6, "- Balance initiative with deference. Suggest directions but ask before acting."),
        (0.8, "- Be proactive. Make clear recommendations and push conversations forward."),
        (1.01, "- Be highly assertive. Take initiative, make strong recommendations, and challenge weak reasoning when you see it."),
    ],
    "verbosity": [
        (0.2, "- Be extremely terse. Single sentences when possible. No preamble, no filler."),
        (0.4, "- Keep responses brief and focused. Get to the point quickly."),
        (0.6, "- Use a moderate level of detail. Explain enough for clarity without over-elaborating."),
        (0.8, "- Provide detailed, thorough explanations. Include context and reasoning."),
        (1.01, "- Be comprehensive. Explore nuances, provide rich context, examples, and multiple angles on every point."),
    ],
    "confidence": [
        (0.2, "- Hedge heavily. Use qualifiers ('perhaps', 'it might be', 'one possible'). Communicate uncertainty as the default."),
        (0.4, "- Show appropriate uncertainty. Qualify statements where evidence is incomplete."),
        (0.6, "- Be moderately confident. State things clearly but acknowledge limitations when relevant."),
        (0.8, "- Be decisive. State things clearly without excessive hedging."),
        (1.01, "- Be maximally decisive. Commit to positions. Eliminate hedging language entirely. Project authority."),
    ],
    "concreteness": [
        (0.2, "- Stay abstract and conceptual. Focus on frameworks, principles, and high-level thinking."),
        (0.4, "- Lean toward concepts and theory. Use examples sparingly."),
        (0.6, "- Mix abstract concepts with concrete examples as appropriate."),
        (0.8, "- Use concrete examples, specific numbers, and actionable steps."),
        (1.01, "- Be hyper-concrete. Every point gets a specific example, exact number, or step-by-step action. No hand-waving."),
    ],
    "urgency": [
        (0.2, "- Take time to be thorough. Prioritize completeness and quality over speed. Never rush."),
        (0.4, "- Be measured and deliberate. Thoroughness over haste."),
        (0.6, "- Balance thoroughness with efficiency. Cover what matters, skip what doesn't."),
        (0.8, "- Move quickly. Bias toward action and shipping over perfection."),
        (1.01, "- Maximum urgency. Get to the answer immediately. Skip context unless asked. Action over analysis."),
    ],
}


def _personality_directives(p: dict) -> list[str]:
    directives: list[str] = []
    for dim, levels in PERSONALITY_DIRECTIVES.items():
        value = p.get(dim, 0.5)
        for max_val, directive in levels:
            if value < max_val or (max_val > 1 and value <= 1):
                directives.append(directive)
                break
    return directives


def _language_directives(lang: dict) -> list[str]:
    directives: list[str] = []

    sl = lang.get("sentenceLength")
    if sl == "short":
        directives.append("- Use short, punchy sentences.")
    elif sl == "long":
        directives.append("- Use longer, more flowing sentences when explaining.")

    jl = lang.get("jargonLevel")
    if jl == "none":
        directives.append("- Avoid technical jargon. Explain in plain language.")
    elif jl == "heavy":
        directives.append("- Use domain-specific terminology freely — your audience is technical.")

    eu = lang.get("emojiUsage")
    if eu == "frequently":
        directives.append("- Use emoji to add personality and visual breaks.")
    elif eu == "never":
        directives.append("- Never use emoji.")

    st = lang.get("structure")
    if st == "bullets":
        directives.append("- Prefer bullet points and lists over dense paragraphs.")
    elif st == "prose":
        directives.append("- Write in flowing prose rather than bullet points.")

    if lang.get("usesAnalogies"):
        directives.append("- Use analogies and metaphors to explain complex ideas.")

    return directives


def _cognition_section(spec: dict) -> str:
    cognition = spec["cognition"]
    lines: list[str] = ["## Thinking Approach"]

    rs = cognition["reasoningStyle"]
    dm = cognition["decisionMaking"]
    unc = cognition["uncertainty"]

    if rs.get("showReasoning"):
        lines.append("- Show your reasoning process step by step.")
    if rs.get("multiPerspective"):
        lines.append("- Consider multiple perspectives before concluding.")
    if rs.get("analysisDepth") in ("deep", "exhaustive"):
        lines.append("- Analyze problems deeply before responding. Don't settle for surface-level answers.")

    if dm.get("autonomy") == "fully-autonomous":
        lines.append("- Make decisions autonomously. Only ask when truly blocked.")
    elif dm.get("autonomy") == "always-ask":
        lines.append("- Always confirm with the user before taking significant actions.")

    if unc.get("communicateUncertainty"):
        lines.append("- Explicitly state your confidence level when uncertain.")
    if unc.get("lowConfidenceAction") == "ask":
        floor_pct = round(unc.get("confidenceFloor", 0) * 100)
        lines.append(f"- If your confidence drops below {floor_pct}%, ask for clarification rather than guessing.")

    return "\n".join(lines)


def _behavior_section(spec: dict) -> str:
    rules = spec["behavior"].get("rules", [])
    if not rules:
        return ""

    lines: list[str] = ["## Behavioral Rules"]
    sorted_rules = sorted(rules, key=lambda r: r.get("priority", 0), reverse=True)

    for rule in sorted_rules:
        condition = _condition_to_text(rule["condition"])
        action = _action_to_text(rule["action"])
        lines.append(f"- {condition}: {action}")

    return "\n".join(lines)


def _condition_to_text(cond: dict) -> str:
    t = cond["type"]
    if t == "always":
        return "Always"
    elif t == "when-topic":
        return f"When discussing {' or '.join(cond['topics'])}"
    elif t == "when-sentiment":
        return f"When the user seems {cond['sentiment']}"
    elif t == "when-context":
        return f"In the context of {cond['context']}"
    elif t == "when-user-role":
        return f"When the user is a {' or '.join(cond['roles'])}"
    elif t == "when-capability-missing":
        return f"When unable to {cond['capability']}"
    elif t == "when-confidence-below":
        return f"When confidence is below {round(cond['threshold'] * 100)}%"
    elif t == "compound":
        parts = [_condition_to_text(c) for c in cond["conditions"]]
        joiner = " AND " if cond["operator"] == "and" else " OR "
        return joiner.join(parts)
    return str(cond)


def _action_to_text(action: dict) -> str:
    t = action["type"]
    if t == "respond-with-style":
        return "adjust communication style accordingly"
    elif t == "use-tool":
        return f"use the {action['tool']} tool"
    elif t == "escalate":
        return f"escalate to {action['target']} ({action['reason']})"
    elif t == "refuse":
        return f'decline with: "{action["message"]}"'
    elif t == "redirect":
        return f"redirect to {action['target']}"
    elif t == "adjust-depth":
        return f"provide {action['depth']}-level analysis"
    elif t == "require-confirmation":
        return "ask for confirmation before proceeding"
    elif t == "log-event":
        return f"log {action['event']}"
    elif t == "custom":
        return f"execute {action['handler']}"
    return str(action)


def _boundaries_section(spec: dict) -> str:
    boundaries = spec["behavior"].get("boundaries", [])
    hard = [b for b in boundaries if b.get("enforcement") == "hard"]
    if not hard:
        return ""

    lines: list[str] = ["## Hard Boundaries (Never Violate)"]
    for b in hard:
        lines.append(f"- NEVER: {b['description']}")

    return "\n".join(lines)
