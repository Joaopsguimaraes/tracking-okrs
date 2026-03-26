---
name: techspec-writer
description:
  Writes implementation-ready technical specifications from a PRD using the project techspec command
  and template. Use when the user asks to create a tech spec, technical specification, design spec,
  architecture implementation plan, or "especificacao tecnica"/"techspec".
---

# Tech Spec Writer

Creates a technical specification focused on **how to implement** a feature, following project
standards.

## When to use

Use this skill when the user asks to:

- create a tech spec / technical specification
- write a design spec for implementation
- transform a PRD into engineering guidance
- "criar especificacao tecnica", "escrever techspec", "documento tecnico"

## Mandatory inputs and outputs

- **Input PRD:** `tasks/prd-[feature-name]/prd.md`
- **Output Tech Spec:** `tasks/prd-[feature-name]/techspec.md`
- **Template source of truth:** `docs_team/templates/techspec-template.md`

## Required workflow

### 1) Read required sources first

Before writing anything:

2. Read `docs_team/templates/techspec-template.md`
3. Confirm the PRD exists at `tasks/prd-[feature-name]/prd.md`
4. Read relevant docs in `docs_team/` for the feature scope

### 2) Analyze before writing

- Extract requirements, constraints, success metrics, rollout phases, and risks from PRD
- Explore impacted modules/files/interfaces/dependencies
- Identify integration points, error paths, and test implications
- Evaluate reuse vs custom implementation (libraries/components/patterns)

### 3) Ask clarifying questions when needed

If key implementation details are missing, ask focused questions **before finalizing**:

- domain ownership and boundaries
- data flow and interfaces/contracts
- external dependencies and failure modes
- testing focus and acceptance
- observability expectations

### 4) Generate the Tech Spec using exact template structure

Use the same section order and headers from `docs_team/templates/techspec-template.md`.

Guidelines:

- Focus on implementation architecture (avoid repeating PRD business narrative)
- Include component design, interfaces, data models, APIs, integrations, test approach, and
  observability
- Keep it concise and implementation-ready (target ~2,000 words max)
- Add "Conformidade com Padrões" mapped to applicable `docs_team` docs
- Add "Arquivos relevantes" with concrete paths

### 5) Save and verify

1. Save file to `tasks/prd-[feature-name]/techspec.md`
2. Confirm file path and successful write
3. Provide a short completion report with:
   - generated path
   - unresolved assumptions/open points
   - suggested next steps (review/approval)

## Quality checklist

- [ ] PRD reviewed end-to-end
- [ ] Repository analysis completed
- [ ] Clarifications asked for missing critical data
- [ ] Template followed exactly
- [ ] Implementation-focused (HOW, not WHAT)
- [ ] Testing and observability covered
- [ ] Output saved in correct path

## Example triggers

- "Create a tech spec for the new alerts module"
- "Write technical specification from this PRD"
- "Crie uma especificacao tecnica para este PRD"
- "Generate implementation design doc in tasks/prd-foo"

## Additional reference

- For reusable question prompts and a compact generation checklist, see `reference.md`.
