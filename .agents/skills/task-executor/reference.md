# Task Executor Reference

Use this reference for practical examples while applying `task-executor`.

## Example 1: Execute task 2.0 end-to-end

### User request

`Execute task 2.0 from tasks/prd-smart-alert-routing/2_task.md`

### Expected execution brief

```text
ID da Tarefa: 2.0
Nome da Tarefa: Implement routing services and API contract updates
Contexto PRD: Alert routing must support prioritized rules and fallback behavior for production incidents.
Requisitos Tech Spec: Add routing decision service, API validation contract, and deterministic conflict handling.
Dependências: 1.0 completed (domain model and validation rules).
Objetivos Principais: Deliver backend routing flow and API contract changes with test coverage.
Riscos/Desafios: Contract drift between service and frontend client; edge-case precedence bugs.
```

### Expected approach section

```text
1. Implement service layer using approved route model and conflict validation.
2. Update API contract and error mapping for invalid/overlapping rules.
3. Add unit/integration tests and validate against acceptance criteria.
```

### Execution behavior example

- Start code changes right after sharing brief and approach
- Validate with relevant checks (for example: `yarn lint`, targeted tests)
- If third-party behavior is unclear, consult Context7 before finalizing implementation

### Completion update example

```markdown
✅ Task execution completed

- Task: `2.0 Implement routing services and API contract updates`
- Scope delivered: routing decision service, API validation contract, conflict error mapping
- Files changed: `src/modules/alerts/services/routing-service.ts`,
  `src/app/api/proxy/alerts/route.ts`, `src/modules/alerts/services/routing-service.spec.ts`
- Validation: targeted tests passed, lint passed for changed files
- Task tracking: `tasks/prd-smart-alert-routing/tasks.md` updated (2.0 marked complete)
- Open items: none
```

## Example 2: Dependency not ready (blocked task)

### User request

`Start task 3.0 now`

### Recommended behavior

1. Verify dependencies in `tasks.md` and `3_task.md`
2. If blocked by incomplete prior task, report block clearly
3. Offer the minimum unblocked preparatory work (tests scaffolding, interface prep, docs)
4. Do not claim completion or mark task done while dependency remains open

### Blocked response pattern

```markdown
Task `3.0` is currently blocked by dependency `2.0` (API contract finalization).

Unblocked work I can execute now:

1. Prepare UI integration test scaffolding with mocked contract.
2. Create placeholder client interfaces aligned with the draft schema.
3. Document remaining integration checklist.
```

## Example 3: Context7 usage trigger

Use Context7 when task execution depends on uncertain external behavior, for example:

- Next.js cache/revalidation semantics
- Auth.js callback/session details
- MUI component API behavior
- library version-specific edge cases

### Compact pattern

1. Identify the exact external API decision needed
2. Fetch focused documentation from Context7
3. Apply decision in code and cite rationale in final handoff

## Reusable phrasing bank

### Risk statements

- `Main risk is contract mismatch between backend response and consumer parsing.`
- `Primary challenge is preserving backward compatibility while introducing new validation rules.`
- `Edge-case precedence can cause silent routing regressions if not covered by tests.`

### Validation statements

- `Acceptance criteria validated with unit tests for success and failure paths.`
- `No regression found in existing task-related test suites.`
- `Static checks passed for touched files and related modules.`

### Task tracking statements

- `` `tasks.md` updated: marked 2.0 as complete. ``
- `` `tasks.md` updated: marked subtasks 3.1 and 3.2 complete; 3.3 pending integration. ``
