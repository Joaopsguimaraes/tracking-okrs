# PRD Writer Reference

Use this reference for concrete examples while applying `prd-writer`.

## Example 1: New Feature PRD

### User request

`Create a PRD for smart dashboard notifications.`

### Clarifying questions (before drafting)

1. What primary problem do notifications solve today?
2. Which personas will use this feature day to day?
3. Which channels are included in MVP (in-app, email, SMS)?
4. What minimum prioritization and frequency rules are required?
5. What is explicitly out of scope for V1?
6. Which metrics define success after launch?

### Short planning response

- I will structure the PRD section by section using the official template.
- I assume an MVP with in-app notifications and simple rules until initial validation.
- Dependencies: data team (events), UX team, and support alignment.

### Expected PRD output shape

- Document saved at `./tasks/prd-smart-dashboard-notifications/prd.md`
- Numbered functional requirements under `Core Features`
- Explicit `Out of Scope` section (for example: SMS, advanced automation, generative AI)
- `Open Questions` with pending decisions

## Example 2: Existing PRD Refinement

### User request

`Refine this PRD and make acceptance criteria measurable.`

### Clarifying questions

1. Which sections of the current PRD are weakest?
2. Is there a fixed deadline for approval of this document?
3. Which acceptance criteria must be measurable in MVP?
4. Is there a scope boundary already approved by stakeholders?

### Refinement strategy

- Keep the original template structure.
- Rewrite goals with clear metrics (baseline, target, measurement window).
- Rewrite functional requirements in a verifiable format.

### Requirement rewrite example

Before:

- "The system should be fast."

After:

1. "The notifications screen must render items within 2 seconds for 95% of peak-hour requests."
2. "The user must be able to mark notifications as read in bulk in at most 3 clicks."

## Example 3: English Request

### User request

`Write a PRD for role-based access for external partners.`

### Clarifying questions

1. Which partner personas need access in V1?
2. Which actions must each role perform?
3. What data is restricted per role or tenant?
4. What is explicitly out of scope for V1?
5. What business outcomes define success?

### Response style expectation

- Keep the PRD in the same language as the user request.
- Focus on outcomes and constraints, not implementation details.
- Save to `./tasks/prd-role-based-access-external-partners/prd.md`.

## Reusable Question Bank

### Problem and goals

- What is the current pain point and business impact?
- How will success be measured in 30/60/90 days?

### Users and journey

- Who are the primary and secondary users?
- Which core flow must work in MVP?

### Scope and constraints

- Which capabilities are mandatory in V1?
- What is explicitly out of scope?
- Which external dependencies can block delivery?

### Risks and open questions

- Which uncertainties still block PRD closure?
- Which decisions require Product/Design/Engineering input?
