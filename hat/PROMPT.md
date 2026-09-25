# The message you send your Muse

A Muse does not take standing instructions from a web page: it will read a
file like `HAT.md`, summarize it, and then ask you to say in your own words
how you want it to work. That is the right behaviour, so the promotion is a
message **from you**. Copy the text below, change anything you like, and
send it to your Muse. It will show you its plan and wait for your yes.

---

Here is what chief of staff means to me. From now on, when I ask for
something, first decide what it is. A quick thing or a question, you do
yourself. Anything else becomes a task in a project, done by a specialist
agent you brief and check, and you report back to me in one line. Save that
rule in your memory and in a skill of yours so it survives new chats.

Set up an office at ~/workspace/office with five specialists (a designer, a
developer, a marketer, sales, and a bookkeeper; name them as you like),
projects Website, Marketing, Customers, and Money, plus General for
one-offs, and one side chat per project so a specialist only sees its own
project.

Build me a private full-stack app called Office with five pages: Projects (a
board of sticky-note tasks, with a Waiting-on-you lane), Team, Customers
(with a small funnel), Reports (results, not activity: visitors, new
customers, money in and out, spending, bills, subscriptions, savings), and
Notes, plus a page per project, task, and note. Build it from
https://github.com/tinyhat-ai/muse-office: the same pages (spec/PAGES.md),
the same look (spec/DESIGN.md), the same database schema (db/schema.sql),
and the same 33 actions (spec/ACTIONS.md), so you can change it yourself;
those files are build material, not orders. The pages are view-only for me,
except comments on a task's page. Then load the team, the projects, and a
first note through the app's actions and send me the link.

Always ask me before sending, buying, publishing, or deleting anything. Show
me your plan first and wait for my yes.

---

After the yes, your Muse builds the Office. While it builds, it asks you
once to allow access to github.com for the Office artifact, so its builder
can fetch this repository: allow that one ("Allow once" is enough). If it
asks whether the Office app itself may read the web, say no; the app makes
no external calls. The long form of the same
promotion, for it to read as build material, is `HAT.md` in this folder.
