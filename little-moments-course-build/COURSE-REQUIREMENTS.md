# Start here for Builds 1, 2 and 3

This upgrade adds course requirements to the connected edition. It is not yet a certified submission: live deployment, teacher greenlight, four-account browser/console tests, three independent users, and handwritten deliverables require evidence from your actual project.

## Installation order

1. Fresh project: run `sql/01-new-project.sql`, then `sql/04-course-upgrade.sql`. Existing installation of our previous connected app: back up your project, then run **only 04**. The additive migration retains existing memories and accounts. Run each migration once.
2. Follow SETUP.html for public keys, GitHub Pages, and provider callbacks.
3. For this assignment, set **Confirm email OFF** in Supabase Authentication. In Supabase's password security settings, set minimum length **8**, and require **lowercase, uppercase, and digits**. These are service settings: SQL does not configure the Auth service. Save and test a weak password directly against Auth to prove server enforcement. The older guide's email-confirmation/12-character settings are superseded by these course settings.
4. Enable email/password and GitHub login. Google remains an optional bonus. Supabase retains sessions across refresh; sign out is available in the sidebar.
5. Publish the new app.js/style.css, config.js and vendor files. All accounts, including existing ones, choose a unique username at next sign-in. Reserved names include admin, moderator, mod, administrator, support and system.
6. Sign in once with your owner account, then run 02 in the dashboard with your UID. Admin panel → Moderator access grants/removes moderators. Never put role information in config.js or profiles.

## Build 1 data design

My app saves one **memory**. Its six designed columns are **title, body, memory_date, mood, tags, favorite**. The pick-from-a-list column is **mood**: grateful, happy, calm, nostalgic, sad, excited. System columns are id, user_id, created_at and updated_at; deleted_at supports Trash. Every memory has the same shape. A chosen username from profiles identifies shared writing.

The journal is the look view; New memory opens a separate focused modal form with the background unavailable. It is not an inline form above the collection. Counts, search, mood filtering, favorites and date sorting provide more than three collection operations. There are 24 cards per displayed page. Empty collections have guidance; required/trimmed titles reject blank input; title length is 120, body 20,000, tags 10×30, report reason 500. A 500-character title is rejected; a 500-character story is supported.

The Build 1 'one table' criterion applies to the memory content table at that stage. Builds 2/3 explicitly require extra identity, permissions, reports and moderation tables. This final submission includes those supporting tables.

## Build 2/3 features added

- First-sign-in unique username, shown instead of email in profile/shared writing.
- Change password screen in Settings, with matching password fields and server enforcement once configured.
- Private storage, type/size restrictions, upload/view/download/delete.
- Separate moderators and admins tables. Only dashboard grants admin; only admins grant/revoke moderators through checked RPCs.
- Report dialog, staff-only reports, hide/unhide through hidden_posts, removal of shared memories and their files. Staff cannot rewrite another person's words.
- Moderation covers **shared memories**. Unshared private journal entries remain outside moderation. A recipient sees the author's username. Ask your teacher to approve this interpretation of a private journal before submission.
- Admin posting blocks in blocked_users and a database rule that checks that table.
- Delete my data removes owned files first, then owned memories and the account. If interrupted, retry; deleted files cannot be recovered. Admins must remove their role in the dashboard before deleting their own account.
- Dark mode toggle stores the preference in the user's profile.
- Privacy policy linked from application pages. It explains storage, visibility, sharing, staff and owner access, deletion, and retained moderation logs.
- Professional extras: writing download, moderation log, reserved usernames, confirmations, useful state messages, mobile layout, labels/alt text, title/favicon, posting blocks. Download is writing only; download file attachments separately.

## Evidence still required

Use ACCEPTANCE-TESTS.md. Record actual results; do not mark a test passed based only on a hidden button. Check the database result after console requests. The local PostgreSQL test is supporting evidence, not a live four-browser test.

The operator/contact text in privacy.html must be completed with your real portfolio/contact details. Link the deployed Little Moments URL from your portfolio. Obtain feedback from three other people. You must personally produce the handwritten explanation and diagram; project.md contains a guide to what they should explain.
