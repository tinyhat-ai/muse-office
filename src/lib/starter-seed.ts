import type Database from "better-sqlite3";

/** The default first visit: genuine Office setup, proposed work, and cited public data. */
export function seedStarter(db: Database.Database) {
  const now = new Date().toISOString();
  db.transaction(() => {
    const member = db.prepare(`INSERT INTO members
      (slug, name, role, hat, job, avatar_url, color, does_json, never, skills_json, is_chief, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    const members: Array<[string, string, string, string, string, string, string, string[], string, string[], number]> = [
      ["chief", "Muse", "Chief of staff", "top hat", "Turns your requests into tracked work and coordinates the team.", "/avatars/chief.svg", "#ebe0cb", ["Routes work to the right specialist", "Checks progress and records decisions", "Reports back in chat"], "Sends, buys, publishes, or deletes without your approval.", ["Briefing", "Review", "Routing"], 1],
      ["designer", "Vera", "Designer", "red beret", "Designs the visual work and presents choices before polishing one.", "/avatars/designer.svg", "#f3d2d9", ["Shows three design options", "Keeps the brand guide current", "Hands approved designs to the developer"], "Publishes a design without your approval.", ["Brand guide", "Visual design"], 0],
      ["developer", "Theo", "Developer", "knit beanie", "Builds the website, small tools, and automations.", "/avatars/developer.svg", "#cddcee", ["Builds preview links", "Documents how things run", "Checks that changes work"], "Launches or buys a service without your approval.", ["Website", "Automation"], 0],
      ["marketer", "June", "Marketer", "bellhop cap", "Plans communication and drafts content in your voice.", "/avatars/marketer.svg", "#f3e2a4", ["Plans what to say and where", "Drafts messages for review", "Reports what worked"], "Posts or sends without your approval.", ["Content plan", "Campaigns"], 0],
      ["sales", "Sam", "Sales", "deerstalker", "Keeps track of customer conversations and the next useful step.", "/avatars/sales.svg", "#d8e7d3", ["Records real leads and customers", "Drafts follow-ups", "Keeps next steps current"], "Invents contacts or sends a follow-up without your approval.", ["Contacts", "Follow-ups"], 0],
      ["bookkeeper", "Otto", "Bookkeeper", "navy bowler", "Organizes invoices, receipts, bills, and money reports.", "/avatars/bookkeeper.svg", "#e3dcf0", ["Categorizes real records", "Highlights bills that need attention", "Updates sourced reports"], "Pays or moves money without your approval.", ["Invoices", "Expenses", "Bills"], 0],
    ];
    members.forEach(([slug, name, role, hat, job, avatar, color, does, never, skills, chief], i) =>
      member.run(slug, name, role, hat, job, avatar, color, JSON.stringify(does), never, JSON.stringify(skills), chief, i));

    const project = db.prepare(`INSERT INTO projects
      (slug, name, description, color, color_dark, lead, kind, process_markdown, done_when, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    const step = db.prepare(`INSERT INTO process_steps (project, position, name, who, note, needs_you) VALUES (?, ?, ?, ?, ?, ?)`);
    const projects: Array<[string, string, string, string, string, string, string, number]> = [
      ["website", "Collect your website brief", "Gather the site and brand material the team needs before proposing changes.", "#f2e4a9", "#b89a3a", "developer", "Build", 0],
      ["marketing", "Plan your first week of outreach", "Agree on your audience, offer, and first communication plan.", "#d5eaea", "#2f8a8a", "marketer", "Publish", 1],
      ["customers", "Set up customer follow-ups", "Choose where the team should find real conversations and next steps.", "#d8e7d3", "#5b8a5a", "sales", "Follow up", 2],
      ["money", "Prepare your first money review", "Choose the records and time period for a useful first money report.", "#e3dcf0", "#7e6aa6", "bookkeeper", "Money", 3],
      ["general", "Get your Office ready", "Set up your workspace and choose the team's first priority.", "#e9e7df", "#9a978c", "chief", "General", 4],
    ];
    for (const [slug, name, description, color, dark, lead, kind, order] of projects) {
      project.run(slug, name, description, color, dark, lead, kind,
        `## How work moves\n\n1. **Understand:** record your goal and the real source.\n2. **Work:** the project lead coordinates the specialists and keeps the task updated.\n3. **Review:** you approve anything that leaves your Office.\n4. **Close:** record the result and what the team learned.`,
        "The result and any decision are recorded in a task or note.", order);
      step.run(slug, 0, "Understand", lead, "Record the goal and source.", 0);
      step.run(slug, 1, "Work", lead, "Keep progress on the task page.", 0);
      step.run(slug, 2, "Your OK", "you", "Approve any external action.", 1);
      step.run(slug, 3, "Close", "chief", "Record the result and learning.", 0);
    }

    const task = db.prepare(`INSERT INTO tasks
      (id, project, title, specialist, column_name, step, question, question_kind, note, job_definition, created_at, updated_at, done_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    const update = db.prepare(`INSERT INTO task_updates (task, author, kind, body, created_at) VALUES (?, ?, ?, ?, ?)`);
    const tasks: Array<[string, string, string, string, string, number, string | null, string | null, string, string]> = [
      ["team-ready", "general", "Set up the specialist team", "chief", "done", 3, null, null, "Five specialist roles prepared", "The Office roster and each role's responsibilities are documented. Muse checks that every specialist has its own workspace and face."],
      ["office-ready", "general", "Build the Office workspace", "developer", "done", 3, null, null, "Projects, Team, Customers, Reports, Notes", "The five Office pages and their data actions are available. This starter workspace shows how each page is used."],
      ["first-priority", "general", "Choose one priority for this week", "chief", "waiting_on_you", 2, "What is the one work priority you want the team to start with this week?", "answer", "The team can start with one clear goal", "Ask for the user's actual priority before assigning real work. Record the answer here and turn it into a plan."],
      ["site-links", "website", "Gather your current site and brand links", "designer", "todo", 0, null, null, "Ask for what already exists", "Review any existing site and brand material before suggesting changes. Ask the user for links when they are missing."],
      ["communication-plan", "marketing", "Draft a first-week communication plan", "marketer", "todo", 0, null, null, "Start from your audience and offer", "Ask what the user offers and whom they want to reach. Draft a short plan; do not publish it."],
      ["work-channels", "customers", "Map where customer conversations arrive", "sales", "todo", 0, null, null, "Only channels you choose to share", "Ask which work email or messaging channels the user wants the team to read. Record only people found there or named by the user."],
      ["money-sources", "money", "Find where invoices and receipts live", "bookkeeper", "todo", 0, null, null, "No account access assumed", "Ask which records may be read and what period to start with. Never pay or send anything from this task."],
    ];
    for (const [id, projectSlug, title, specialist, column, position, question, questionKind, note, definition] of tasks) {
      task.run(id, projectSlug, title, specialist, column, position, question, questionKind, note, definition, now, now, column === "done" ? now : null);
      if (column === "done") {
        const summary = id === "team-ready" ? "The starter roster and responsibilities are available on Team. Ask Muse to adapt them to your work." : "Projects, Team, Customers, Reports, and Notes are ready to explore.";
        const verification = id === "team-ready" ? "Six member records were created: the example chief and five specialist roles. This reference roster does not create agents in your Muse." : "The reference app includes the five pages and their data actions. Muse builds and checks your own Office during setup.";
        db.prepare("UPDATE tasks SET result_summary = ?, verification = ?, result_url = ? WHERE id = ?").run(summary, verification, id === "team-ready" ? "/team" : "/projects", id);
        db.prepare("INSERT INTO task_checks (task, position, text, met) VALUES (?, 0, ?, 1)").run(id, id === "team-ready" ? "Starter roster and responsibilities recorded" : "Office reference pages and actions included");
        update.run(id, "chief", "update", `${summary}\n\n${verification}`, now);
      }
      if (question) update.run(id, "chief", "question", question, now);
    }

    const contact = db.prepare(`INSERT INTO contacts
      (slug, name, company, stage, in_funnel, source, next_step, notes_json, created_at, updated_at)
      VALUES (?, ?, ?, 'past', 0, ?, ?, ?, ?, ?)`);
    contact.run("you", "You", "Your work", "Office setup", "Tell Muse what name and work details to use", JSON.stringify(["The team records your details only as you provide them."]), now, now);
    contact.run("tinyhat", "Tinyhat support", "Tinyhat", "Maker of this hat", "Check for Office hat updates when needed", JSON.stringify(["https://tinyhat.ai", "support@tinyhat.ai", "This is a support contact, not a lead."]), now, now);
    db.prepare(`INSERT INTO touches (contact, channel, summary, by, happened_at) VALUES (?, 'note', ?, 'chief', ?)`).run("tinyhat", "Support contact saved so you can find who made the Office hat.", now);

    const report = db.prepare(`INSERT INTO reports
      (slug, section, title, description, chart, owner, source, source_url, sort_order, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    const metric = db.prepare(`INSERT INTO metrics (report, series, label, value, recorded_at) VALUES (?, NULL, ?, ?, ?)`);
    const publicReports: Array<[string, string, string, string, string, Array<[string, number]>]> = [
      ["world-population", "World population (millions)", "Rounded historical estimates, 1950 to 2024, in millions.", "UN World Population Prospects 2024", "https://population.un.org/wpp/", [["1950", 2500], ["2000", 6200], ["2024", 8200]]],
      ["olympic-women", "From 22 to 5,300 women at the Games", "Actual women athletes at the Paris Games in 1900, 1924, and 2024; selected years, not quota places.", "Paris 2024 official report", "https://library.olympics.com/digitalCollection/DigitalCollectionAttachmentDownloadHandler.ashx?documentId=3702240&parentDocumentId=3598869&skipCopyright=true&skipWatermark=true", [["1900", 22], ["1924", 135], ["2024", 5300]]],
      ["recorded-music", "Recorded music revenue (US$ billions)", "Global recorded-music trade revenue in 2023 and 2024.", "IFPI Global Music Report 2025", "https://www.ifpi.org/ifpi-amidst-highly-competitive-market-global-recorded-music-revenues-grew-4-8-in-2024/", [["2023", 28.6], ["2024", 29.6]]],
      ["earth-surface", "The blue planet", "About 71% of Earth's surface is ocean and 29% is land.", "NASA Earth facts", "https://science.nasa.gov/earth/facts/", [["Land", 29], ["Ocean", 71]]],
    ];
    publicReports.forEach(([slug, title, description, source, sourceUrl, values], i) => {
      report.run(slug, "Around the world", title, description, slug === "olympic-women" ? "timeline" : slug === "earth-surface" ? "donut" : "bars", null, source, sourceUrl, i, now);
      values.forEach(([label, value]) => metric.run(slug, label, value, now));
    });
    const futureReports: Array<[string, string, string, string, string, string]> = [
      ["website", "Your business", "Website visitors and inquiries", "Who found you, each week, when site data is available.", "bars", "developer"],
      ["new-customers", "Your business", "New customers", "Real leads and customers, each month.", "grouped-bars", "sales"],
      ["owed", "Your business", "Money owed to you", "Verified unpaid invoices and their due dates.", "list", "bookkeeper"],
      ["in-out", "Your business", "Money in and out", "Income and spending from records you share.", "grouped-bars", "bookkeeper"],
      ["spending", "Your money", "Spending by category", "Where money went, from verified receipts.", "stacked-bars", "bookkeeper"],
      ["bills", "Your money", "Bills coming up", "What is due and when, once bills are available.", "list", "bookkeeper"],
      ["subscriptions", "Your money", "Subscriptions", "Recurring costs found in your records.", "bars-horizontal", "bookkeeper"],
      ["savings", "Your money", "Savings the team found", "Money actually saved, with the evidence recorded.", "savings", "chief"],
    ];
    futureReports.forEach(([slug, section, title, description, chart, owner], i) =>
      report.run(slug, section, title, description, chart, owner, "Updates from work channels you choose to share", null, i, now));

    const note = db.prepare(`INSERT INTO notes
      (slug, project, title, lede, markdown, kept_by, tags_json, pinned, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'chief', ?, ?, ?, ?)`);
    note.run("how-your-office-works", "general", "How your Office works", "Where requests go, who works on them, and how you see progress.",
      `## The short version\n\n**Talk to Muse in chat.** Tinyhat gives Muse the starting instructions; Muse builds your own Office from them. This is a first version you can shape together. Ask Muse to change the layout, add a page, change the team, or adjust how often it updates you. Voice summaries are a personal choice. Muse turns substantial requests into tasks and briefs the right specialist. Projects shows the bigger picture; open a project for its tasks and results. You can comment on a project, task, or note to give the owner direction. Replies appear on the same page after Muse checks for comments. Ask Muse what schedule is active; for help now, send the page link in chat. Request changes on a completed task to reopen it. Ask Muse to change anything else.\n\n## Who does what\n\n| Specialist | Work |\n| --- | --- |\n| Muse | Coordinates, checks, and reports back |\n| Vera | Design |\n| Theo | Websites and tools |\n| June | Marketing |\n| Sam | Customer follow-ups |\n| Otto | Money records and reports |\n\n## How a request moves\n\n~~~mermaid\nflowchart TB\n  A[You ask Muse] --> B[Muse records the task]\n  B --> C[Specialist works]\n  C --> D[Muse checks and reports]\n  D --> E[Office keeps the result]\n~~~\n\n## Your approval\n\nThe team asks before sending, buying, publishing, or deleting anything.`,
      JSON.stringify(["office", "start here", "workflow"]), 1, now, now);
    note.run("your-first-week", "general", "Your first week", "The first useful questions and tasks, with no assumptions about your accounts.",
      `## One priority\n\nThe first decision is on the **Choose one priority for this week** task. Muse will use your answer to focus the team.\n\n## First steps\n\n- **Website:** Share any current site or brand links.\n- **Marketing:** Tell June what you offer and whom you want to reach.\n- **Customers:** Tell Sam which work conversations you want included.\n- **Money:** Tell Otto where invoices and receipts live, if you want money reports.\n\nNothing has been sent or connected yet.`,
      JSON.stringify(["office", "first week"]), 0, now, now);
    note.run("where-information-comes-from", "general", "Where your information comes from", "How Customers and Reports become useful as your team learns your work.",
      `## Customers\n\nSam adds **real people** you name or who appear in work channels you choose to share. The customer funnel starts at zero. A contact's timeline records the source, conversation, and next step.\n\n## Reports\n\nThe **Around the world** charts use published sources linked under each chart. **Your business** and **Your money** gain numbers only after the team checks your records. Ask Muse for a report about any result that matters to you.\n\n## Your control\n\nYou choose what information the team can use. Outgoing communication and spending wait for your approval.`,
      JSON.stringify(["sources", "reports", "customers"]), 0, now, now);
    db.prepare("INSERT INTO settings (key, value) VALUES ('office_name', 'Office')").run();
  })();
}
