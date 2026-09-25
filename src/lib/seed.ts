import type Database from "better-sqlite3";

// The demo office: one solopreneur (a consultant who runs workshops), a
// chief of staff, five specialists, five projects, sixteen tasks, a small
// customer list, eight reports and eight notes. Times are relative to now
// so the demo always looks alive. Set OFFICE_SEED=none to skip it.

const H = 3600 * 1000;
const D = 24 * H;
const now = Date.now();
const t = (msAgo: number) => new Date(now - msAgo).toISOString();
// Calendar days are local: in the evening west of UTC, toISOString() would
// already say tomorrow, and "due Sep 30" would seed as Oct 1.
const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const day = (daysFromNow: number) => {
  const d = new Date(now);
  d.setDate(d.getDate() + daysFromNow);
  return ymd(d);
};
const mondayWeeksAgo = (n: number) => {
  const d = new Date(now);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7) - 7 * n);
  return ymd(d);
};
const monthLabel = (monthsAgo: number) => {
  const d = new Date(now);
  d.setMonth(d.getMonth() - monthsAgo, 1);
  return ymd(d).slice(0, 7);
};

export function seed(db: Database.Database) {
  const tx = db.transaction(() => {
    // ---------------------------------------------------------------- team
    const member = db.prepare(
      `INSERT INTO members (slug, name, role, hat, job, color, does_json, never, skills_json, last_rule, is_chief, sort_order)
       VALUES (@slug, @name, @role, @hat, @job, @color, @does, @never, @skills, @last_rule, @is_chief, @sort_order)`,
    );
    const team = [
      { slug: "chief", name: "Muse", role: "Chief of staff", hat: "top hat", job: "Talks with you, runs the team, and handles the everyday one-offs itself.", color: "#ebe0cb", does: [], never: null, skills: [], last_rule: null, is_chief: 1, sort_order: 0 },
      { slug: "pastel", name: "Pastel", role: "Designer", hat: "red beret", job: "Your brand and every visual: logo, site design, social images, slides. Shows three options first.", color: "#f3d2d9",
        does: ["Offers three options before polishing one", "Keeps the brand guide in Notes and follows it", "Hands finished designs to Patch with a note on how to build them"], never: "Uses images it has no right to use, or publishes anything.", skills: ["Brand guide", "Site design", "Social images"], last_rule: "Sep 17 — “Warmer colors, less corporate.”", is_chief: 0, sort_order: 1 },
      { slug: "patch", name: "Patch", role: "Developer", hat: "knit beanie", job: "Builds and runs your website and small tools. Preview link before anything goes live.", color: "#cddcee",
        does: ["Shares a preview link, not screenshots", "Writes down how to run and change what it built, in Notes", "Keeps the site's visitor stats feeding the Reports page"], never: "Buys a service or goes live without your OK.", skills: ["Website", "Small tools", "Automations"], last_rule: "Sep 22 — “Preview links, not screenshots.”", is_chief: 0, sort_order: 2 },
      { slug: "sunny", name: "Sunny", role: "Marketer", hat: "bellhop cap", job: "Brings people to you: posts, the newsletter, campaigns, and what is working.", color: "#f3e2a4",
        does: ["Keeps a simple plan in Notes: what gets posted, where, and when", "Drafts posts and newsletter issues in your voice; asks Pastel for visuals", "Builds the newsletter list from Customers and reports what brought people in"], never: "Publishes or sends anything without your OK.", skills: ["Content plan", "Newsletter", "Campaign report"], last_rule: "Sep 24 — “You write the first newsletter issue yourself.”", is_chief: 0, sort_order: 3 },
      { slug: "scout", name: "Scout", role: "Sales", hat: "deerstalker", job: "Keeps your customer list, follows up on leads, drafts proposals. Nothing is sent without your OK.", color: "#e6cba6",
        does: ["Adds people who write to the business, with where they came from and what they want", "Sets the next step and its date for every lead; drafts the follow-up on the day", "Moves each person through the funnel: Lead, Talking, Proposal, Customer"], never: "Sends anything without your OK, or deletes a person.", skills: ["Contacts", "Follow-ups", "Proposals"], last_rule: "Sep 20 — “Invoices go out on the 20th.”", is_chief: 0, sort_order: 4 },
      { slug: "penny", name: "Penny", role: "Bookkeeper", hat: "navy bowler", job: "Invoices, expenses, bills, and your money reports. Never pays without your OK.", color: "#d3e6d0",
        does: ["Finds invoices, receipts, and bills in your email and files them by category", "Drafts invoices for your customers and chases the unpaid ones", "Updates the money reports every Monday"], never: "Pays or transfers anything without your OK.", skills: ["Invoices", "Expenses", "Bills"], last_rule: "Sep 22 — “Advisory income and workshop income go on separate lines.”", is_chief: 0, sort_order: 5 },
    ];
    for (const m of team) member.run({ ...m, does: JSON.stringify(m.does), skills: JSON.stringify(m.skills) });

    // ------------------------------------------------------------ projects
    const project = db.prepare(
      `INSERT INTO projects (slug, name, description, color, color_dark, lead, kind, process_markdown, done_when, sort_order)
       VALUES (@slug, @name, @description, @color, @color_dark, @lead, @kind, @process_markdown, @done_when, @sort_order)`,
    );
    const step = db.prepare(`INSERT INTO process_steps (project, position, name, who, note, needs_you) VALUES (?, ?, ?, ?, ?, ?)`);
    const rule = db.prepare(`INSERT INTO project_rules (project, text, origin, learned_at) VALUES (?, ?, ?, ?)`);
    const projects: Array<{
      slug: string; name: string; description: string; color: string; color_dark: string; lead: string; kind: string; done_when: string;
      steps: Array<[string, string, string, number?]>; rules: Array<[string, string, number]>; sort_order: number;
    }> = [
      { slug: "website", name: "Website", description: "Your site: designed, built, and kept up by the team.", color: "#f2e4a9", color_dark: "#b89a3a", lead: "patch", kind: "Build", done_when: "It is live, and the how-to is in Notes.", sort_order: 0,
        steps: [["Plan", "chief", "Writes down what “done” looks like, with you."], ["Design", "pastel", "Makes three options; you pick one.", 1], ["Build", "patch", "Builds it on a preview link."], ["Check", "chief", "Checks it against the plan."], ["Your OK", "you", "You look at the preview.", 1], ["Launch", "patch", "Puts it live and writes down how to change it."]],
        rules: [["Show me a preview link, not screenshots.", "you", 2], ["Warmer colors, less corporate.", "you", 7]] },
      { slug: "marketing", name: "Marketing", description: "Posts, the monthly newsletter, and campaigns that bring people in.", color: "#d5eaea", color_dark: "#2f8a8a", lead: "sunny", kind: "Publish", done_when: "It is out, and the result is on the Reports page.", sort_order: 1,
        steps: [["Plan", "sunny", "Proposes what to say and where, from the content plan."], ["Write", "sunny", "Drafts it in your voice."], ["Design", "pastel", "Makes the visual."], ["Your OK", "you", "You approve it.", 1], ["Publish", "sunny", "Posts or sends it, and logs what it brought in."]],
        rules: [["You write the first newsletter issue yourself; the team handles the rest.", "you", 0]] },
      { slug: "customers", name: "Customers", description: "Leads, proposals, and follow-ups, so no one goes cold.", color: "#d8e7d3", color_dark: "#5b8a5a", lead: "scout", kind: "Follow up", done_when: "The touch is logged, the stage is right, and the next step is set.", sort_order: 2,
        steps: [["Capture", "scout", "Adds or updates the person on Customers, with their stage."], ["Next step", "scout", "Sets what happens next and when."], ["Draft", "scout", "Drafts the follow-up or the proposal."], ["Your OK", "you", "You approve it.", 1], ["Send & log", "scout", "Sends it, logs it, and moves the stage."]],
        rules: [["Invoices go out on the 20th.", "you", 4], ["For anything over $2,000, send a written proposal first.", "ok", 1]] },
      { slug: "money", name: "Money", description: "Invoices, expenses, bills, and your money reports.", color: "#e3dcf0", color_dark: "#7e6aa6", lead: "penny", kind: "Money", done_when: "Sorted, reported, and anything to pay is approved or dismissed.", sort_order: 3,
        steps: [["Collect", "penny", "Finds receipts, bills, and statements in your email."], ["Sort", "penny", "Files them by category."], ["Report", "penny", "Updates the money reports."], ["Your OK", "you", "Any payment or transfer waits for your OK.", 1]],
        rules: [["Round to the cent, never to the dollar.", "you", 4], ["Advisory income and workshop income go on separate lines.", "you", 2]] },
      { slug: "general", name: "General", description: "One-offs that fit nowhere else; your chief of staff does these itself.", color: "#e9e7df", color_dark: "#9a978c", lead: "chief", kind: "General", done_when: "The result is on the card.", sort_order: 4,
        steps: [["Do", "chief", "Does it, or hands it to whoever fits."], ["Your OK", "you", "Only if something leaves the office.", 1]], rules: [] },
    ];
    for (const p of projects) {
      const md = processMarkdown(p);
      project.run({ slug: p.slug, name: p.name, description: p.description, color: p.color, color_dark: p.color_dark, lead: p.lead, kind: p.kind, process_markdown: md, done_when: p.done_when, sort_order: p.sort_order });
      p.steps.forEach(([name, who, note, needs], i) => step.run(p.slug, i, name, who, note, needs ? 1 : 0));
      for (const [text, origin, daysAgo] of p.rules) rule.run(p.slug, text, origin, t(daysAgo * D));
    }

    // --------------------------------------------------------------- tasks
    const task = db.prepare(
      `INSERT INTO tasks (id, project, title, specialist, column_name, step, question, question_kind, note, job_definition, original_request, due, created_at, updated_at, done_at)
       VALUES (@id, @project, @title, @specialist, @column_name, @step, @question, @question_kind, @note, @job_definition, @original_request, @due, @created_at, @updated_at, @done_at)`,
    );
    const check = db.prepare(`INSERT INTO task_checks (task, position, text, met) VALUES (?, ?, ?, ?)`);
    const plan = db.prepare(`INSERT INTO task_plan (task, position, text, state) VALUES (?, ?, ?, ?)`);
    const file = db.prepare(`INSERT INTO task_files (task, name, url, added_at) VALUES (?, ?, ?, ?)`);
    const upd = db.prepare(
      `INSERT INTO task_updates (task, author, kind, body, files_json, reply_to, unread_by_agent, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    // replyTo is the index of the parent update in the same task's list.
    type U = [author: string, kind: string, body: string, msAgo: number, files?: Array<{ name: string; url: string }>, replyTo?: number];
    const tasks: Array<{
      id: string; project: string; title: string; specialist: string; column_name: string; step: number; question?: string; question_kind?: string; note?: string;
      job_definition: string; original_request?: string; due?: string; created: number; updated: number; done?: number;
      checks?: Array<[string, number]>; plan?: Array<[string, string]>; files?: Array<[string, string]>; updates?: U[];
    }> = [
      { id: "brand-colors", project: "website", title: "Pick brand colors", specialist: "pastel", column_name: "todo", step: 1, created: 1 * D, updated: 1 * D,
        job_definition: "Choose the colors for the new website. Pastel makes three palettes from the brand guide; you pick one; the pick goes into Notes so every page and post uses it.",
        original_request: "the site feels too corporate, make it warmer", checks: [["Three palettes, each shown on the homepage", 0], ["You picked one", 0], ["The pick is in the Brand guide", 0]],
        plan: [["Read the Brand guide and the logo pick", "now"], ["Make three palettes", "later"], ["Show them on the homepage", "later"], ["Ask you to pick", "later"]],
        updates: [["chief", "event", "Made this task from your chat", 1 * D], ["chief", "event", "Queued for Pastel, after the homepage layout", 1 * D - 60000]] },
      { id: "linkedin-post", project: "marketing", title: "Write next week’s LinkedIn post", specialist: "sunny", column_name: "todo", step: 1, created: 2 * D, updated: 2 * D,
        job_definition: "One post for next week, in your voice, from the content plan in Notes. Sunny drafts it; you approve it before it goes out.",
        checks: [["Draft written from the content plan", 0], ["You approved it", 0], ["Posted, and the result noted", 0]], plan: [["Pick the topic from the plan", "now"], ["Draft the post", "later"], ["Ask you to approve", "later"], ["Post it", "later"]],
        updates: [["chief", "event", "Made this task from the content plan", 2 * D]] },
      { id: "northwind-check", project: "customers", title: "Check Northwind got the September invoice", specialist: "scout", column_name: "todo", step: 2, due: day(1), created: 4 * H, updated: 4 * H,
        job_definition: "A friendly “did it arrive?” note to Omar Haddad about the September invoice. It is not due until Oct 20, so this is a check-in, not a chase. You see the note before it is sent.",
        original_request: "also remind Omar at Northwind about the invoice", checks: [["Note drafted", 0], ["You approved it", 0], ["Sent and logged on Omar's timeline", 0]],
        plan: [["Draft the note", "now"], ["Ask you to approve", "later"], ["Send and log it", "later"]], updates: [["chief", "event", "Made this task from your chat", 4 * H]] },
      { id: "sort-expenses", project: "money", title: "Sort September expenses", specialist: "penny", column_name: "todo", step: 1, created: 2 * H, updated: 2 * H,
        job_definition: "File September's receipts and card charges by category, so the spending report is right for the month.",
        checks: [["Every receipt found in email", 0], ["Filed by category", 0], ["Spending report updated", 0]], plan: [["Collect receipts and card alerts", "now"], ["File by category", "later"], ["Update the report", "later"]],
        updates: [["chief", "event", "Made this task from the Money routine", 2 * H]] },
      { id: "newsletter-list", project: "marketing", title: "Build the newsletter list from Customers", specialist: "sunny", column_name: "todo", step: 0, created: 10 * 60000, updated: 10 * 60000,
        job_definition: "Turn the people on the Customers page into a mailing list for the monthly newsletter, with anyone who asked not to be contacted left out.",
        original_request: "I want to start a monthly newsletter for my clients", checks: [["List built from Customers", 0], ["Opt-outs respected", 0], ["You approved the list", 0]],
        plan: [["Pull customers and leads from Customers", "now"], ["Check who said no", "later"], ["Show you the list", "later"]], updates: [["chief", "event", "Made this task from your chat", 10 * 60000]] },
      { id: "homepage", project: "website", title: "Build the homepage", specialist: "patch", column_name: "in_progress", step: 2, note: "Preview link tomorrow", created: 2 * D, updated: 2 * H,
        job_definition: "Build the homepage with layout B: a warm photo, one line of copy, one button. It goes on a preview link first; nothing goes live until you look at it.",
        original_request: "go with layout B", checks: [["Layout B built on the preview link", 0], ["Checked against the plan", 0], ["You OK’d the preview", 0], ["Live, with the change noted in Notes", 0]],
        plan: [["Set up the page with layout B", "done"], ["Add the photo and the copy", "now"], ["Share the preview link", "later"], ["Go live after your OK", "later"]],
        updates: [["chief", "event", "Made this task from your chat", 2 * D], ["chief", "update", "Plan agreed with you: warm colors, one line of copy, one button. Pastel does three layouts first.", 2 * D - 5 * 60000],
          ["pastel", "update", "Three layouts ready. You picked B.", 1 * D, [{ name: "Homepage layouts A, B, C (image)", url: "#" }]], ["patch", "update", "Building layout B now. Preview link tomorrow morning.", 2 * H]] },
      { id: "case-study", project: "marketing", title: "Draft the Northwind case study", specialist: "sunny", column_name: "in_progress", step: 1, note: "Outline done", created: 3 * D, updated: 1 * H,
        job_definition: "A one-page case study on the Northwind advisory work, for the website and the newsletter. Sunny drafts it; Omar Haddad approves his quotes before it goes anywhere.",
        checks: [["Outline agreed", 1], ["Draft written", 0], ["Omar approved his quotes", 0], ["You approved it", 0]], plan: [["Outline", "done"], ["Draft", "now"], ["Omar's OK on quotes", "later"], ["Your OK", "later"]],
        updates: [["chief", "event", "Made this task from the content plan", 3 * D], ["sunny", "update", "Outline done: the problem, what we did, the result in numbers.", 1 * H]] },
      { id: "lumen-invoice", project: "customers", title: "Chase Lumen Labs’ unpaid invoice", specialist: "scout", column_name: "in_progress", step: 2, note: "Reminder drafted", created: 1 * D, updated: 40 * 60000,
        job_definition: "The $2,400 workshop invoice to Lumen Labs was sent Aug 30 and is due in five days. Scout drafts a polite reminder to Priya Raman; you see it before it goes out.",
        checks: [["Reminder drafted", 1], ["You approved it", 0], ["Sent and logged", 0]], plan: [["Check the invoice and the due date", "done"], ["Draft the reminder", "done"], ["Ask you to approve", "now"], ["Send and log it", "later"]],
        updates: [["chief", "event", "Made this task from the Money routine: an invoice is due in five days", 1 * D], ["scout", "update", "Reminder drafted: friendly, one line, with the invoice attached.", 40 * 60000, [{ name: "Reminder to Lumen Labs, draft", url: "#" }]]] },
      { id: "acme-proposal", project: "customers", title: "Send the workshop proposal to Acme", specialist: "scout", column_name: "waiting_on_you", step: 3, question: "Approve the draft?", question_kind: "approve", created: 2 * D, updated: 1 * D,
        job_definition: "Send Sarah Chen at Acme Co. a proposal for a workshop for her team of 15. She asked about price by email on Sep 18 and decides by the end of October. Scout drafts it; nothing goes out without your OK.",
        original_request: "send Sarah the workshop proposal we talked about", checks: [["Draft written from the Sep 18 email and your notes", 1], ["You approved the draft", 0], ["Sent to Sarah and logged on her timeline", 0], ["Next step set on Customers", 0]],
        plan: [["Read the email thread and your notes", "done"], ["Draft the proposal", "done"], ["Ask you to approve", "now"], ["Send and log it", "later"]],
        files: [["Acme workshop proposal, draft (PDF)", "#"]],
        updates: [["chief", "event", "Made this task from your chat", 2 * D], ["scout", "event", "Scout started on it", 2 * D - 60000],
          ["scout", "update", "Draft ready: two half-day workshops for 15 people, $4,800, first session the week of Oct 12.", 1 * D, [{ name: "Acme workshop proposal, draft (PDF)", url: "#" }]],
          ["scout", "question", "OK to send this draft to Sarah as it is? Or tell me what to change.", 1 * D - 60000]] },
      { id: "quarterly-tax", project: "money", title: "Pay the quarterly tax installment", specialist: "penny", column_name: "waiting_on_you", step: 3, question: "OK to pay $1,240 on Sep 28, from the account you set aside for taxes?", question_kind: "money", created: 5 * H, updated: 3 * H,
        job_definition: "Pay the quarterly tax installment due Sep 30. Penny found the bill in email and checked the amount against last quarter. Nothing is paid without your OK.",
        original_request: "Found by Penny in your email (installment 3 of 4)", checks: [["Amount checked against last quarter", 1], ["You said OK", 0], ["Paid and the receipt filed under Money", 0]],
        plan: [["Find the bill and check the amount", "done"], ["Get your OK", "now"], ["Pay and file the receipt", "later"]],
        updates: [["penny", "event", "Penny found this bill in your email and opened this task", 5 * H], ["penny", "update", "Installment 3 of 4: $1,240, due Sep 30. Same as last quarter.", 5 * H - 3 * 60000, [{ name: "Quarterly tax bill, installment 3 (PDF)", url: "#" }]],
          ["penny", "question", "OK to pay $1,240 on Sep 28, from the account you set aside for taxes?", 3 * H]] },
      { id: "october-issue", project: "marketing", title: "Send October’s newsletter", specialist: "sunny", column_name: "waiting_on_you", step: 3, question: "Approve the issue?", question_kind: "approve", created: 6 * D, updated: 5 * 60000,
        job_definition: "October's issue of the newsletter, laid out by Pastel from your draft. Sunny sends it to the list once you approve it.",
        checks: [["Your draft laid out", 1], ["You approved the issue", 0], ["Sent, and opens noted next week", 0]], plan: [["Lay out your draft", "done"], ["Ask you to approve", "now"], ["Send to the list", "later"]],
        files: [["October newsletter, proof (PDF)", "#"]],
        updates: [["chief", "event", "Made this task from the content plan", 6 * D], ["sunny", "update", "Laid out from your draft. 212 people on the list.", 20 * 60000, [{ name: "October newsletter, proof (PDF)", url: "#" }]], ["sunny", "question", "Approve the issue as it is? Or tell me what to change.", 5 * 60000]] },
      { id: "buy-domain", project: "website", title: "Buy the domain", specialist: "patch", column_name: "done", step: 5, note: "With your OK · $16 a year, auto-renew", created: 3 * D, updated: 2 * D, done: 2 * D,
        job_definition: "Buy the domain for the new website in your name, with automatic renewal.", original_request: "grab the domain before someone else does",
        checks: [["Domain bought in your name", 1], ["Auto-renew on", 1], ["Receipt filed under Website", 1]], plan: [["Check the name is free", "done"], ["Get your OK on the price", "done"], ["Buy it and file the receipt", "done"]],
        files: [["Domain receipt (PDF)", "#"]],
        updates: [["chief", "event", "Made this task from your chat", 3 * D], ["patch", "question", "The name is free: $16 a year. OK to buy?", 3 * D - 20 * 60000], ["you", "reply", "Yes", 3 * D - 30 * 60000, undefined, 1], ["patch", "update", "Bought, in your name, auto-renew on. Receipt filed.", 2 * D]] },
      { id: "august-receipts", project: "money", title: "File August receipts", specialist: "penny", column_name: "done", step: 2, created: 4 * D, updated: 1 * D, done: 1 * D,
        job_definition: "File August's receipts and card charges by category and update the spending report.", checks: [["38 receipts found", 1], ["Filed by category", 1], ["Report updated", 1]],
        plan: [["Collect", "done"], ["File", "done"], ["Report", "done"]], files: [["August receipts summary (PDF)", "#"]],
        updates: [["chief", "event", "Made this task from the Money routine", 4 * D], ["penny", "update", "38 receipts filed. One double charge found and refunded ($85).", 1 * D]] },
      { id: "northwind-invoice", project: "customers", title: "Invoice Northwind for September", specialist: "penny", column_name: "done", step: 4, note: "Sent with your OK · $1,500, due Oct 20", created: 5 * D, updated: 4 * D, done: 4 * D,
        job_definition: "Invoice Northwind for the September advisory work, using the rates in Notes, and send it on the 20th.", original_request: "Monthly routine: invoices go out on the 20th",
        checks: [["Invoice drafted from the rates in Notes", 1], ["You approved it", 1], ["Sent to Omar Haddad and logged on Customers", 1]], plan: [["Draft the invoice", "done"], ["Get your OK", "done"], ["Send and log it", "done"]],
        files: [["Northwind invoice, September (PDF)", "#"]],
        updates: [["penny", "event", "Made this task from the Money routine", 5 * D], ["penny", "update", "Draft ready: advisory, September, $1,500.", 5 * D - 20 * 60000, [{ name: "Northwind invoice, September (PDF)", url: "#" }]],
          ["you", "comment", "Looks right, send it.", 5 * D - 3 * H], ["chief", "reply", "Sent tomorrow morning, on the 20th.", 5 * D - 3 * H - 60000, undefined, 2], ["penny", "update", "Sent to Omar and logged on his timeline. Follow-up set for Oct 1.", 4 * D]] },
      { id: "pick-logo", project: "website", title: "Pick the logo", specialist: "pastel", column_name: "done", step: 1, note: "You picked option B", created: 7 * D, updated: 5 * D, done: 5 * D,
        job_definition: "Three logo options from the brand guide; you pick one.", checks: [["Three options", 1], ["You picked one", 1]], plan: [["Three options", "done"], ["Your pick", "done"]],
        files: [["Logo options A, B, C (image)", "#"]], updates: [["chief", "event", "Made this task from your chat", 7 * D], ["pastel", "update", "Three options attached.", 6 * D], ["you", "reply", "B", 5 * D, undefined, 1]] },
      { id: "passport-photo", project: "general", title: "Book a passport photo", specialist: "chief", column_name: "done", step: 1, created: 6 * D, updated: 5 * D, done: 5 * D,
        job_definition: "Book a passport photo appointment near the office.", checks: [["Booked", 1]], plan: [["Find a slot", "done"], ["Book it", "done"]],
        files: [["Booking: passport photo, Sep 20, 11:00", "#"]], updates: [["chief", "event", "Made this task from your chat", 6 * D], ["chief", "update", "Booked for Sep 20 at 11:00. Added to your calendar.", 5 * D]] },
    ];
    for (const x of tasks) {
      task.run({ id: x.id, project: x.project, title: x.title, specialist: x.specialist, column_name: x.column_name, step: x.step, question: x.question ?? null, question_kind: x.question_kind ?? null, note: x.note ?? null,
        job_definition: x.job_definition, original_request: x.original_request ?? null, due: x.due ?? null, created_at: t(x.created), updated_at: t(x.updated), done_at: x.done ? t(x.done) : null });
      (x.checks ?? []).forEach(([text, met], i) => check.run(x.id, i, text, met));
      (x.plan ?? []).forEach(([text, state], i) => plan.run(x.id, i, text, state));
      (x.files ?? []).forEach(([name, url]) => file.run(x.id, name, url, t(x.updated)));
      const ids: number[] = [];
      (x.updates ?? []).forEach(([author, kind, body, msAgo, files, replyTo]) => {
        const parent = replyTo === undefined ? null : (ids[replyTo] ?? null);
        const r = upd.run(x.id, author, kind, body, JSON.stringify(files ?? []), parent, 0, t(msAgo));
        ids.push(Number(r.lastInsertRowid));
      });
    }

    // ----------------------------------------------------------- customers
    const contact = db.prepare(
      `INSERT INTO contacts (slug, name, company, title, stage, source, next_step, next_due, next_waiting_on_you, notes_json, value_cents, in_funnel, created_at, updated_at)
       VALUES (@slug, @name, @company, @title, @stage, @source, @next_step, @next_due, @next_waiting_on_you, @notes, @value_cents, @in_funnel, @created_at, @updated_at)`,
    );
    const touch = db.prepare(`INSERT INTO touches (contact, channel, summary, by, task, happened_at) VALUES (?, ?, ?, ?, ?, ?)`);
    const stage = db.prepare(`INSERT INTO stage_changes (contact, stage, changed_at) VALUES (?, ?, ?)`);
    const people: Array<{
      slug: string; name: string; company: string; title?: string; stage: string; source?: string; next_step?: string; next_due?: string; waiting?: number; notes?: string[]; value?: number; in_funnel?: number; created: number;
      stages: Array<[string, number]>; touches: Array<[channel: string, summary: string, msAgo: number, by?: string, task?: string]>;
    }> = [
      { slug: "sarah-chen", name: "Sarah Chen", company: "Acme Co.", title: "Head of People", stage: "proposal", source: "met at a business expo", next_step: "Send the workshop proposal", next_due: day(-1), waiting: 1, notes: ["Prefers email.", "Decides by the end of October."], created: 12 * D,
        stages: [["lead", 12 * D], ["talking", 6 * D], ["proposal", 1 * D]], touches: [["note", "Added as a lead after the business expo — you told your Muse by voice note", 12 * D, "chief"], ["email", "Her email “Workshop for your team?” asked about price for 15 people", 6 * D, "scout"], ["note", "Proposal drafted by Scout, waiting on your OK", 1 * D, "scout", "acme-proposal"]] },
      { slug: "omar-haddad", name: "Omar Haddad", company: "Northwind", title: "Operations lead", stage: "customer", source: "referral", next_step: "Check they got the September invoice", next_due: day(1), notes: ["Pays on time.", "Likes a short monthly summary."], value: 1800000, created: 120 * D,
        stages: [["lead", 120 * D], ["customer", 90 * D]], touches: [["invoice", "Sent the September invoice, $1,500, due Oct 20", 4 * D, "penny", "northwind-invoice"], ["meeting", "Monthly advisory call", 9 * D, "you"]] },
      { slug: "priya-raman", name: "Priya Raman", company: "Lumen Labs", title: "Founder", stage: "customer", source: "website inquiry", next_step: "Chase the unpaid invoice", next_due: day(4), notes: ["Wants the workshop notes by early October."], value: 480000, created: 60 * D,
        stages: [["lead", 60 * D], ["talking", 50 * D], ["proposal", 40 * D], ["customer", 30 * D]], touches: [["meeting", "Workshop delivered, Aug 28", 27 * D, "you"], ["invoice", "Invoice sent Aug 30, $2,400", 25 * D, "penny"], ["note", "Reminder drafted for the unpaid invoice", 40 * 60000, "scout", "lumen-invoice"]] },
      { slug: "aisha-bello", name: "Aisha Bello", company: "Bello Realty", title: "Owner", stage: "customer", source: "referral from Omar", value: 240000, created: 20 * D, next_step: "Send the workshop notes", next_due: day(6),
        stages: [["lead", 20 * D], ["talking", 15 * D], ["proposal", 10 * D], ["customer", 3 * D]], touches: [["email", "Signed for a half-day workshop in October, $2,400", 3 * D, "scout"], ["call", "Intro call", 15 * D, "you"]] },
      { slug: "dev-patel", name: "Dev Patel", company: "Harbor Dental", title: "Practice manager", stage: "lead", source: "email inquiry", next_step: "Reply with packages and rates", next_due: day(1), created: 5 * H,
        stages: [["lead", 5 * H]], touches: [["email", "Emailed asking about a workshop for 15 people", 5 * H, "scout"]] },
      { slug: "nadia-rossi", name: "Nadia Rossi", company: "Rossi & Co", title: "Partner", stage: "lead", source: "LinkedIn", next_step: "Offer an intro call", next_due: day(3), created: 2 * D,
        stages: [["lead", 2 * D]], touches: [["message", "Replied to your LinkedIn post asking how workshops work", 2 * D, "sunny"]] },
      { slug: "ken-ito", name: "Ken Ito", company: "Ito Design Studio", stage: "lead", source: "website inquiry", next_step: "Reply with packages and rates", next_due: day(2), created: 4 * D,
        stages: [["lead", 4 * D]], touches: [["website", "Contact form: interested in the advisory package", 4 * D, "scout"]] },
      { slug: "haeun-park", name: "Ha-eun Park", company: "Park Physio", stage: "lead", source: "referral", created: 20 * D, next_step: "Check in", next_due: day(9),
        stages: [["lead", 20 * D]], touches: [["email", "Asked for dates in November", 20 * D, "scout"]] },
      { slug: "maya-lindqvist", name: "Maya Lindqvist", company: "Fjord Studio", title: "Creative director", stage: "talking", source: "website inquiry", next_step: "Offer two workshop dates", next_due: day(4), created: 9 * D,
        stages: [["lead", 9 * D], ["talking", 2 * D]], touches: [["call", "Intro call: a workshop for her team of 8 in November", 2 * D, "you"]] },
      { slug: "lena-brooks", name: "Lena Brooks", company: "Brightside Bakery", title: "Owner", stage: "talking", source: "you mentioned her", next_step: "Intro call", next_due: day(8), created: 3 * D,
        stages: [["lead", 3 * D], ["talking", 3 * D]], touches: [["note", "Added after you told your Muse about her — wants an intro call", 3 * D, "scout"]] },
      { slug: "jonas-weber", name: "Jonas Weber", company: "Weber Consulting", stage: "talking", source: "referral", next_step: "Send the case study when it is ready", next_due: day(10), created: 14 * D,
        stages: [["lead", 14 * D], ["talking", 7 * D]], touches: [["email", "Asked for an example of past work", 7 * D, "scout"]] },
      { slug: "tom-becker", name: "Tom Becker", company: "Becker Logistics", title: "COO", stage: "proposal", source: "referral", next_step: "Follow up on the proposal", next_due: day(6), value: 720000, created: 30 * D,
        stages: [["lead", 30 * D], ["talking", 20 * D], ["proposal", 8 * D]], touches: [["email", "Proposal sent: three workshops, $7,200", 8 * D, "scout"], ["meeting", "Discovery call", 20 * D, "you"]] },
      // Kept on the page without being sold to: no stage shown, counted nowhere.
      { slug: "you", name: "You", company: "Your business", stage: "past", source: "you", in_funnel: 0, notes: ["Your own details, so the team has them."], created: 30 * D, stages: [], touches: [] },
      { slug: "tinyhat", name: "Tinyhat", company: "Tinyhat", stage: "past", source: "made this hat", in_funnel: 0, next_step: "Check for hat updates", next_due: day(7), notes: ["https://tinyhat.ai", "support@tinyhat.ai"], created: 30 * D, stages: [], touches: [] },
      { slug: "grace-okafor", name: "Grace Okafor", company: "Sunrise Yoga", title: "Owner", stage: "past", source: "referral", next_step: "Ask about a repeat session", next_due: day(21), value: 120000, created: 150 * D,
        stages: [["lead", 150 * D], ["customer", 120 * D], ["past", 60 * D]], touches: [["meeting", "Half-day workshop, June", 104 * D, "you"]] },
    ];
    for (const c of people) {
      contact.run({ slug: c.slug, name: c.name, company: c.company, title: c.title ?? null, stage: c.stage, source: c.source ?? null, next_step: c.next_step ?? null, next_due: c.next_due ?? null, next_waiting_on_you: c.waiting ?? 0, in_funnel: c.in_funnel ?? 1,
        notes: JSON.stringify(c.notes ?? []), value_cents: c.value ?? null, created_at: t(c.created), updated_at: t(c.touches.length ? Math.min(...c.touches.map((x) => x[2]), c.created) : c.created) });
      for (const [s, msAgo] of c.stages) stage.run(c.slug, s, t(msAgo));
      for (const [channel, summary, msAgo, by, taskId] of c.touches) touch.run(c.slug, channel, summary, by ?? null, taskId ?? null, t(msAgo));
    }

    // ------------------------------------------------------------- reports
    const report = db.prepare(`INSERT INTO reports (slug, section, title, description, chart, owner, source, source_url, sort_order, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    const metric = db.prepare(`INSERT INTO metrics (report, series, label, value, note_json, recorded_at) VALUES (?, ?, ?, ?, ?, ?)`);
    const monday = t(((new Date(now).getDay() + 6) % 7) * D + 9 * H);
    // Published examples are clearly separate from this person's business results.
    const publicReports: Array<[string, string, string, string, string, string]> = [
      ["world-population", "World population (millions)", "Rounded historical estimates for 1950, 2000, and 2024.", "bars", "UN World Population Prospects 2024", "https://population.un.org/wpp/"],
      ["olympic-women", "Women at the Paris Olympics", "Women athletes in 1900, 1924, and 2024; counts, not percentages.", "bars", "Paris 2024 official report", "https://library.olympics.com/digitalCollection/DigitalCollectionAttachmentDownloadHandler.ashx?documentId=3702240&parentDocumentId=3598869&skipCopyright=true&skipWatermark=true"],
      ["recorded-music", "Recorded music revenue (US$ billions)", "Global recorded-music trade revenue in 2023 and 2024.", "bars", "IFPI Global Music Report 2025", "https://www.ifpi.org/ifpi-amidst-highly-competitive-market-global-recorded-music-revenues-grew-4-8-in-2024/"],
    ];
    publicReports.forEach(([slug, title, description, chart, source, sourceUrl], i) => report.run(slug, "Around the world", title, description, chart, null, source, sourceUrl, i, monday));
    for (const [label, value] of [["1950", 2500], ["2000", 6100], ["2024", 8200]] as const) metric.run("world-population", null, label, value, "{}", monday);
    for (const [label, value] of [["1900", 22], ["1924", 135], ["2024", 5300]] as const) metric.run("olympic-women", null, label, value, "{}", monday);
    for (const [label, value] of [["2023", 28.6], ["2024", 29.6]] as const) metric.run("recorded-music", null, label, value, "{}", monday);
    const reports: Array<[string, string, string, string, string, string, string]> = [
      ["website", "Your business", "Website visitors and inquiries", "People who visited your current site each week, and how many wrote to you. The new site takes over at launch.", "bars", "patch", "from your current site's visitor stats and contact form"],
      ["new-customers", "Your business", "New customers", "New leads and new paying customers, each month.", "grouped-bars", "scout", "from the funnel on Customers"],
      ["owed", "Your business", "Money owed to you", "Invoices sent and not yet paid.", "list", "penny", "from the invoices sent · Scout follows up the day after a due date"],
      ["in-out", "Your business", "Money in and out", "What came in and what went out, each month. Last 6 months.", "grouped-bars", "penny", "invoices and receipts"],
      ["spending", "Your money", "Spending by category, each week", "What you spent, from receipts and card alerts in your email. Cash is not counted. Last 8 weeks.", "stacked-bars", "penny", "from receipts and card alerts in your email"],
      ["bills", "Your money", "Bills coming up", "The next 30 days.", "list", "penny", "from bills in your email"],
      ["subscriptions", "Your money", "Subscriptions", "What you pay every month.", "bars-horizontal", "penny", "amounts from card emails, usage from each tool's own emails"],
      ["savings", "Your money", "Savings the team found", "This month, in dollars.", "savings", "chief", "counted only once the money is actually kept"],
    ];
    reports.forEach((r, i) => report.run(...r, null, i + publicReports.length, monday));
    const visitors = [310, 290, 340, 360, 420, 480, 610, 720], inquiries = [1, 2, 1, 2, 1, 2, 2, 3];
    visitors.forEach((v, i) => { const wk = mondayWeeksAgo(8 - i); metric.run("website", "visitors", wk, v, "{}", monday); metric.run("website", "inquiries", wk, inquiries[i], "{}", monday); });
    const inn = [6200, 5800, 7400, 6900, 8100, 7300], out = [4900, 5200, 5600, 6100, 5300, 4700];
    inn.forEach((v, i) => { const m = monthLabel(5 - i); metric.run("in-out", "in", m, v, "{}", monday); metric.run("in-out", "out", m, out[i], "{}", monday); });
    const cats: Array<[string, number[]]> = [["Software & tools", [210, 185, 240, 198, 225, 260, 205, 230]], ["Marketing", [95, 60, 520, 80, 110, 75, 210, 90]], ["Travel", [40, 25, 30, 400, 65, 45, 35, 60]], ["Office", [80, 120, 60, 95, 222, 70, 110, 62]], ["Contractors", [38, 12, 55, 9, 38, 12, 55, 9]], ["Other", [60, 85, 40, 70, 55, 170, 45, 175]]];
    for (const [cat, vals] of cats) vals.forEach((v, i) => metric.run("spending", cat, mondayWeeksAgo(8 - i), v, "{}", monday));
    metric.run("owed", "Lumen Labs", "Workshop", 2400, JSON.stringify({ due: day(5), sent: day(-25), contact: "priya-raman" }), monday);
    metric.run("owed", "Northwind", "Advisory, September", 1500, JSON.stringify({ due: day(26), sent: day(-4), contact: "omar-haddad" }), monday);
    const bills: Array<[string, number, string, string]> = [["Quarterly tax, installment 3", 1240, day(6), "waiting_on_you"], ["Business insurance", 96, day(7), "autopay_bank"], ["Internet", 85, day(11), "autopay_bank"], ["Design tools", 54.99, day(18), "autopay_card"], ["Phone", 70, day(21), "autopay_bank"]];
    for (const [name, amount, due, how] of bills) metric.run("bills", null, name, amount, JSON.stringify({ due, how, task: how === "waiting_on_you" ? "quarterly-tax" : undefined }), monday);
    const subs: Array<[string, number, boolean, string?]> = [["Design tools", 54.99, false], ["Scheduling app", 45, true, "no booking email since Aug 8"], ["Video calls, two plans", 33.98, false], ["Stock photos", 12.99, true, "no download email since Aug 2"], ["Email tool", 12, false], ["Cloud storage", 2.99, false]];
    for (const [name, amount, unused, why] of subs) metric.run("subscriptions", null, name, amount, JSON.stringify({ unused, why }), monday);
    metric.run("savings", "penny", "Found a double charge from the internet provider in the August receipts; it was refunded.", 85, JSON.stringify({ state: "saved", task: "august-receipts" }), monday);
    metric.run("savings", "penny", "The email tool has a cheaper plan that covers your 212 newsletter subscribers. Counted once you tell your Muse to switch.", 7, JSON.stringify({ state: "waiting", monthly: true }), monday);
    metric.run("savings", "penny", "Two subscriptions look unused: the scheduling app and stock photos. Counted once you tell your Muse to cancel.", 58, JSON.stringify({ state: "waiting", monthly: true }), monday);

    // --------------------------------------------------------------- notes
    const note = db.prepare(`INSERT INTO notes (slug, project, title, lede, markdown, kept_by, linked_tasks_json, tags_json, pinned, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    const notes: Array<[string, string, string, string, string, string, string[], number, number, string[]]> = [
      ["how-your-office-works", "general", "How your office works", "A one-page guide to your office, written by your chief of staff.", `## The short version
- You talk to your chief of staff in chat. It decides where each request goes.
- The team works on tasks. You see them on **Projects**.
- When something needs you, it moves to **Waiting on you**, and you are asked in chat.
- You can comment on any task's page. Everything else, you ask in chat.

## Who does what
| Specialist | Work |
| --- | --- |
| Pastel | Designs the brand and visuals. |
| Patch | Builds the website and tools. |
| Sunny | Brings people in. |
| Scout | Follows up with customers. |
| Penny | Keeps the books. |

## How a request moves
~~~mermaid
flowchart LR
  A[You ask Muse] --> B{Quick question?}
  B -->|Yes| C[Muse answers]
  B -->|No| D[Specialist works]
  D --> E[Office records result]
~~~

## What never happens without you
- Sending, buying, booking, publishing, or deleting anything.`, "chief", [], 1, 12 * H, ["office", "how it works", "start here"]],
      ["brand-guide", "website", "Brand guide", "How your website and anything with your name on it should look and sound.", `## Colors
Not picked yet. The direction is warm and earthy; Pastel is making three palettes, and you pick one.

## Type
Headlines in a warm serif, body text in a clean sans. Big, calm headlines and short lines.

## Voice
- Plain words, warm, a little playful.
- Say what it does for the reader first.

## Decided so far
- Logo option B. <span class="by">— Sep 19, you picked it</span>
- Warmer colors, less corporate. <span class="by">— Sep 17, from you</span>`, "pastel", ["pick-logo", "brand-colors"], 0, 2 * D, ["brand", "colors", "type", "voice", "decision"]],
      ["how-the-website-runs", "website", "How the website is built and run", "Where your site lives, and how a change goes from idea to live.", `## Where it lives
- The domain is registered in your name; renewal is automatic.
- Every change goes to a preview link first.

## How a change goes live
1. You ask for the change in chat.
2. Patch builds it on a preview link.
3. You look at the preview.
4. Patch puts it live and notes what changed here.

<svg viewBox="0 0 640 72" role="img" aria-label="Ask, build on a preview, your OK, live" width="640" height="72">
  <rect x="2" y="16" width="140" height="40" rx="10" fill="#e9e7df" stroke="#c9c8c1"/><text x="72" y="41" text-anchor="middle" font-size="13" fill="#1c1c19">1 · You ask</text>
  <line x1="142" y1="36" x2="166" y2="36" stroke="#9a978c" stroke-width="2"/>
  <rect x="166" y="16" width="140" height="40" rx="10" fill="#f2e4a9" stroke="#b89a3a"/><text x="236" y="41" text-anchor="middle" font-size="13" fill="#1c1c19">2 · Preview link</text>
  <line x1="306" y1="36" x2="330" y2="36" stroke="#9a978c" stroke-width="2"/>
  <rect x="330" y="16" width="140" height="40" rx="10" fill="#fbeee6" stroke="#b3541e"/><text x="400" y="41" text-anchor="middle" font-size="13" fill="#b3541e">3 · Your OK</text>
  <line x1="470" y1="36" x2="494" y2="36" stroke="#9a978c" stroke-width="2"/>
  <rect x="494" y="16" width="140" height="40" rx="10" fill="#d8e7d3" stroke="#2d5a45"/><text x="564" y="41" text-anchor="middle" font-size="13" fill="#2d5a45">4 · Live</text>
</svg>

## In the works
- Homepage, layout B. Preview link tomorrow. <span class="by">— Patch, today</span>`, "patch", ["buy-domain", "homepage"], 0, 2 * H, ["website", "domain", "preview", "how-to", "launch"]],
      ["what-we-post", "marketing", "What we post and when", "The simple plan Sunny follows.", `| Where | How often | What |
| --- | --- | --- |
| LinkedIn | Once a week, Tuesday | One lesson from a workshop |
| Newsletter | Monthly, first Thursday | Three things worth knowing |
| Case studies | When a project ends | The problem, what we did, the result |

## Rules
- You write the first newsletter issue yourself.
- Nothing is posted without your OK.`, "sunny", ["linkedin-post", "october-issue"], 0, 1 * D, ["marketing", "linkedin", "newsletter", "schedule", "plan"]],
      ["packages-and-rates", "customers", "Workshop packages and rates", "What you offer and what it costs. Scout uses this for every proposal.", `| Package | Length | For | Price |
| --- | --- | --- | --- |
| Half-day workshop | 3 hours | Up to 12 people | $2,400 |
| Two half-days | 2 × 3 hours | Up to 15 people | $4,800 |
| Advisory | Monthly | Leadership team | $1,500 / month |

## Good to know
- Invoices go out on the 20th.
- Travel is billed separately.`, "scout", ["acme-proposal", "northwind-invoice"], 0, 1 * D, ["workshops", "pricing", "rates", "proposals", "invoices"]],
      ["clients", "customers", "Clients we have worked with", "Who we have worked with, and what we think of them.", `| Company | Person | What | Notes |
| --- | --- | --- | --- |
| Northwind | Omar Haddad | Monthly advisory | Pays on time; likes a short summary |
| Lumen Labs | Priya Raman | Half-day workshop, August | Wants the notes; invoice open |
| Bello Realty | Aisha Bello | Half-day workshop, October | Came through Omar |
| Sunrise Yoga | Grace Okafor | Half-day workshop, June | Happy; ask about a repeat session |`, "scout", ["lumen-invoice"], 0, 3 * D, ["clients", "customers", "history"]],
      ["bills-and-due-dates", "money", "Bills and due dates", "What is due, when, and how it gets paid.", `## This month
| Bill | Due | Amount | How |
| --- | --- | --- | --- |
| Quarterly tax, installment 3 | Sep 30 | $1,240 | Waits for your OK |
| Business insurance | Oct 1 | $96 | Autopay |
| Internet | Oct 5 | $85 | Autopay |

## Penny's rule
- Anything not on autopay shows up in Waiting on you five days before it is due.`, "penny", ["quarterly-tax", "august-receipts"], 0, 1 * D, ["bills", "due dates", "taxes", "autopay", "money"]],
      ["tools-we-pay-for", "money", "Tools we pay for", "Every subscription, what it is for, and whether it earns its keep.", `| Tool | A month | For | Verdict |
| --- | --- | --- | --- |
| Design tools | $54.99 | Pastel's work | Keep |
| Scheduling app | $45 | Booking calls | Looks unused since Aug 8 |
| Video calls | $33.98 | Client calls | Keep |
| Stock photos | $12.99 | Posts | Looks unused since Aug 2 |
| Email tool | $12 | The newsletter | A cheaper plan covers 212 subscribers |
| Cloud storage | $2.99 | Files | Keep |`, "penny", ["sort-expenses"], 0, 1 * D, ["subscriptions", "tools", "spending", "savings"]],
    ];
    for (const [slug, project, title, lede, md, keptBy, linked, pinned, msAgo, tags] of notes) note.run(slug, project, title, lede, md, keptBy, JSON.stringify(linked), JSON.stringify(tags), pinned, t(msAgo + 6 * D), t(msAgo));

    // ------------------------------------------------------------ settings
    const setting = db.prepare(`INSERT INTO settings (key, value) VALUES (?, ?)`);
    setting.run("office_name", "Office");
    setting.run("user_name", "you");
    setting.run("hat_version", "0.0.1");
    setting.run("last_agent_visit", t(2 * 60000));
  });
  tx();
}

function processMarkdown(p: { name: string; kind: string; lead: string; steps: Array<[string, string, string, number?]>; done_when: string }): string {
  const names: Record<string, string> = { chief: "your chief of staff", pastel: "Pastel", patch: "Patch", sunny: "Sunny", scout: "Scout", penny: "Penny", you: "you", any: "whoever fits" };
  const steps = p.steps.map(([name, who, note], i) => `${i + 1}. **${name}** — ${names[who] ?? who}: ${note}`).join("\n");
  return `# How ${p.name} runs — ${p.kind}\n\n## Steps\n\n${steps}\n\n## Done when\n\n${p.done_when}\n`;
}
