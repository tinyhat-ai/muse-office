# Releasing

A release is a tag `vX.Y.Z` on `main` and a GitHub release with the same
name. `channels/latest` follows the newest published release, while
`channels/lts` is the stable promotion channel. The Muse landing page copies
`hat/PROMPT.md` from LTS, so work merged to `main` does not change the
message people send their Muse until the stable channel is promoted. In
v0.0.1, that message still links to build files on `main`; promoting the
channel pins the message text, not all files Muse will read.

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
5. Advance `channels/latest` to the tested release. Advance `channels/lts`
   when that release should become the stable promotion message. After merge,
   compare the promoted channel's files with the release and check its raw
   message:

   ```bash
   git fetch origin --tags
   git diff --quiet vX.Y.Z origin/channels/latest
   curl -fsS https://raw.githubusercontent.com/tinyhat-ai/muse-office/channels/latest/hat/PROMPT.md
   ```

   When promoting LTS too, run the same checks for `origin/channels/lts` and
   `https://raw.githubusercontent.com/tinyhat-ai/muse-office/channels/lts/hat/PROMPT.md`.

   A GitHub merge or squash can put a new commit on the channel with the same
   files as the tag; compare content, not only commit IDs. Keep an existing
   LTS in place when a new release needs more time in Latest.

## Compatibility

The actions' names and arguments (`spec/ACTIONS.md`) and the database schema
(`db/schema.sql`) are the contract between a Muse and its Office. Changing
either is a minor bump at least, and the changelog entry must say what a
Muse has to change in an Office it already built.
