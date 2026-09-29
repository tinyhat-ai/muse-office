# Releasing

A release is a tag `vX.Y.Z` on `main` and a GitHub release with the same
name. `channels/latest` follows the newest published release, while
`channels/lts` is the stable promotion channel. The Muse landing page copies
`hat/PROMPT.md` from LTS, so work merged to `main` does not change the
message people send their Muse until the stable channel is promoted. The
current message still links to build files on `main`; promoting the
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

   Before promoting LTS, check that the production landing page can copy the
   candidate message: `https://tinyhat.ai/muse/prompt` must accept its format.
   If the release changes the copying format, deploy and test the compatible
   landing page first. After promotion, verify the production response, not
   just the raw GitHub file:

   ```bash
   git show vX.Y.Z:hat/PROMPT.md > /tmp/muse-office-release-prompt.md
   curl --fail --silent --show-error https://tinyhat.ai/muse/prompt \
     -o /tmp/muse-office-production-message.txt
   node --input-type=module <<'JS'
   import assert from 'node:assert/strict';
   import { readFileSync } from 'node:fs';
   const source = readFileSync('/tmp/muse-office-release-prompt.md', 'utf8');
   const sections = source.replace(/\r\n/g, '\n').split(/^---\s*$/m);
   assert.equal(sections.length, 3);
   const normalize = (text) => text.trim().replace(/\s+/g, ' ');
   assert.equal(
     normalize(readFileSync('/tmp/muse-office-production-message.txt', 'utf8')),
     normalize(sections[1])
   );
   console.log('Production copies the complete released message.');
   JS
   ```

   Allow up to five minutes for the existing caches to refresh. Then open
   `https://tinyhat.ai/muse` and verify **Copy the message** succeeds. If the
   endpoint returns an error or the text differs, restore the previous LTS
   commit and fix the landing page before trying the promotion again. Do not
   report LTS ready while production copying is broken.

## Compatibility

The actions' names and arguments (`spec/ACTIONS.md`) and the database schema
(`db/schema.sql`) are the contract between a Muse and its Office. Changing
either is a minor bump at least, and the changelog entry must say what a
Muse has to change in an Office it already built.
