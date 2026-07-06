## Update Intake

- When maintaining this `general-instructions` repository, treat `updates/` as a
  dated intake queue. Review update files newest-first, move accepted reusable
  rules into the main library, and remember accepted updates by committing them.
- External projects that consume these shared instructions must not read
  `updates/` during startup or bootstrap.
- When another project reveals a reusable improvement to shared instructions,
  write a dated recommendation to this repository's `updates/` folder if it is
  available.
- When the user reports an agent-rule failure, repeated behavior bug, or asks to
  keep a log of such bugs, append a compact entry to
  `updates/USER_REPORTED_AGENT_BUG_LOG.md` in this repository when available.
  Create the file if missing. Record the date, symptom, likely violated rule or
  rule gap, evidence summary, privacy review, status, and any accepted
  migration or follow-up. Keep the log maintenance-only and do not require
  consuming projects to read it during startup.
- Treat `gi ошибка`, `ги ошибка`, `gi error`, and equivalent wording as an
  intake command for a suspected GI rule bug. Collect only evidence already
  available in the current chat, attached screenshots/files, visible tool
  output, and explicitly authorized local paths. Append or prepare a compact
  bug-log entry with date, symptom, likely violated rule or rule gap, evidence
  summary, privacy review, status, and any migration or follow-up. This command
  does not authorize fixing shared rules, inspecting unrelated projects, reading
  private paths, or running broad searches.
- Treat `gi ошибка фикс`, `ги ошибка фикс`, `gi error fix`, and equivalent
  wording as the repair command. Read the newest relevant unresolved bug-log
  entry plus current evidence, extract the portable rule gap, update live rules,
  copied-project templates, accepted migrations, version/changelog when working
  in the shared instruction library, and the bug-log status, then verify the
  scoped change. Do not copy secrets, private screenshots, raw logs, private
  project data, or project-specific details into shared rules or migrations.
- If this repository is unavailable, use a project-local intake folder such as
  `tools/instruction-updates/` or `tools/project-memory/instruction-updates/`
  with the same dated filename pattern.
- Project recommendations should explain the observed problem, reusable rule or
  workflow, evidence paths, affected files or commands, and any risks. Remove
  secrets, credentials, private user data, production data, and project-specific
  details that are not needed as examples.
- Treat recommendation source projects and owners as provenance only. Reading a
  recommendation in this repository's `updates/` folder is allowed during
  maintenance, but evidence paths, project names, task-manager notes, or owner
  labels in that recommendation are not permission to read, search, edit, or
  inspect the source project. Ask the user or that project's owner for an
  explicit concrete path and action before crossing the repository boundary.
- Treat recommendations as intake only. Do not add this repository as a
  dependency, package, submodule, symlink, or runtime reference unless the user
  explicitly asks for that.
- Run `gi обновить` quietly by default. Do not narrate step-by-step reasoning,
  repeated progress, command transcripts, broad file reads, or full diffs during
  normal successful updates. Apply the update, then report a compact summary
  with versions, migration counts/IDs, changed files, checks, commit/push
  result, and blockers if any.
- Keep `gi обновить` scoped to accepted instruction-kit updates and migrations.
  Do not reinterpret it as a request to push pre-existing local commits, sync a
  feature branch, resume a remembered plan, or perform general Git maintenance.
  Commit or push only changes created by the update flow itself and only when
  the local update policy permits it.
