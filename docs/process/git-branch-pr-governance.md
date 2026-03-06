# Git Branch + PR Governance (Balanced)

## Goal

Keep `main` stable without creating excessive branch/PR overhead.

## Default Workflow

- Do not implement directly on `main`.
- Start work on a short-lived branch from latest `main`.
- Open one PR when the branch reaches a coherent, reviewable unit.
- Merge to `main` via PR only.

## Branch Naming

Use one of these prefixes:

- `feat/<scope>` for new functionality
- `fix/<scope>` for bug fixes
- `chore/<scope>` for tooling/refactors/no behavior change
- `docs/<scope>` for documentation-only changes

Examples:

- `feat/1-5-task-complete-toggle`
- `fix/todo-validation-error-shape`
- `chore/frontend-test-stability`

## PR Sizing Policy (Balance)

### Preferred

- 1 PR per story or bug.

### Allowed batching (to reduce PR noise)

You may combine related small items into one PR when all are true:

- Same service area or same story sequence.
- Total effort fits in about 1 working day.
- Changes stay reviewable (clear scope, easy to test).
- PR title/body clearly lists included items.

### Avoid in a single PR

- Mixed unrelated features.
- Large cross-cutting refactors plus feature work.
- Multi-day accumulations that are hard to review.

## Open Branch Limits

- Prefer at most 1 active implementation branch per contributor at a time.
- If a long-running effort is required, split into milestone PRs.

## PR Completion Checklist

- [ ] Branch is not `main`.
- [ ] Scope is coherent and reviewable.
- [ ] Local checks pass for touched areas.
- [ ] README parity verified (or explicit `No README impact` rationale).
- [ ] PR targets `main`.

## Automation Guidance for Agents

At the end of agent-driven implementation:

1. Commit all scoped changes on the branch.
2. Push branch to origin.
3. Create PR to `main`.
4. If PR creation cannot be automated (missing auth/tooling), output exact commands and mark task pending until user confirms PR creation.
