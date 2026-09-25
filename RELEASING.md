# Releasing

A release is a tag `vX.Y.Z` on `main` and a GitHub release with the same
name. tinyhat.ai serves `hat/HAT.md` from `main`, so a Muse that checks for
updates sees the new version as soon as the release PR merges.

## Steps

1. Bump `VERSION` and the `version:` line in `hat/HAT.md` to the same value.
2. Add a section to `CHANGELOG.md` with the date and what changed, in plain
   words a Muse can read back to its person ("what changed" in the hat's
   weekly update check comes from here).
3. Open a PR titled `vX.Y.Z`. Merge it.
4. Tag and publish:

   ```bash
   git tag vX.Y.Z && git push origin vX.Y.Z
   gh release create vX.Y.Z --title vX.Y.Z --notes-from-tag
   ```

   Mark `-rc.N` versions as pre-releases; only finals are "Latest".

## Compatibility

The actions' names and arguments (`spec/ACTIONS.md`) and the database schema
(`db/schema.sql`) are the contract between a Muse and its Office. Changing
either is a minor bump at least, and the changelog entry must say what a
Muse has to change in an Office it already built.
