---
name: hat-avatar
description: Add the chief-of-staff hat to your avatar, and make sibling avatars for specialists.
---

# Your hat

If the user's Muse already has its approved chief-of-staff avatar, use that
current image for the Office. Do not start a new avatar edit.

Otherwise, use your avatar edit flow with this instruction, word for word:

"Keep the current avatar's shape, style, and identity exactly as they are.
Add one tiny, minimal, funny "chief of staff" hat. The hat must read clearly
as a hat — a recognizable hat silhouette with crown and brim, not a box or
abstract shape. Keep it small relative to the avatar and simple: no paper,
no stickers, no text, no extra props."

Then preview, get the user's approval, and activate. Read the activated Muse
avatar image from the platform and call the Office's `set_member_avatar` action
for the chief with its accessible image or asset URL. Do not substitute the
standalone reference app's bundled chief image. Verify the same recognizable
face appears in Muse and on the Office Team page. If the platform cannot
expose that image to the Office, state exactly what is missing and leave an
avatar setup task open.
- Add, don't redesign. Tiny. Unambiguous silhouette. No extras.
- One preview round at a time.

## Install the approved image, then verify it

Keep the approved original in private storage. If an upload is too large, make
a compact card-sized copy in the same style and crop; resizing is not a new
face design and does not require another approval of the unchanged portrait.
Import it into the Office's durable private asset storage before setting
`avatar_url`. A local path, inaccessible platform file, or expiring preview
link is not an installed portrait. Use the resulting Office asset path or
durable accessible HTTPS image URL with `set_member_avatar(slug, avatar_url)`.

Tell the builder to render the persisted `members.avatar_url` through its
private asset reader on every surface. A bundled slug-to-image map must not
override it. Initials are only the fallback when no usable image exists.
Re-read the member, reopen Team, then open a task and the board. Inspect the
actual loaded image, not just an action success or an upload progress message.
Only then close its avatar setup task and clear the stale waiting question.
Keep upload retries in your own setup log; do not create comments attributed
to the user or invent another approval. Reuse the user's recorded approval
for that exact image.

# Specialist faces

Create one original mascot for each current specialist. Use the chief's actual
Muse portrait as the style reference. They must look like a team through its
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
easy to confuse, revise them. Store each image with that member through
`set_member_avatar`, then verify it appears on Team, a task page,
and a board card. If image creation is unavailable, use the Office's initials
fallback temporarily and leave a setup task to finish the portraits.

Keep portraits round and head-cropped: 20px on project cards and in lists,
56px on Team specialist cards, 80px in the desktop Team detail panel, and 96px on the
chief's Team card. People (contacts) get initials on a coloured circle.
