# Clean Code Standards Reference

## Thresholds

- File length: warn above 500 lines.
- Function length: warn above 50 lines.
- Cyclomatic complexity: warn above 10.
- Nesting depth: warn above 4.

These are review thresholds, not laws. A breach should trigger inspection, not automatic rewriting.

## Interpretation

### SRP

- A file should have one clear reason to change.
- A function should do one cohesive job and return to its caller without hidden side quests.
- A component should not own rendering, data fetching, transformation, and business rules unless the scope is genuinely small.

### DRY

- Remove duplication when the duplicated behavior is stable and semantically the same.
- Keep duplication when collapsing it would create a worse abstraction or force unrelated callers together.

### KISS

- Prefer straight-line code and explicit names.
- Prefer small helpers over meta-programming.
- Prefer two clear functions over one generic function with many flags.

## Architecture Checks

- Keep UI in components.
- Keep reusable stateful logic in hooks.
- Keep API calls, persistence, and cross-cutting workflows in services or dedicated modules.
- Search for existing helpers, hooks, and components before adding new ones.
- Prefer functional composition over classes unless classes are already the dominant pattern.

## Naming Checks

- Use names that describe purpose, not mechanics.
- Avoid vague labels such as `utils`, `helpers`, `manager`, `data`, `common`, or `misc` unless the scope is truly narrow and obvious.
- Rename files or functions that have outgrown their original responsibility.

## Common Refactors

- Large file: split by responsibility, not by arbitrary line counts.
- Long function: extract pure helpers, flatten conditions, and separate orchestration from detailed work.
- High complexity: reduce branches, isolate decisions, and represent rules as small functions or mappings.
- Deep nesting: add guard clauses, invert conditions, or split loops and conditionals into named helpers.
- UI plus logic mixed together: move state transitions, fetching, and transformation into hooks or services.

## Review Output Template

For each finding, capture:

1. File path and relevant function or component name.
2. Measured signal, if available.
3. Violated principle.
4. Why the current shape is hard to maintain.
5. Smallest clear refactor that improves it.
