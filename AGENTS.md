# Contributing to Muse Office

Before changing the Office UI, data model, agent actions, hat instructions, or
product copy, read [the Office product skill](.agents/skills/office-product-model/SKILL.md).
It defines the interaction model and the checks to apply to proposed changes.

Use the matching contracts in `spec/` for implementation details. Keep the hat's
runtime skills in `hat/skills/` aligned with the contributor model; those skills
teach a user's Muse, while `.agents/skills/` guides work on this repository.

Follow [the developer guide](docs/DEVELOPING.md) for local verification and
[RELEASING.md](RELEASING.md) for releases. Preserve existing user records and
customizations when evolving the reference app or its instructions.
