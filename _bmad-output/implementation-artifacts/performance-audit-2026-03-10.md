# Performance Audit - 2026-03-10

## Scope

Frontend performance budget validation for Story 5.7 QA evidence traceability.

## Command

```bash
cd frontend && npm run perf:budget
```

## Toolchain

- Build: `vite build` (via `npm run build`)
- Budget checker: `node scripts/check-bundle-size.mjs`

## Results

- Build status: PASS
- Main bundle file: `frontend/dist/assets/index-*.js` (content-hashed filename)
- Measured size: `245516` bytes
- Budget limit: `358400` bytes
- Delta to limit: `112884` bytes under budget
- Final verdict: PASS

Console evidence excerpt:

```
Performance budget check passed: index-CmZVYe1C.js is 245516 bytes (limit 358400 bytes)
```

## Traceability Links

- QA matrix artifact: `_bmad-output/implementation-artifacts/qa-tooling-evidence-2026-03-10.md`
- Story artifact: `_bmad-output/implementation-artifacts/5-7-qa-tooling-evidence-and-traceability.md`
- Perf script source: `frontend/scripts/check-bundle-size.mjs`

## Limitations

- No Lighthouse/browser UX score capture was generated in this run.
- Current evidence satisfies budget-threshold validation, which is the required project gate.
