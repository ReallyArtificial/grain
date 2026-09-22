"""JSON Schema validation for AgentSpec."""
from __future__ import annotations
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Literal

import jsonschema

_SCHEMA_PATH = Path(__file__).parent / "schema.json"
_schema: dict | None = None


def _get_schema() -> dict:
    global _schema
    if _schema is None:
        _schema = json.loads(_SCHEMA_PATH.read_text())
    return _schema


@dataclass
class ValidationError:
    path: str
    message: str
    severity: Literal["error", "warning"] = "error"


def validate_spec(data: dict) -> list[ValidationError]:
    """Validate an AgentSpec dict against the JSON Schema.
    Returns a list of validation errors (empty = valid).
    """
    schema = _get_schema()
    validator = jsonschema.Draft202012Validator(schema)
    errors: list[ValidationError] = []
    for err in sorted(validator.iter_errors(data), key=lambda e: list(e.absolute_path)):
        path = "/" + "/".join(str(p) for p in err.absolute_path) if err.absolute_path else "/"
        errors.append(ValidationError(path=path, message=err.message))
    return errors


def assert_valid(data: dict) -> None:
    """Validate and raise if invalid."""
    errors = validate_spec(data)
    if errors:
        messages = "\n".join(f"  {e.path}: {e.message}" for e in errors)
        raise ValueError(f"AgentSpec validation failed:\n{messages}")
