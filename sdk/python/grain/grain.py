"""Grain — immutable wrapper around an AgentSpec dict.

Every mutation returns a new Grain; the original is never modified.
"""
from __future__ import annotations

import copy
import json
from pathlib import Path
from typing import Any

import yaml

from .validate import assert_valid, validate_spec, ValidationError
from .defaults import resolve_defaults
from .prompt_generator import generate_system_prompt


class Grain:
    __slots__ = ("_data",)

    def __init__(self, data: dict):
        self._data = data

    # =========================================================================
    # CONSTRUCTORS
    # =========================================================================

    @classmethod
    def create(cls, id: str, *, name: str | None = None, description: str = "") -> Grain:
        raw = {
            "specVersion": "1.0",
            "id": id,
            "version": "1.0.0",
            "meta": {
                "name": name or id,
                "description": description,
            },
        }
        spec = resolve_defaults(raw)
        assert_valid(spec)
        return cls(spec)

    @classmethod
    def from_string(cls, content: str) -> Grain:
        try:
            data = json.loads(content)
        except (json.JSONDecodeError, ValueError):
            data = yaml.safe_load(content)
        assert_valid(data)
        return cls(resolve_defaults(data))

    @classmethod
    def load(cls, file_path: str | Path) -> Grain:
        path = Path(file_path)
        content = path.read_text()
        if path.suffix == ".json":
            data = json.loads(content)
        else:
            data = yaml.safe_load(content)
        assert_valid(data)
        return cls(resolve_defaults(data))

    @classmethod
    def of(cls, spec: dict) -> Grain:
        assert_valid(spec)
        return cls(resolve_defaults(copy.deepcopy(spec)))

    # =========================================================================
    # INTERNAL HELPER
    # =========================================================================

    def _with(self, updater) -> Grain:
        clone = copy.deepcopy(self._data)
        updater(clone)
        return Grain(clone)

    # =========================================================================
    # READ ACCESSORS
    # =========================================================================

    @property
    def id(self) -> str:
        return self._data["id"]

    @property
    def name(self) -> str:
        return self._data["meta"]["name"]

    @property
    def version(self) -> str:
        return self._data["version"]

    @property
    def personality(self) -> dict:
        return dict(self._data["voice"]["personality"])

    @property
    def rules(self) -> list[dict]:
        return copy.deepcopy(self._data["behavior"]["rules"])

    @property
    def boundaries(self) -> list[dict]:
        return copy.deepcopy(self._data["behavior"]["boundaries"])

    @property
    def tools(self) -> list[dict]:
        return copy.deepcopy(self._data.get("capabilities", {}).get("tools") or [])

    @property
    def skills(self) -> list[dict]:
        return copy.deepcopy(self._data.get("capabilities", {}).get("skills") or [])

    @property
    def expertise(self) -> list[dict]:
        return copy.deepcopy(self._data["identity"]["expertise"])

    @property
    def data(self) -> dict:
        return self._data

    @property
    def is_valid(self) -> bool:
        return len(validate_spec(self._data)) == 0

    # =========================================================================
    # QUERY
    # =========================================================================

    def has_rule(self, id: str) -> bool:
        return any(r["id"] == id for r in self._data["behavior"]["rules"])

    def has_tool(self, name: str) -> bool:
        return any(t["id"] == name for t in (self._data.get("capabilities", {}).get("tools") or []))

    def has_skill(self, name: str) -> bool:
        return any(s["name"] == name for s in (self._data.get("capabilities", {}).get("skills") or []))

    # =========================================================================
    # MUTATIONS (all return new Grain)
    # =========================================================================

    def add_rule(self, rule: dict) -> Grain:
        return self._with(lambda d: d["behavior"]["rules"].append(rule))

    def remove_rule(self, id: str) -> Grain:
        def updater(d):
            d["behavior"]["rules"] = [r for r in d["behavior"]["rules"] if r["id"] != id]
        return self._with(updater)

    def add_rules(self, rules: list[dict]) -> Grain:
        return self._with(lambda d: d["behavior"]["rules"].extend(rules))

    def add_boundary(self, boundary: dict) -> Grain:
        return self._with(lambda d: d["behavior"]["boundaries"].append(boundary))

    def remove_boundary(self, description: str) -> Grain:
        def updater(d):
            d["behavior"]["boundaries"] = [
                b for b in d["behavior"]["boundaries"] if b["description"] != description
            ]
        return self._with(updater)

    def add_boundaries(self, boundaries: list[dict]) -> Grain:
        return self._with(lambda d: d["behavior"]["boundaries"].extend(boundaries))

    def add_tool(self, tool: dict) -> Grain:
        def updater(d):
            if "tools" not in d.get("capabilities", {}):
                d.setdefault("capabilities", {})["tools"] = []
            d["capabilities"]["tools"].append(tool)
        return self._with(updater)

    def remove_tool(self, name: str) -> Grain:
        def updater(d):
            tools = d.get("capabilities", {}).get("tools") or []
            d["capabilities"]["tools"] = [t for t in tools if t["id"] != name]
        return self._with(updater)

    def add_tools(self, tools: list[dict]) -> Grain:
        def updater(d):
            if "tools" not in d.get("capabilities", {}):
                d.setdefault("capabilities", {})["tools"] = []
            d["capabilities"]["tools"].extend(tools)
        return self._with(updater)

    def add_skill(self, skill: dict) -> Grain:
        def updater(d):
            if "skills" not in d.get("capabilities", {}):
                d.setdefault("capabilities", {})["skills"] = []
            d["capabilities"]["skills"].append(skill)
        return self._with(updater)

    def remove_skill(self, name: str) -> Grain:
        def updater(d):
            skills = d.get("capabilities", {}).get("skills") or []
            d["capabilities"]["skills"] = [s for s in skills if s["name"] != name]
        return self._with(updater)

    def add_skills(self, skills: list[dict]) -> Grain:
        def updater(d):
            if "skills" not in d.get("capabilities", {}):
                d.setdefault("capabilities", {})["skills"] = []
            d["capabilities"]["skills"].extend(skills)
        return self._with(updater)

    def add_expertise(self, domain: str, proficiency: float) -> Grain:
        if proficiency < 0 or proficiency > 1:
            raise ValueError(f"Proficiency must be between 0 and 1, got {proficiency}")
        return self._with(lambda d: d["identity"]["expertise"].append({
            "domain": domain,
            "proficiency": proficiency,
        }))

    def remove_expertise(self, domain: str) -> Grain:
        def updater(d):
            d["identity"]["expertise"] = [e for e in d["identity"]["expertise"] if e["domain"] != domain]
        return self._with(updater)

    def set_personality(self, dim: str, value: float) -> Grain:
        if value < 0 or value > 1:
            raise ValueError(f"Personality value must be between 0 and 1, got {value} for {dim}")
        def updater(d):
            d["voice"]["personality"][dim] = value
        return self._with(updater)

    def set(self, path: str, value: Any) -> Grain:
        def updater(d):
            parts = path.split(".")
            obj = d
            for part in parts[:-1]:
                obj = obj[part]
            obj[parts[-1]] = value
        return self._with(updater)

    def get(self, path: str) -> Any:
        parts = path.split(".")
        obj = self._data
        for part in parts:
            obj = obj[part]
        return obj

    def merge(self, other: Grain) -> Grain:
        def updater(d):
            _deep_merge(d, other._data)
        return self._with(updater)

    # =========================================================================
    # OUTPUT
    # =========================================================================

    def to_string(self, channel: str | None = None) -> str:
        clone = copy.deepcopy(self._data)

        # Apply channel overrides
        if channel:
            overrides = clone.get("voice", {}).get("channelOverrides", {}).get(channel, {})
            if overrides:
                clone["voice"]["personality"].update(overrides)
                clone["voice"]["language"].update(overrides)

        # Strip SDK metadata
        for key in ("specVersion", "id", "version", "observability", "adaptation"):
            clone.pop(key, None)

        meta = clone.get("meta", {})
        meta.pop("model", None)
        meta.pop("tags", None)

        voice = clone.get("voice", {})
        voice.pop("channelOverrides", None)

        return yaml.dump(clone, default_flow_style=False, sort_keys=False, allow_unicode=True)

    def to_prompt(self, channel: str | None = None) -> str:
        return generate_system_prompt(self._data, channel)

    def to_yaml(self) -> str:
        return yaml.dump(
            copy.deepcopy(self._data),
            default_flow_style=False,
            sort_keys=False,
            allow_unicode=True,
        )

    def to_json(self) -> str:
        return json.dumps(self._data, indent=2)

    def validate(self) -> list[ValidationError]:
        return validate_spec(self._data)

    def diff(self, other: Grain) -> dict[str, dict[str, Any]]:
        result: dict[str, dict[str, Any]] = {}
        _diff_objects(self._data, other._data, "", result)
        return result


# =============================================================================
# HELPERS
# =============================================================================

def _deep_merge(target: dict, source: dict) -> None:
    for key in source:
        sv = source[key]
        tv = target.get(key)
        if isinstance(sv, dict) and isinstance(tv, dict):
            _deep_merge(tv, sv)
        else:
            target[key] = copy.deepcopy(sv)


def _diff_objects(a: Any, b: Any, prefix: str, result: dict) -> None:
    if isinstance(a, dict) and isinstance(b, dict):
        all_keys = set(list(a.keys()) + list(b.keys()))
        for key in all_keys:
            path = f"{prefix}.{key}" if prefix else key
            av = a.get(key)
            bv = b.get(key)
            if isinstance(av, dict) and isinstance(bv, dict):
                _diff_objects(av, bv, path, result)
            elif isinstance(av, list) and isinstance(bv, list):
                if av != bv:
                    result[path] = {"before": av, "after": bv}
            elif av != bv:
                result[path] = {"before": av, "after": bv}
    elif a != b:
        result[prefix] = {"before": a, "after": b}
