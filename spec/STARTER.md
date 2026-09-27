# The first visit to Office

Build this with Office actions after the person approves the promotion. When running the repository app for that person, set `OFFICE_SEED=none` before first start and confirm its database is empty. The default reference-app starter and these action calls are alternative setup paths, never consecutive steps. If an Office already exists, inspect and update its records in place. Use the person's real name, their Muse's name, and the specialist names the Muse chose. All pages must show a useful example of their purpose on the first visit. Treat every unfinished task as a proposed next step; never claim a source was connected, a message was sent, or work was completed when it was not.

## Projects and Notes

Start with three familiar groups: **Work**, **Personal**, and **Office**. They are replaceable starting choices; Muse can rename, add, or remove projects through chat to suit the person. A project groups related tasks; keep all tasks visible together on the board with project filters. Apply this starter only to a new, empty Office; never regroup or replace an existing user's work automatically.

Keep the initial board to four useful tasks:

| Project | Task | Initial state |
| --- | --- | --- |
| Office | Set up the specialist team | Done after setup is actually checked, with a closing report |
| Office | Build the Office workspace | Done after the app is checked, with a closing report |
| Work | Choose one priority for this week | Waiting on you: ask which work priority the team should start with |
| Personal | Choose a personal task to hand over | To do: ask what the person wants help with; assume no access to private records |

Do not invent answers or work for each sample specialist. Start new tasks as the person shares actual priorities.

Create three tagged notes in plain words:

1. **How your Office works** (pin it; tags `office`, `start here`): the chief takes requests in chat, routes substantial work to specialists, and records task progress and decisions here. The person comments on task, note and project pages and asks the chief to change other pages. Include a small Markdown table of the team roles and a fenced `mermaid` flowchart showing request → routing → specialist → Office result. Use a top-to-bottom flow so its labels remain readable in the note's width. Confirm both render on the note page.
2. **Your first week** (tags `office`, `first week`): list the first tasks above and the one priority question. Mark each dependency as unanswered until the person answers.
3. **Where your information comes from** (tags `sources`, `reports`, `customers`): explain that Customers grows from real people the person names or communication channels they choose to share; business Reports grow from verified work sources. Access requires the person's choice, and outgoing communication waits for their approval.

## Customers

Add the person and Tinyhat support as **contacts outside the funnel** using `upsert_contact {in_funnel: false}`. The person's name and details come from the conversation; if not known, use `You` with a note asking for details. Tinyhat support is the maker of this hat (`https://tinyhat.ai`, `support@tinyhat.ai`). These entries orient the person on the page and count as no leads or customers. Do not invent a customer, company, email thread, funnel stage, or sales activity. As the chief works through channels the person has chosen to share, add real people, interactions, and next steps through actions. The page tells the person this will happen.

## Reports

Create these **published examples first**, in section `Around the world`, using `upsert_report` with the chart type shown, `source`, and `source_url`. Load the exact `record_metric` pairs shown. Write the unit and source year into each description. This section is labeled as examples; it is never presented as the person's business data. Published values can be revised later only after checking the source again.
Plot years from oldest to newest left to right, regardless of the order in which action calls finish. Check the year labels in the rendered chart, not only the metric rows.

| Slug and title | Chart | Metrics (`label`: `value`) | Unit and source |
| --- | --- | --- | --- |
| `world-population` · World population (millions) | `bars` | `1950`: `2500`; `2000`: `6200`; `2024`: `8200` | Rounded historical estimates in millions. [UN World Population Prospects 2024](https://population.un.org/wpp/). |
| `olympic-women` · From 22 to 5,300 women at the Games | `timeline` | `1900`: `22`; `1924`: `135`; `2024`: `5300` | Actual women athletes, not advance quota places. [Paris 2024 official report](https://library.olympics.com/digitalCollection/DigitalCollectionAttachmentDownloadHandler.ashx?documentId=3702240&parentDocumentId=3598869&skipCopyright=true&skipWatermark=true). |
| `recorded-music` · Recorded music revenue (US$ billions) | `bars` | `2023`: `28.6`; `2024`: `29.6` | Global recorded-music trade revenue, US$ billions. [IFPI 2024 report](https://www.ifpi.org/wp-content/uploads/2024/04/GMR_2024_State_of_the_Industry.pdf), [IFPI 2025 report](https://www.ifpi.org/ifpi-amidst-highly-competitive-market-global-recorded-music-revenues-grew-4-8-in-2024/). Use the 2025 report as `source_url`. |
| `earth-surface` · The blue planet | `donut` | `Land`: `29`; `Ocean`: `71` | Approximate share of Earth's surface, percent. [NASA Earth facts](https://science.nasa.gov/earth/facts/). |

Create the eight **Your business** and **Your money** report definitions from `spec/SCHEMA.md`, but **do not display their cards while they have no verified figures**. The first view of Reports must show the four real visual charts above, including the timeline and donut, not a grid of empty text cards. As the team verifies the person's own data, add metrics and reveal each chart. Never substitute example or fabricated numbers. The person can ask the chief in chat for a new report about what matters to them.

## Team faces

Set the chief's Team portrait from that Muse's actual current avatar image using `set_member_avatar`; preserve the recognizable face and its small top hat. The bundled chief image is only for the standalone preview. Each specialist receives a **different face and mascot** that fits its specialty, not a recolored copy of the chief. Match the Muse avatar's overall illustration style and crop so the team belongs together. See `hat/skills/hat-avatar/SKILL.md` for creation, review, and the avatar action. If image creation or the chief avatar asset is unavailable, show initials temporarily and leave avatar creation as a visible setup task.
