# Tasks Writer Reference

Use this reference for concrete examples while applying `tasks-writer`.

## Example 1: Full flow from PRD + Tech Spec to task files

### User request

`Create tasks for feature slug smart-alert-routing.`

### High-level proposal (must come before file generation)

```markdown
Proposed high-level tasks for approval:

- [ ] 1.0 Define alert routing domain model and validation rules (dependency: none)
- [ ] 2.0 Implement routing services and API contract updates (depends on 1.0)
- [ ] 3.0 Build configuration UI and user flows (depends on 1.0, can run in parallel with 2.0 after
      contracts are stable)
- [ ] 4.0 Add observability, test suite, and rollout safeguards (depends on 2.0 and 3.0)

Parallelization notes:

- 2.0 and 3.0 can partially run in parallel after 1.0 is complete.
- 4.0 starts after backend and UI integration is merged.
```

### After user approval: expected generated files

- `tasks/prd-smart-alert-routing/tasks.md`
- `tasks/prd-smart-alert-routing/1_task.md`
- `tasks/prd-smart-alert-routing/2_task.md`
- `tasks/prd-smart-alert-routing/3_task.md`
- `tasks/prd-smart-alert-routing/4_task.md`

### Example `tasks.md`

```markdown
# Implementation Task Summary for Smart Alert Routing

## Tasks

- [ ] 1.0 Define alert routing domain model and validation rules
- [ ] 2.0 Implement routing services and API contract updates
- [ ] 3.0 Build configuration UI and user flows
- [ ] 4.0 Add observability, test suite, and rollout safeguards
```

### Example `1_task.md`

```markdown
# Task 1.0: Define alert routing domain model and validation rules

<critical>Read the [prd.md](http://prd.md/) and [techspec.md](http://techspec.md/) files in this
folder. If you do not read these files, your task will be invalidated.</critical>

## Overview

Define the route entity, matching rules, and validation constraints used by all downstream
implementation tasks.

<requirements>
- Route matching must support priority ordering and fallback behavior.
- Rule validation must reject overlapping conditions that produce ambiguous routing.
- Definitions must be compatible with existing alert payload schema.
</requirements>

## Subtasks

- [ ] 1.1 Map PRD routing requirements into a canonical rule model
- [ ] 1.2 Define TypeScript types/interfaces for route, condition, and action
- [ ] 1.3 Implement validation helpers for overlaps, missing fields, and invalid priorities
- [ ] 1.4 Add unit tests for valid/invalid route definitions
- [ ] 1.5 Document model decisions and known limitations for downstream tasks

## Implementation Details

Reference the domain model and constraints sections in [techspec.md](http://techspec.md/),
especially route precedence, fallback semantics, and compatibility requirements with current alert
payload contracts.

## Success Criteria

- Rule model supports all mandatory PRD scenarios.
- Invalid route definitions are consistently rejected with deterministic errors.
- Unit tests cover overlap detection, fallback, and priority edge cases.

## Relevant Files

- `src/modules/alerts/types/routing.types.ts`
- `src/modules/alerts/helpers/routing-validation.ts`
- `src/modules/alerts/helpers/routing-validation.spec.ts`
- `tasks/prd-smart-alert-routing/techspec.md`
```

## Example 2: Refining an existing task plan

### User request

`Refine existing tasks to make dependencies clearer and add testing coverage.`

### Refinement strategy

- Keep existing main tasks and numbering stable when possible
- Add explicit dependency notes in approval proposal
- Add at least one test subtask per main task where behavior changes
- Tighten success criteria with measurable outcomes

### Rewrite pattern for weak subtasks

Before:

- `2.3 Improve API behavior`

After:

- `2.3 Implement route conflict API error responses with standardized error codes`

## Example 3: Large feature with phase suggestion (>10 main tasks)

### User request

`Create tasks for enterprise workflow orchestration feature.`

### Recommended proposal style

```markdown
Suggested phases:

- Phase 1: Foundations (1.0-3.0)
- Phase 2: Core orchestration flows (4.0-8.0)
- Phase 3: UX hardening and rollout readiness (9.0-12.0)

Parallel tracks:

- Track A (backend): 4.0, 5.0, 7.0
- Track B (frontend): 6.0, 8.0
- Track C (quality): 9.0, 10.0, 11.0
```

## Reusable phrasing bank

### Dependency notes

- `Depends on 1.0 completion due to shared contract definitions.`
- `Can start after API schema freeze in 2.0.`
- `Blocked by migration rollout from 3.0.`

### Parallelization notes

- `Can run in parallel with 4.0 after shared types are merged.`
- `Independent from UI work; backend team can execute concurrently.`
- `Parallelizable except for final integration test step.`

### Success criteria language

- `Behavior is validated by unit tests covering normal and edge paths.`
- `Acceptance flow is executable end-to-end in staging.`
- `No regression in existing feature contract tests.`
