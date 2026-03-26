---
name: task-executor
description:
  Executes implementation tasks from task files using the project execute-task command flow. Use
  when the user asks to execute a task, start working on a specific task file, implement a task
  end-to-end, or mark task progress/completion.
---

# Task Executor

Executes a selected implementation task from `tasks/prd-[feature-name]/[num]_task.md` using project
standards.

## When to use

Use this skill when the user asks to:

- execute/start a task from task files
- implement a specific task end-to-end
- continue delivery from an existing task plan
- update task completion/progress in `tasks.md`

Common triggers:

- "execute task 3.0"
- "start 2_task.md"
- "implemente esta tarefa"
- "continue from this task file"

## Source of truth

- Task definition: `tasks/prd-[feature-name]/[num]_task.md`
- Task summary: `tasks/prd-[feature-name]/tasks.md`
- Inputs: `tasks/prd-[feature-name]/prd.md` and `tasks/prd-[feature-name]/techspec.md`

Always align execution with the files above.

## Required workflow

### 1) Pre-task setup (required)

Before implementing:

2. Read the selected task file `[num]_task.md`
3. Read `prd.md` and `techspec.md` in the same feature folder
4. Check dependencies from `tasks.md` and task subtasks
5. Identify applicable project rules/docs for impacted code

### 2) Task analysis (required)

Analyze and document:

- primary task objective
- fit with PRD/Tech Spec context
- constraints and acceptance criteria
- dependencies/blockers from previous tasks
- implementation approach options

### 3) Share execution brief (required)

Provide, before coding, this concise structure:

```text
ID da Tarefa: [ID ou número]
Nome da Tarefa: [Nome ou descrição breve]
Contexto PRD: [Pontos principais do PRD]
Requisitos Tech Spec: [Requisitos técnicos principais]
Dependências: [Lista de dependências]
Objetivos Principais: [Objetivos primários]
Riscos/Desafios: [Riscos ou desafios identificados]
```

Then provide a short ordered approach:

```text
1. [Primeiro passo]
2. [Segundo passo]
3. [Passos adicionais conforme necessário]
```

### 4) Implement immediately after brief (required)

After sharing summary and approach:

- start implementation without waiting for another prompt
- execute necessary commands
- make code changes aligned with project standards
- satisfy task requirements and subtasks

Do not stop at planning when the user asked to execute.

### 5) Use Context7 when external docs are needed (required)

When implementation depends on framework/library behavior:

1. Resolve the library in Context7
2. Fetch focused docs for the exact API/feature being changed
3. Apply guidance to implementation decisions

Prefer repository docs/rules first; use Context7 to validate third-party behavior.

### 6) Validate and close task (required)

Before finishing:

- run relevant checks (lint/tests/typecheck as applicable)
- verify success criteria from `[num]_task.md`
- update `tasks.md` marking the completed main task/subtasks when done
- report what was implemented, what was validated, and any follow-ups

## Authoring and execution standards

- No shortcuts ("gambiarras"); use maintainable solutions
- Keep changes minimal and scoped to task objectives
- Maintain consistency with existing architecture and patterns
- Explicitly call out assumptions and unresolved blockers

## Quality checklist

- [ ] Command and task files were read before coding
- [ ] PRD + Tech Spec context was used in decisions
- [ ] Execution brief and approach were shared
- [ ] Implementation started immediately after planning
- [ ] External library behavior was validated with Context7 when needed
- [ ] Task completion was reflected in `tasks.md`
- [ ] Validation steps/results were reported

## Final handoff format

Use this completion shape:

```markdown
✅ Task execution completed

- Task: `[ID] [name]`
- Scope delivered: [short summary]
- Files changed: [key paths]
- Validation: [tests/lint/typecheck executed + outcome]
- Task tracking: `tasks.md` updated ([what was marked complete])
- Open items: [none | list]
```

## Additional resources

- For concrete examples of execution briefs, implementation flow, and completion updates, see
  `reference.md`.
