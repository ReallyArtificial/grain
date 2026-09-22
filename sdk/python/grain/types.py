"""AgentSpec Python type definitions using TypedDicts for schema alignment."""
from __future__ import annotations
from typing import TypedDict, Literal
from dataclasses import dataclass


class PersonalityVector(TypedDict):
    formality: float
    warmth: float
    humor: float
    assertiveness: float
    verbosity: float
    confidence: float
    concreteness: float
    urgency: float


class LanguageStyle(TypedDict):
    locale: str
    sentenceLength: Literal["short", "medium", "long"]
    jargonLevel: Literal["none", "moderate", "heavy"]
    emojiUsage: Literal["never", "sparingly", "frequently"]
    structure: Literal["prose", "bullets", "mixed"]
    usesAnalogies: bool
    addressing: Literal["first-person", "third-person", "neutral"]


@dataclass
class BigFiveMapping:
    openness: float
    conscientiousness: float
    extraversion: float
    agreeableness: float
    neuroticism: float


def to_big_five(p: PersonalityVector) -> BigFiveMapping:
    return BigFiveMapping(
        openness=(p["humor"] + (1 - p["concreteness"])) / 2,
        conscientiousness=(p["formality"] + (1 - p["urgency"]) + p["concreteness"]) / 3,
        extraversion=(p["warmth"] + p["assertiveness"] + p["verbosity"]) / 3,
        agreeableness=(p["warmth"] + (1 - p["assertiveness"])) / 2,
        neuroticism=((1 - p["confidence"]) + p["urgency"]) / 2,
    )


# AgentSpec is represented as a plain dict matching the JSON schema.
# We use a TypeAlias for documentation purposes.
AgentSpec = dict
