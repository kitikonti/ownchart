---
name: review-loop
description: "Automated iterative review loop. Runs full review on explicitly specified files, fixes all findings, commits, and repeats until the first clean pass (no CRITICAL/WARNING). Each iteration runs in an isolated sub-agent to avoid context overflow. Usage: /review-loop src/path/file1.ts src/path/file2.ts"
---

# Review Loop Skill

Automated iterative code review loop that runs until the first clean pass (no CRITICAL/WARNING findings). Each iteration is isolated in a sub-agent to prevent context overflow.

## Usage

```
/review-loop src/hooks/useFileOperations.ts src/hooks/useMarqueeSelection.ts
```

Files must be **explicitly provided** as arguments. Never auto-select files from CODE_REVIEW.md.

## Workflow

### SETUP

1. Parse file list from arguments (space-separated paths after `/review-loop`)
2. If no files provided, ask the user once: "Which files should I review? Please provide the file paths."
3. Note the working directory (CWD)
4. Set `iteration = 1`

### LOOP

Spawn a **general-purpose sub-agent** (via the Agent tool) for each iteration with the following prompt template:

---

**Sub-agent prompt template:**

```
You are performing iteration {N} of an automated code review loop for OwnChart.
Working directory: {CWD}

STEP 1 — REVIEW:
Use the review skill. As in CODE_REVIEW.md mentioned, review the following files,
regardless of whether they are already marked as reviewed or not:
{FILES_LIST}

Invoke the /review skill for the files listed above. Wait for the full review report.

STEP 2 — FIX:
Fix ALL findings from STEP 1 (CRITICAL + WARNING + NOTE).
Additionally fix everything a senior developer would fix for future-proofing and
robustness — even if not flagged by the checklist.
Do NOT ask for user confirmation. Apply all fixes directly.

STEP 3 — VERIFY:
Run: npm run ci:local
If it fails, fix all issues before proceeding. Keep fixing until ci:local passes.

STEP 4 — COMMIT:
Commit all changes using Conventional Commits format.
Use "fix(review):" prefix if fixing bugs/issues, or "refactor(review):" if restructuring.
Example: git commit -m "fix(review): address review findings in useFileOperations"

STEP 5 — COUNT AND RETURN:
Count the findings from the STEP 1 review report:
- critical = number of CRITICAL findings
- warning = number of WARNING findings
- notes = number of NOTE findings

End your response with this EXACT line (no other text after it):
REVIEW_RESULT: critical=N warning=N notes=N

Replace N with the actual counts from the review report.
```

---

### AFTER EACH SUB-AGENT RETURNS

1. Find and parse the `REVIEW_RESULT:` line from the sub-agent's response
2. Extract `critical`, `warning`, `notes` counts

**If `critical > 0` OR `warning > 0`:**
- Print: `"Iteration {N} complete: {critical} critical, {warning} warning, {notes} notes fixed. Starting iteration {N+1}..."`
- Increment `iteration`
- Spawn a new sub-agent (GOTO LOOP)

**If `critical == 0` AND `warning == 0`:**
- Update `CODE_REVIEW.md`: find each file in the list and check off its review checkbox (change `[ ]` to `[x]`)
- Print final summary:
  ```
  Loop complete after {N} iteration(s). Files are clean (0 critical, 0 warning, {notes} notes).
  Files reviewed:
  - {file1}
  - {file2}
  ...
  CODE_REVIEW.md updated.
  ```
- STOP

## Key Constraints

- **Files from args only** — never read CODE_REVIEW.md to select files
- **Sub-agents are general-purpose** with full tool access (so they can invoke the /review skill)
- **`npm run ci:local` must pass** before every commit
- **Conventional Commits required** — `fix:` → PATCH bump, `refactor:` → no release
- **CODE_REVIEW.md updated only on final iteration** by the main session (not sub-agents)
- **No user prompts during the loop** — fully autonomous after initial file confirmation

## Error Handling

- If sub-agent doesn't return a `REVIEW_RESULT:` line, print a warning and ask Martin whether to retry or stop
- If `npm run ci:local` keeps failing inside a sub-agent, the sub-agent should report the error and stop — the main session will surface this to Martin
- Maximum recommended iterations: 5 (if still failing after 5, stop and report)
