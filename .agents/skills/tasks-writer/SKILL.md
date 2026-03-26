---
name: tasks-writer
description:
  Creates implementation task plans from PRD and Tech Spec using the project create-tasks command
  and templates. Use when the user asks to create, write, draft, or refine task breakdowns,
  execution plans, or task files for a feature.
---

# Tasks Writer

Creates a structured implementation task plan focused on execution order, dependencies, and
parallelization.

## When to use

Use this skill when the user asks to:

- create/write/draft task plans from a PRD + Tech Spec
- break a feature into implementation tasks and subtasks
- generate `tasks.md` and individual task files for execution
- "create tasks", "write tasks", "task breakdown", "plano de tarefas", "lista de tarefas"

## Source of truth

- Task summary template: `docs_team/templates/tasks-template.md`
- Individual task template: `docs_team/templates/task-template.md`

Always align outputs with these files.

## Mandatory inputs and outputs

- **Input PRD:** `tasks/prd-[feature-name]/prd.md`
- **Input Tech Spec:** `tasks/prd-[feature-name]/techspec.md`
- **Output summary:** `tasks/prd-[feature-name]/tasks.md`
- **Output individual files:** `tasks/prd-[feature-name]/[num]_task.md`

Use kebab-case for `[feature-name]`.

## Non-negotiable rule

Never generate any task file before showing the high-level task list and getting explicit user
approval.

## Required workflow

### 1) Read required sources first

Before drafting:

2. Read `docs_team/templates/tasks-template.md`
3. Read `docs_team/templates/task-template.md`
4. Confirm PRD exists at `tasks/prd-[feature-name]/prd.md`
5. Confirm Tech Spec exists at `tasks/prd-[feature-name]/techspec.md`
6. Read both files end-to-end

### 2) Analyze and derive task architecture

- Extract functional requirements, constraints, and technical decisions
- Identify domains/components and integration points
- Define a logical sequence with dependency-first ordering
- Identify parallelizable workstreams
- Ensure each main task is independently completable

### 3) Propose high-level tasks for approval (required)

Provide only the high-level list first (main tasks, no file generation yet):

- Use `X.0` numbering for main tasks
- Include dependency notes
- Mark tasks that can run in parallel
- Suggest phases when there are many tasks (especially >10)

Wait for explicit user approval before creating files.

### 4) Generate `tasks.md` (after approval)

Create `tasks/prd-[feature-name]/tasks.md` using `docs_team/templates/tasks-template.md` exactly.

Rules:

- Keep checklist format
- Use only main task lines (`X.0`) in summary
- Preserve concise, action-oriented task titles

### 5) Generate individual `[num]_task.md` files (after approval)

For each main task, create `tasks/prd-[feature-name]/[num]_task.md` using
`docs_team/templates/task-template.md` exactly.

For each file:

- Fill `Overview` with clear scope and expected deliverable
- Add mandatory requirements in `<requirements>` from PRD/Tech Spec
- Define concrete subtasks using `X.Y` numbering
- Reference relevant sections in `Implementation Details` (do not paste full implementation)
- Add measurable `Success Criteria`
- List concrete `Relevant Files` paths
- Include test-related subtasks and validation criteria

## Authoring standards

- Assume the main reader is a junior developer
- Keep language clear, concrete, and implementation-ready
- Avoid vague verbs ("improve", "adjust") without acceptance criteria
- Keep dependencies explicit and unambiguous
- Keep terminology consistent across all task files

## Quality checklist

- [ ] High-level task list was shown and approved before file generation
- [ ] `tasks.md` follows template structure exactly
- [ ] Every main task has a corresponding `[num]_task.md` file
- [ ] Main task numbering uses `X.0` and subtasks use `X.Y`
- [ ] Dependencies and parallelization are explicit
- [ ] Test subtasks are present in each relevant task
- [ ] Paths and filenames match `tasks/prd-[feature-name]/`

## Final handoff format

After generation, return:

- Created/updated file paths
- Brief summary of task sequencing decisions
- Parallelization opportunities
- Open assumptions or questions

## Example triggers

- "Create tasks for this PRD and tech spec"
- "Generate implementation task files from `tasks/prd-foo`"
- "Crie as tarefas dessa feature com dependencias e paralelismo"

## Additional resources

- For concrete examples of high-level approval proposals and task file outputs, see `reference.md`.
