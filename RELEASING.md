# Releasing

A release is a tag `vX.Y.Z` on `main` and a GitHub release with the same
name. `channels/latest` follows the newest published release, while
`channels/lts` is the stable promotion channel. The Muse landing page copies
`hat/PROMPT.md` from LTS, so work merged to `main` does not change the
message people send their Muse until the stable channel is promoted. The
hat resolves that same LTS channel once to a commit and uses it for every build file. Promote the complete tested
release before shipping website copy that describes its new behavior.
When testing unreleased changes, explicitly give Muse the candidate commit
and have it read every build file from that commit instead of the LTS links.
Keep the public copy button on LTS until promotion is complete.

Both channel branches are protected and restricted to the maintainer. Agents
can prepare reviewable promotion PRs but cannot move those branches themselves.

## Steps

1. Bump `VERSION` and the `version:` line in `hat/HAT.md` to the same value.
2. Add a section to `CHANGELOG.md` with the date and what changed, in plain
   words a Muse can read back to its person ("what changed" in the hat's
   weekly update check comes from here).
3. Open a PR titled `vX.Y.Z` and obtain maintainer review before merge.
4. Write release notes in a local Markdown file, tag the merged commit, and
   publish the GitHub release:

   ```bash
   git tag -a vX.Y.Z -m "vX.Y.Z"
   git push origin vX.Y.Z
   gh release create vX.Y.Z --title vX.Y.Z --notes-file /tmp/muse-office-release-notes.md
   ```

   Mark `-rc.N` versions as pre-releases; only finals are "Latest". The first
   published final release is `v0.0.1`. That first release used a lightweight
   tag and hand-written release notes; the commands above are for later releases.
5. Open review PRs from the tested release tag to `channels/latest` and, when
   it should become the stable promotion message, `channels/lts`. After review
   and maintainer approval, the maintainer fast-forwards each protected ref
   directly to the tag commit. Do not use GitHub's Merge button: merge, squash,
   and rebase create a different commit on the channel and can break the next
   fast-forward. Replace `TAG_SHA` with `git rev-parse vX.Y.Z^{commit}`:

   ```bash
   gh api --method PATCH repos/tinyhat-ai/muse-office/git/refs/heads/channels/latest \
     -f sha=TAG_SHA -F force=false
   git ls-remote https://github.com/tinyhat-ai/muse-office \
     refs/heads/channels/latest 'refs/tags/vX.Y.Z^{}'
   curl -fsS https://raw.githubusercontent.com/tinyhat-ai/muse-office/channels/latest/hat/PROMPT.md
   ```

   Both `ls-remote` lines must show the tag commit SHA. When promoting LTS,
   apply the same ref update and checks to `channels/lts` and
   `https://raw.githubusercontent.com/tinyhat-ai/muse-office/channels/lts/hat/PROMPT.md`.
   `force=false` rejects a non-fast-forward. Keep an existing LTS in place
   when a new release needs more time in Latest.

## Compatibility

The actions' names and arguments (`spec/ACTIONS.md`) and the database schema
(`db/schema.sql`) are the contract between a Muse and its Office. Changing
either is a minor bump at least, and the changelog entry must say what a
Muse has to change in an Office it already built.

For the next release, call out the new completion and comment contracts:
create tasks open; verify every Done-when criterion before `move_task` to Done;
provide `result_summary` and `verification`; answer comments on their original
page before marking them read. Update scheduled checks to consume the durable,
paginated `list_office_updates` feed, saving its checkpoint after handling the
whole batch. Also drain `list_recent_updates` for unread comment retries,
including project comments. New Offices default to a one-minute check. Inspect
the running job and record its actual interval in `comment_check_minutes`;
preserve an existing user's chosen schedule and clear the setting if its job
stops. Keep the existing Office's records and customizations.

The Tasks board groups cards by status and filters them by user-managed
projects. Apply the additive `archived_at` and `office_updates` schema changes;
archive projects reversibly. Project progress is completed tasks / all tasks,
and task progress is verified Done-when checks / all checks. An older task with
no criteria has unknown progress until criteria are defined. Preserve existing
portraits, files, comments, and task-to-project links during the upgrade.
