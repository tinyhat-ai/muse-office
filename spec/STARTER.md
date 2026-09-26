# The first visit to Office

Build this with Office actions after the person approves the promotion. When running the repository app for that person, set `OFFICE_SEED=none` before first start and confirm its database is empty. The default reference-app starter and these action calls are alternative setup paths, never consecutive steps. If an Office already exists, inspect and update its records in place. Use the person's real name, their Muse's name, and the specialist names the Muse chose. All pages must show a useful example of their purpose on the first visit. Treat every unfinished task as a proposed next step; never claim a source was connected, a message was sent, or work was completed when it was not.

## Projects and Notes

Projects group related tasks. Website, Marketing, Customers, Money, and General
are sample umbrellas, which the person can add to, rename, archive, or restore.
Use General for the Office setup tasks; a landing-page launch belongs as a task
in Website. Keep the initial board small: two actual setup completions, one
proposed task per other project, and one priority question. Never populate a
speculative backlog. Finish **Set up the specialist team** and **Build the Office
app** only after inspecting their results, with all criteria met, a verified
closing report, and loaded portraits. Leave unfinished work open. Give each
proposed task a short, meaningful Done when checklist with unmet checks: for
example site link recorded and brand material linked. The board shows verified
checks, never a guessed percentage.

| Project | First task | What its page explains |
| --- | --- | --- |
| Website | Gather the current site and brand links | The designer reviews what exists before suggesting changes. Ask for the site link when it is missing. |
| Marketing | Draft a first-week communication plan | The marketer asks what the person sells and who they want to reach before drafting. Nothing is published yet. |
| Customers | Map where customer conversations arrive | Sales asks which email or messaging channels may be read. It records only real people it finds or the person names. |
| Money | Find where invoices and receipts live | The bookkeeper asks which records may be read and what period to start with. It never pays or sends anything. |

Put **Choose one priority for this week** in Waiting on you, with one direct question. This is the first decision the chief needs; it gives the board a real reason to use that lane. Do not invent a reply.

Create three tagged notes in plain words:

1. **How your Office works** (pin it; tags `office`, `start here`): explain first that Tinyhat gives the starting instructions and Muse builds this first version for the person. They can ask Muse to change the layout, pages, team, or communication style. Voice summaries are a personal choice. The chief takes requests in chat, routes substantial work to specialists, and records task progress and decisions here. The person comments on project, task, and note pages. State the verified comment-check schedule, who follows up, and that replies appear on the same page. Show how Request changes reopens a completed task. The person asks the chief to change other pages. Include a small Markdown table of the team roles and a fenced `mermaid` flowchart showing request → routing → specialist → Office result. Use a top-to-bottom flow so its labels remain readable in the note's width. Confirm both render on the note page.
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
