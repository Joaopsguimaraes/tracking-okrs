---
name: prd-writer
description:
  Creates Product Requirements Documents (PRD) using the project command and template. Use when the
  user asks to create, write, draft, or refine a PRD, product requirements, feature requirements, or
  discovery document.
---

# PRD Writer

Create clear, actionable PRDs focused on **what** and **why**.

## Sources of truth

- Template: `docs_team/templates/prd-template.md`

Always align outputs with both files above.

## When to apply

Apply this skill when the user asks to:

- create/write/draft a PRD
- define product requirements for a feature
- structure discovery requirements before implementation
- improve an existing PRD document

## Non-negotiable rule

Never generate the full PRD before asking clarifying questions.

## Workflow

### 1) Clarify first (required)

Collect missing context before drafting:

- Problem to solve and business objective
- Primary users and key user stories
- Core functionality and success criteria
- Constraints, dependencies, and assumptions
- Explicit out-of-scope items
- Open questions that still need decisions

If key context is missing, ask follow-up questions until the PRD can be written with low ambiguity.

### 2) Plan the PRD (required)

Before drafting, provide a short plan that includes:

- Section-by-section writing approach
- Information gaps and what will be assumed
- Dependencies or stakeholders that can block delivery

### 3) Draft using the official template (required)

Use `docs_team/templates/prd-template.md` structure:

- `Visão Geral`
- `Objetivos`
- `Histórias de Usuário`
- `Funcionalidades Principais` (with numbered functional requirements)
- `Experiência do Usuário`
- `Restrições Técnicas de Alto Nível`
- `Fora de Escopo`
- `Questões em Aberto`

Writing rules:

- Prioritize outcomes, user value, and measurable objectives
- Keep implementation details out of the PRD
- Keep language precise and testable when possible
- Include accessibility/inclusion considerations
- Keep the main PRD concise (target: <= 1,000 words)

### 4) Save to the expected location (required)

- Create directory: `./tasks/prd-[feature-name]/`
- Use kebab-case for `[feature-name]`
- Save file as: `./tasks/prd-[feature-name]/prd.md`

### 5) Report result (required)

After saving, return:

- Final file path
- Brief summary of key decisions captured
- Open questions still unresolved

## Quality checklist

- Clarifying questions were asked before drafting
- PRD follows the official template structure
- Functional requirements are numbered
- Out-of-scope is explicit
- Open questions are listed
- File is saved in `tasks/prd-[feature-name]/prd.md`

## Output format for final handoff

Use this response shape after generating the document:

```markdown
PRD created at: `./tasks/prd-[feature-name]/prd.md`

Decisions captured:

- ...
- ...

Open questions:

- ...
- ...
```

## Example triggers

- "Create a PRD for dashboard alert scheduling"
- "Write product requirements for role-based access"
- "Crie um PRD para onboarding multi-organização"

## Additional resources

- For concrete examples and a reusable question bank, see `reference.md`.
