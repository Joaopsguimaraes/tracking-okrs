---
name: clean-code-standards
description: Enforce clean code standards with explicit SRP, DRY, and KISS guardrails. Use when reviewing, refactoring, generating, or extending application code and you need to check file size, function length, cyclomatic complexity, nesting depth, naming quality, UI/logic separation, or duplication risk before proposing changes.
---

# Clean Code Standards

## Overview

Apply this skill to keep code small, readable, and easy to change. Start with measurable signals, then turn those signals into concrete refactors that improve SRP, DRY, and KISS without over-engineering.

## Workflow

1. Identify the files or directories in scope.
2. Run `python3 scripts/code_metrics.py <path>` against that scope to flag oversized files, long functions, high complexity, and deep nesting.
3. Read the flagged code before suggesting changes. Confirm whether the metric reflects a real maintainability problem.
4. Check whether UI, stateful logic, and data access are mixed together. Split components from hooks/services when that improves cohesion.
5. Check whether similar functionality already exists before creating a new component, hook, helper, or service.
6. Refactor toward smaller units with single responsibilities. Remove duplication only when the shared abstraction is clearer than the repeated code.
7. Report findings with file references, the violated principle, and the smallest viable refactor.

## Core Rules

- Enforce DRY and SRP strictly, but do not create abstractions with weak ownership.
- Prefer simple, readable code over clever or heavily generic code.
- Break complex work into smaller implementation steps before editing.
- Refactor when a function exceeds 50 lines or a file exceeds 500 lines unless there is a clear reason not to.
- Treat high branching and deep nesting as a design smell. Reduce condition stacking, early-return when possible, and isolate decision logic.
- Separate UI components from hooks, services, and data-shaping logic where practical.
- Prefer functional patterns over class-based designs unless the surrounding codebase already depends on classes.
- Use descriptive, purpose-driven names for files, functions, hooks, and services.
- Avoid god files, god components, and god services.

## Review Heuristics

- Flag files that collect unrelated responsibilities, especially when rendering, side effects, validation, and data mapping live together.
- Flag functions that require scrolling to understand, maintain multiple temporary states, or mix orchestration with low-level details.
- Flag repeated logic when two or more blocks would need to change together.
- Flag branching that hides the happy path or requires tracking too many conditions at once.
- Flag names that describe implementation details instead of intent.
- Preserve existing architecture and conventions when they are already clean enough; do not refactor for style alone.

## Refactor Patterns

- Extract pure helpers for formatting, validation, mapping, and decision logic.
- Extract hooks for reusable stateful behavior.
- Extract services for API, persistence, and workflow orchestration.
- Replace nested conditionals with guard clauses, lookup tables, or smaller strategy functions.
- Split broad components into container plus presentational pieces when rendering and logic are tightly coupled.
- Collapse near-duplicate code into shared helpers only after identifying the stable common behavior.

## Reporting

When producing findings or review comments:

- Lead with the highest-risk maintainability issues.
- Cite the measured signal when relevant, for example file lines, function lines, complexity, or nesting depth.
- Tie each issue to SRP, DRY, KISS, naming, or separation-of-concerns.
- Recommend the simplest refactor that resolves the problem.
- Mention when a metric breach is acceptable because the code is still cohesive and readable.

## Resources

- Use [references/standards.md](references/standards.md) for thresholds, interpretation rules, and remediation guidance.
- Use `python3 scripts/code_metrics.py <path>` for a fast local audit before manual review.
