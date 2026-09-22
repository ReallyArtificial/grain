"""Sensible defaults for optional AgentSpec sections.

Allows minimal specs (just specVersion, id, version, meta) to work by
filling in neutral defaults for all other sections.
"""
from __future__ import annotations


def resolve_defaults(partial: dict) -> dict:
    """Fill in missing sections with sensible defaults."""
    spec = {**partial}

    if "identity" not in spec:
        meta = spec["meta"]
        spec["identity"] = {
            "name": meta["name"],
            "role": "AI Assistant",
            "purpose": {"primary": meta.get("description", "Assist the user")},
            "expertise": [],
        }

    if "voice" not in spec:
        spec["voice"] = {
            "personality": {
                "formality": 0.5,
                "warmth": 0.5,
                "humor": 0.3,
                "assertiveness": 0.5,
                "verbosity": 0.5,
                "confidence": 0.6,
                "concreteness": 0.6,
                "urgency": 0.4,
            },
            "language": {
                "locale": "en",
                "sentenceLength": "medium",
                "jargonLevel": "moderate",
                "emojiUsage": "never",
                "structure": "mixed",
                "usesAnalogies": False,
                "addressing": "first-person",
            },
        }

    if "cognition" not in spec:
        spec["cognition"] = {
            "reasoningStyle": {
                "primary": "analytical",
                "showReasoning": False,
                "analysisDepth": "moderate",
                "multiPerspective": False,
            },
            "decisionMaking": {
                "speed": 0.5,
                "evidenceThreshold": 0.5,
                "reversibilityPreference": "neutral",
                "autonomy": "ask-for-major",
            },
            "uncertainty": {
                "lowConfidenceAction": "ask",
                "confidenceFloor": 0.3,
                "communicateUncertainty": True,
                "conflictResolution": "ask-user",
            },
            "taskStrategy": {
                "decomposition": "top-down",
                "maxParallelism": 1,
                "checkpointing": False,
                "blockingStrategy": "escalate",
            },
        }

    if "capabilities" not in spec:
        spec["capabilities"] = {}

    if "behavior" not in spec:
        spec["behavior"] = {"rules": [], "boundaries": []}

    if "memory" not in spec:
        spec["memory"] = {
            "retention": [{"category": "conversation-history", "duration": "session"}],
            "contextStrategy": {
                "overflow": "summarize",
                "prioritize": ["recent"],
                "autoSummarize": False,
            },
        }

    if "communication" not in spec:
        spec["communication"] = {
            "channels": [{"channel": "api", "enabled": True}],
            "input": {
                "languages": ["en"],
                "typoTolerance": True,
                "ambiguityResolution": "ask",
                "modalities": ["text"],
            },
            "output": {
                "defaultFormat": "text",
                "citations": "never",
                "structuredOutput": False,
            },
        }

    if "adaptation" not in spec:
        spec["adaptation"] = {"enabled": False}

    if "observability" not in spec:
        spec["observability"] = {
            "logging": {
                "level": "info",
                "alwaysLog": ["error"],
                "conversationLogging": "none",
                "piiHandling": "redact",
            },
            "metrics": [],
            "successCriteria": [],
        }

    return spec
