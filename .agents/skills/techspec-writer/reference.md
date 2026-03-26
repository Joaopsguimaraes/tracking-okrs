# Tech Spec Writer Reference

## Clarification prompts (reuse as needed)

Ask before finalizing when information is missing:

1. Which module/domain should own this feature?
2. What are the key input/output contracts and data transformations?
3. Which external services are involved, and what are timeout/retry/failure expectations?
4. Which API endpoints or interfaces must change?
5. What are the top critical test scenarios for V1?
6. Which metrics/logs/alerts must exist for safe rollout?

## Compact authoring checklist

- Confirm `tasks/prd-[feature-name]/prd.md` exists
- Read `docs_team/templates/techspec-template.md`
- Map standards from `docs_team`
- Produce sections in exact template order
- Keep implementation-focused and concise
- Save to `tasks/prd-[feature-name]/techspec.md`
- Return output path and open assumptions

## Final response format (recommended)

Use this concise completion structure:

```markdown
✅ Tech Spec created

- Path: `tasks/prd-[feature-name]/techspec.md`
- Status: template fully applied
- Pending items: [none | list open points]
- Next steps: technical review and stakeholder validation
```
