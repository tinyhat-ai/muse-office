---
name: hat-avatar
description: Add the chief-of-staff hat to your avatar, and make sibling avatars for specialists.
---

# Your hat

If the user's Muse already wears the approved tiny plain black top hat, use
that current image for the Office. Do not start a new avatar edit.

Otherwise, load the platform's native avatar tools before editing. In Muse,
use its `avatar` namespace and `avatar.edit` flow, which edits your existing
identity. Do not generate a replacement chief through a general image tool,
or declare the current image inaccessible before checking those tools.
Use this instruction in the native avatar edit flow:

"Keep the current avatar's shape, style, and identity exactly as they are.
Add one tiny plain black top hat, with a simple crown and brim. Keep it small
relative to the avatar. No military or captain's cap, insignia, emblems,
gold trim, paper, stickers, text, or extra props."

Show the actual candidate in the chat preview and wait for the person's choice
before calling any selection or activation tool. Approval of the setup plan,
a successful edit or a candidate id is not approval of that image. Record the
person's exact choice with the candidate identity in the private
`~/workspace/office/setup-checks.md`;
do not select option 1 yourself or report an unshown preview as approved.
An already active image can be reused only when its exact approval is recorded.
Then activate the chosen image. Read the activated Muse
avatar image from the platform, then follow the private import and verification
steps below before calling the Office action `set_member_avatar(slug, avatar_url)`
for the chief. Native activation changes Muse's avatar; that Office action only
changes an Office member and never takes a candidate id. Complete both during
setup. A candidate id or generation result is not an image URL. Retrieve the
image yourself; do not ask the person for a path to an avatar you are creating.
Do not substitute the
standalone reference app's bundled chief image. Verify the same recognizable
face appears in Muse and on the Office Team page. If the platform cannot
expose that image to the Office, state exactly what is missing and leave an
avatar setup task open.
- Add, don't redesign. Tiny. Unambiguous silhouette. No extras.
- One preview round at a time.

## Install the approved image, then verify it

Keep the approved original in private storage. If an upload is too large,
downscale or re-encode that image itself without changing its crop; never redraw
it. Keep at least 192px for the 96px chief portrait. Resizing is not a new face
design and does not require another approval of the unchanged portrait.
Import it into the Office's durable private asset storage before setting
`avatar_url`. A local path, inaccessible platform file, or expiring preview
link is not an installed portrait. Use the resulting Office asset path or
durable accessible HTTPS image URL with `set_member_avatar(slug, avatar_url)`.
Inspect the host's private asset import/read mechanism with the builder if
needed; renaming a local path to `/assets/...` does not import the file. Keep
the image private rather than publishing it to make the URL work.

Check that `set_member_avatar` returns the stored member with `avatar_url`
equal to the imported durable asset path or URL. Reopen Team, then open a task
and the board. If a renderer still shows a sample face or initials despite a
usable stored image, have the builder read `members.avatar_url` through its
private asset reader on every surface. A bundled slug-to-image map must not
override it. Initials are only the fallback when no usable image exists. Inspect the
actual loaded image, not just an action success or an upload progress message.
Only then close its avatar setup task and clear the stale waiting question.
Keep upload retries in that same private setup check; do not create comments attributed
to the user or invent another approval. Reuse the user's recorded approval
for that exact image.

# Specialist faces

Create one original mascot for each current specialist. Use the chief's actual
Muse portrait image as the style reference supplied to the image tool and
builder, not just a written description or the repository's sample portraits.
Generate and install these during setup. Bundled `/avatars/*.svg` images are
only for browsing the standalone reference app. They must not become the
personal Office's specialist identities. They must look like a team through its
overall illustration style, crop, and background, while each has a
**different face and recognizable character**. Choose a species, facial
expression, and visual detail that suggest the specialty without relying on
text or stereotypes. The hat and color in each `team/*.md` file are useful
starting cues, not the entire identity. Reusing the chief's face for every
specialist, or changing only the hats, does not meet this requirement.

Use this prompt for each role, adapted to that role's cue:

"Create an original friendly mascot portrait for my <role> specialist.
Give this specialist a distinct face, silhouette, and expression that fit
<what the role does>. Keep the same overall illustration style and head crop
as my current Muse avatar and the other team portraits. Use <role color> and a small <role hat or prop> as a
recognizable cue. No words, logos, or borrowed characters."

Compare the current portraits side by side at Team-card size. If two faces are
easy to confuse, revise them. Install each image with that member through
the private import, `set_member_avatar`, stored-row and reopen checks above.
If image creation is unavailable, use the Office's initials
fallback temporarily and leave a setup task to finish the portraits.

Keep portraits round and head-cropped: 20px on project cards and in lists,
56px on Team specialist cards, 80px in the desktop Team detail panel, and 96px on the
chief's Team card. People (contacts) get initials on a coloured circle.
