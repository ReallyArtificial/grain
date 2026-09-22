# grain-sdk

Python SDK for [Grain](https://github.com/reallyartificial/grain) — a structured data format for describing AI agents.

## Install

```bash
pip install grain-sdk
```

## Usage

```python
from grain import Grain

# Load from file
agent = Grain.load("./my-agent.agent.yaml")

# Generate system prompt
prompt = agent.to_prompt()

# Channel-specific prompt
slack_prompt = agent.to_prompt("slack")

# Clean YAML for LLM consumption (strips metadata)
yaml = agent.to_string()
```

### Create programmatically

```python
from grain import Grain

agent = (
    Grain.create("my-bot", name="My Bot", description="Does helpful things")
    .set_personality("warmth", 0.8)
    .set_personality("confidence", 0.9)
    .add_rule({
        "id": "always-greet",
        "condition": {"type": "always"},
        "action": {"type": "respond-with-style", "style": {"warmth": 0.9}},
    })
    .add_boundary({
        "description": "Never share internal data",
        "category": "data",
        "enforcement": "hard",
        "onViolation": "refuse",
    })
    .add_tool({"id": "search", "usage": "Search knowledge base"})
)

print(agent.to_prompt())
```

### Immutable mutations

Every method returns a new `Grain` — the original is never modified.

```python
base = Grain.create("my-bot")
with_rule = base.add_rule({"id": "r1", "condition": {"type": "always"}, "action": {"type": "require-confirmation"}})

len(base.rules)       # 0
len(with_rule.rules)  # 1
```

### With any LLM provider

```python
from grain import Grain
from openai import OpenAI

agent = Grain.load("./my-agent.agent.yaml")
client = OpenAI()

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[
        {"role": "system", "content": agent.to_prompt()},
        {"role": "user", "content": "Hello!"}
    ]
)
```

### Merge and diff

```python
a = Grain.create("bot-a").set_personality("warmth", 0.3)
b = Grain.create("bot-b").set_personality("warmth", 0.9)

merged = a.merge(b)   # b wins on conflicts
changes = a.diff(b)    # {"voice.personality.warmth": {"before": 0.3, "after": 0.9}}
```

## Minimal Spec

```yaml
specVersion: "1.0"
id: my-bot
version: 1.0.0
meta:
  name: My Bot
  description: Does helpful things
```

## API

### Constructors
- `Grain.create(id, *, name=None, description="")` — Create with defaults
- `Grain.from_string(yaml_or_json)` — Parse from string
- `Grain.load(file_path)` — Load from file
- `Grain.of(spec_dict)` — Wrap a plain dict

### Mutations (return new Grain)
- `add_rule(rule)` / `remove_rule(id)` / `add_rules(rules)`
- `add_boundary(b)` / `remove_boundary(desc)` / `add_boundaries(bs)`
- `add_tool(t)` / `remove_tool(name)` / `add_tools(ts)`
- `add_skill(s)` / `remove_skill(name)` / `add_skills(ss)`
- `add_expertise(domain, proficiency)` / `remove_expertise(domain)`
- `set_personality(dim, value)` — validates 0-1 range
- `set(path, value)` / `get(path)` — generic deep access
- `merge(other)` — deep merge, other wins

### Properties
- `id`, `name`, `version` — scalars
- `personality`, `rules`, `boundaries`, `tools`, `skills`, `expertise` — copies
- `data` — raw dict
- `is_valid` — boolean

### Queries
- `has_rule(id)`, `has_tool(name)`, `has_skill(name)`

### Output
- `to_string(channel=None)` — Clean YAML for LLMs (strips metadata)
- `to_prompt(channel=None)` — Natural language system prompt
- `to_yaml()` — Full YAML with all metadata
- `to_json()` — Full JSON
- `validate()` — Returns `list[ValidationError]`
- `diff(other)` — Structural diff

### Presets
- `Presets.personality["professional"]`
- `Presets.personality["friendly"]`
- `Presets.personality["expert"]`
- `Presets.personality["creative"]`
- `Presets.personality["executor"]`

## License

MIT
