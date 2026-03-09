# Story 4.3: Keyboard Accessibility and Semantic UI Baseline

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an end user,
I want to use core task flows using keyboard navigation and consume content with semantic structure,
so that the application is accessible without a mouse and by screen readers.

## Acceptance Criteria

1. Given a keyboard-only user, when navigating creation, completion, deletion, and editing flows, then all interactive elements are reachable/focusable via Tab and operable via Enter/Space keys in a logical order (FR32, NFR10).
2. Given a screen reader or accessibility audit tool, when analyzing the task list interface, then the markup uses correct semantic roles (main, list, listitem, button, heading) instead of generic divs, and passes automated WCAG 2.1 AA baseline checks with zero critical violations (FR33, NFR11).
3. Given text and interactive elements, when checking color contrast, then normal text meets 4.5:1 and large text meets 3:1 ratios in all states (active, completed, error, success) (NFR12).

## Tasks / Subtasks

- [x] Audit and Fix Semantic HTML Structure (AC: 2)
  - [x] Replace non-semantic interactive `<div>`s with `<button type="button">`.
  - [x] Ensure the main task list uses `<ul>` and `<li>` structure.
  - [x] Verify headings (`<h1>`, `<h2>`) follow a logical hierarchy.
  - [x] Add `aria-label` to icon-only buttons (delete, complete toggles).

- [x] Implement Keyboard Focus and Operability (AC: 1)
  - [x] Add visible focus indicators to all interactive elements (standardize `focus-visible:ring` in Tailwind).
  - [x] Ensure `Tab` navigation follows visual order (input -> add button -> list items).
  - [x] Verify `Enter` key submits the task creation form.
  - [x] Verify `Space` or `Enter` keys toggle completion and activate delete on focused items.
  - [x] Remove any outline suppression (`outline: none`) without replacement.

- [x] Verify and Fix Color Contrast (AC: 3)
  - [x] Audit text colors against backgrounds using browser devtools or automated tools.
  - [x] Adjust Tailwind color shades if needed to meet 4.5:1 ratio (especially for placeholder text and completed task gray-out text).

- [x] Automated Accessibility Tests (AC: 2)
  - [x] Install `@axe-core/playwright` as a dev dependency in `frontend`.
  - [x] Create `tests/accessibility.spec.ts` to run `axe` scans on main states (empty, populated list).
  - [x] Ensure CI pipeline includes these tests.

- [x] Run Quality Gates
  - [x] `frontend`: `npm run lint` (check for jsx-a11y warnings)
  - [x] `frontend`: `npm run test`
  - [x] `frontend`: `npm run test:e2e`

## Dev Notes

### Story Context and Scope

- **Focus:** Accessibility (A11y) only. No new functionality.
- **Goal:** Make the existing MVP app usable by keyboard and screen readers.
- **Constraints:** Do not break existing responsiveness or functionality.
- **Standards:** WCAG 2.1 AA (baseline).

### Technical Options & Architectural Decisions

- **Testing Library:** Use `@axe-core/playwright` for automated A11y integration tests. This is the industry standard for Playwright-based suites.
- **Styling:** Use Tailwind CSS utility classes for focus states (e.g., `focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`).
- **Semantic HTML:** Prefer native HTML elements (`<button>`, `<input>`, `<ul>`, `<li>`) over ARIA roles where possible. Use ARIA only when native semantics are insufficient.
- **Linting:** Ensure `eslint-plugin-jsx-a11y` is active and heeded (should be part of standard React configs, verify if configured).

### Library / Framework Requirements

- `frontend`: Install `@axe-core/playwright` (Dev Dependency).

### File Structure Requirements

- Modify: `frontend/src/components/*` (to fix semantics/focus).
- Modify: `frontend/src/index.css` (for global focus styles if needed).
- Create: `frontend/tests/accessibility.spec.ts`.

### Previous Story Intelligence

- **From Story 4.2:** Detailed responsive work was done. Ensure accessibility fixes (like focus rings) work well on mobile touch targets too (e.g., adequate spacing).
- **From Story 4.2:** Playwright config is robust. Just add the new spec file.

### References

- Epic 4 in `_bmad-output/planning-artifacts/epics.md`.
- UX Design Spec `_bmad-output/planning-artifacts/ux-design-specification.md` (Accessibility section).
- FR32, FR33, NFR10, NFR11, NFR12.

## Dev Agent Record

### Agent Model Used

GPT-5.3-Codex

### Debug Log References

- Loaded inputs from `epics.md`, `sprint-status.yaml`, `ux-design-specification.md`.
- Identified target story 4.3.
- Validated tech stack (React, Tailwind, Playwright).
- Verified NFRs for keyboard (NFR10) and semantics (NFR11).
- Created/switch to branch: `feat/4-3-keyboard-accessibility-and-semantic-ui-baseline`.
- Implemented semantic sectioning with explicit `h2` hierarchy and task region structure.
- Updated global styles for visible `:focus-visible` outlines and higher-contrast UI/status states.
- Added Playwright accessibility suite using `@axe-core/playwright` and keyboard-only flow coverage.
- Ran quality gates: `npm run lint`, `npm run test`, `npm run test:e2e`.

### Completion Notes List

- Created comprehensive plan for semantic audit, keyboard support, and automated testing using axe-core.
- Specified installation of `@axe-core/playwright`.
- Defined clear acceptance criteria mapping to NFRs.
- Added explicit `Tasks` section heading and retained semantic `main` + `ul`/`li` task structure.
- Added global accessible focus indicators for `button` and `input` using `:focus-visible`.
- Improved readable contrast for text, controls, alerts, and status badges (`active`, `completed`, `pending`).
- Added end-to-end accessibility checks for axe baseline scans in empty and populated states.
- Added keyboard-flow E2E coverage for Tab/Enter/Space behavior on desktop browser projects.
- Post-review fixes: migrated task rendering to native `<ul>/<li>` semantics and retained keyboard-operable controls.
- Post-review fixes: strengthened keyboard-flow accessibility test to cover uncomplete and retry activation paths.
- Post-review fixes: updated CRUD E2E selectors to match semantic list markup.
- Confirmed CI already executes Playwright E2E tests, so the new accessibility spec is included automatically.
- No README impact: changes are internal accessibility improvements and test coverage additions without command/workflow changes.

### File List
- _bmad-output/implementation-artifacts/4-3-keyboard-accessibility-and-semantic-ui-baseline.md
- frontend/src/app/App.tsx
- frontend/src/app/App.test.tsx
- frontend/src/features/todos/components/TodoList.tsx
- frontend/src/features/todos/components/TodoList.test.tsx
- frontend/src/index.css
- frontend/tests/e2e/accessibility.spec.ts
- frontend/tests/e2e/todo-crud.spec.ts
- frontend/package.json
- frontend/package-lock.json
- frontend/playwright-report/index.html
- _bmad-output/implementation-artifacts/sprint-status.yaml

## Senior Developer Review (AI)

### Reviewer

Raj (GPT-5.3-Codex)

### Outcome

Approved after fixes.

### Findings Resolution Summary

- Fixed semantic mismatch by implementing native list semantics (`ul`/`li`) in `TodoList`.
- Fixed accessibility E2E false-positive path by validating deletion against `listitem` semantics and real retry behavior.
- Expanded keyboard-only E2E coverage to include uncomplete and retry interactions.
- Updated affected unit/integration/E2E selectors to align with semantic list rendering.
- Re-ran frontend touched-service quality gates and confirmed all required gates pass.

### Verification Evidence

- `frontend`: `npm run lint` (pass)
- `frontend`: `npm run test` (72 passed)
- `frontend`: `npm run test:e2e` (52 passed, 3 skipped)

### Change Log
- 2026-03-09: Implemented Story 4.3 accessibility baseline updates, added automated accessibility tests, and passed all frontend quality gates.
- 2026-03-09: Completed post-review remediation for semantic list structure, keyboard retry coverage, and E2E selector alignment; revalidated all frontend quality gates.