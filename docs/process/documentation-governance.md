# Documentation Governance (Reusable)

## Purpose

Use this policy for any workflow (BMAD or non-BMAD) to prevent drift between code and documentation.

## Ownership Model

- Implementer (developer/agent) owns README updates for each touched service.
- Reviewer owns enforcement of README parity during review.
- Ownership must be visible in task/story/review notes.

## Mandatory Rule

README update required for any service change.

If no README changes are needed, review notes must contain explicit rationale:

- `No README impact: <reason>`

## README Parity Requirements

For every touched service (`frontend`, `backend`, or others), verify docs reflect current reality for:

- setup/install commands
- run commands
- test commands
- lint/quality commands (if present)
- environment variables and local setup
- database/migration commands (if applicable)

## Definition of Done (DoD) Addendum

A task/story is not done until:

- README parity checks pass for all touched services, and
- ownership + review evidence is recorded.

## Review Checklist Template (Copy/Paste)

- [ ] Touched services identified
- [ ] Service README updated for each touched service
- [ ] Or explicit `No README impact` rationale recorded
- [ ] Setup/install commands verified
- [ ] Run commands verified
- [ ] Test commands verified
- [ ] Env var section verified
- [ ] DB/migration commands verified (if applicable)
- [ ] Ownership recorded (implementer/reviewer)
- [ ] Review notes include final parity confirmation

## Suggested PR Comment Snippet

```text
Documentation parity check: PASS
Touched services: <list>
README updates: <files>
No README impact rationale (if any): <text>
Implementer owner: <name>
Reviewer enforcement: <name>
```
