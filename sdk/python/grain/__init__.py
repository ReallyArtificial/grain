from .grain import Grain
from .presets import Presets
from .types import PersonalityVector, LanguageStyle, BigFiveMapping, to_big_five
from .validate import ValidationError

# Re-export internal functions for backward compatibility and direct access
from .validate import validate_spec, assert_valid
from .load import load_agent_spec, parse_agent_spec
from .defaults import resolve_defaults
from .prompt_generator import generate_system_prompt

AgentSpec = dict

__all__ = [
    "Grain",
    "Presets",
    "AgentSpec",
    "PersonalityVector",
    "LanguageStyle",
    "BigFiveMapping",
    "to_big_five",
    "ValidationError",
    "validate_spec",
    "assert_valid",
    "load_agent_spec",
    "parse_agent_spec",
    "resolve_defaults",
    "generate_system_prompt",
]
