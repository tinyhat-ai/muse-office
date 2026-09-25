# Releasing

A release is a tag `vX.Y.Z` on `main` and a GitHub release with the same
name. `channels/latest` follows the newest published release, while
`channels/lts` is the stable promotion channel. The Muse landing page copies
`hat/PROMPT.md` from LTS, so work merged to `main` does not change the
message people send their Muse until the stable channel is promoted.

Both channel branches are protected and restricted to the maintainer. Agents
can prepare reviewable promotion PRs but cannot move those branches themselves.

## Steps

1. Bump `VERSION` and the `version:` line in `hat/HAT.md` to the same value.
2. Add a section to `CHANGELOG.md` with the date and what changed, in plain
   words a Muse can read back to its person ("what changed" in the hat's
   weekly update check comes from here).
3. Open a PR titled `vX.Y.Z` and obtain maintainer review before merge.
4. Tag the merged commit and publish the GitHub release:

   ```bash
   git tag vX.Y.Z && git push origin vX.Y.Z
   gh release create vX.Y.Z --title vX.Y.Z --notes-from-tag
   ```

   Mark `-rc.N` versions as pre-releases; only finals are "Latest". The first
   published final release is `v0.0.1`.
5. Advance `channels/latest` to the tested release. Advance `channels/lts`
   when that release should become the stable promotion message. Verify the
   branch heads and both raw `hat/PROMPT.md` URLs after promotion. Keep an
   existing LTS in place when a new release needs more time in Latest.

## Compatibility

The actions' names and arguments (`spec/ACTIONS.md`) and the database schema
(`db/schema.sql`) are the contract between a Muse and its Office. Changing
either is a minor bump at least, and the changelog entry must say what a
Muse has to change in an Office it already built.
