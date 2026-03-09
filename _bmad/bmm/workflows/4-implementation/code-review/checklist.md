# Senior Developer Review - Validation Checklist

- [ ] Story file loaded from `{{story_path}}`
- [ ] Story Status verified as reviewable (review)
- [ ] Epic and Story IDs resolved ({{epic_num}}.{{story_num}})
- [ ] Story Context located or warning recorded
- [ ] Epic Tech Spec located or warning recorded
- [ ] Architecture/standards docs loaded (as available)
- [ ] Tech stack detected and documented
- [ ] MCP doc search performed (or web fallback) and references captured
- [ ] Acceptance Criteria cross-checked against implementation
- [ ] File List reviewed and validated for completeness
- [ ] README parity verified for each changed service (frontend/backend): run, test, env, and DB/migration commands are accurate
- [ ] README update required for any service change is enforced (or explicit "No README impact" rationale recorded)
- [ ] Documentation ownership confirmed: implementing developer/agent owns README updates for touched services; reviewer enforces
- [ ] Tests identified and mapped to ACs; gaps noted
- [ ] Touched-service matrix derived from changed files (frontend/backend flags identified)
- [ ] Frontend validation evidence verified when `frontend/` changed: `npm run lint`, `npm run test`, `npm run test:e2e` all passing in completion run
- [ ] Backend validation evidence verified when `backend/` changed: `python3 -m pytest -q` passing in completion run
- [ ] Story cannot be set to `done` if any required touched-service gate evidence is missing or failing
- [ ] Code quality review performed on changed files
- [ ] Security review performed on changed files and dependencies
- [ ] Outcome decided (Approve/Changes Requested/Blocked)
- [ ] Review notes appended under "Senior Developer Review (AI)"
- [ ] Change Log updated with review entry
- [ ] Status updated according to settings (if enabled)
- [ ] Sprint status synced (if sprint tracking enabled)
- [ ] Story saved successfully

_Reviewer: {{user_name}} on {{date}}_
