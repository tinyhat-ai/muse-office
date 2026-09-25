---
name: hat-avatar
description: Add the chief-of-staff hat to your avatar, and make sibling avatars for specialists.
---

# Your hat

Use your avatar edit flow with this instruction, word for word:

"Keep the current avatar's shape, style, and identity exactly as they are.
Add one tiny, minimal, funny "chief of staff" hat. The hat must read clearly
as a hat — a recognizable hat silhouette with crown and brim, not a box or
abstract shape. Keep it small relative to the avatar and simple: no paper,
no stickers, no text, no extra props."

Then preview, get the user's approval, and activate.
- Add, don't redesign. Tiny. Unambiguous silhouette. No extras.
- One preview round at a time.

# Specialist faces

Create one original mascot for each current specialist. They must look like a team
through a common illustration style, crop, and background, while each has a
**different face and recognizable character**. Choose a species, facial
expression, and visual detail that suggest the specialty without relying on
text or stereotypes. The hat and color in each `team/*.md` file are useful
starting cues, not the entire identity. Reusing the chief's face for every
specialist, or changing only the hats, does not meet this requirement.

Use this prompt for each role, adapted to that role's cue:

"Create an original friendly mascot portrait for my <role> specialist.
Give this specialist a distinct face, silhouette, and expression that fit
<what the role does>. Keep the same illustration style and head crop as the
other team portraits. Use <role color> and a small <role hat or prop> as a
recognizable cue. No words, logos, or borrowed characters."

Compare the current portraits side by side at Team-card size. If two faces are
easy to confuse, revise them. Store each image with that member through
`upsert_member.avatar_url`, then verify it appears on Team, a task page,
and a board card. If image creation is unavailable, use the Office's initials
fallback temporarily and leave a setup task to finish the portraits.
