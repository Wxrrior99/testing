Start with COURSE-REQUIREMENTS.md for Builds 1–3. Run 01 then 04 on a fresh project. The old configuration/confirmation instructions are superseded by the course instructions.

# Little Moments — Supabase-connected edition

Start with **SETUP.html** (open in a browser) or **SETUP.md**.

1. Create a fresh Supabase project.
2. Run `sql/01-new-project.sql` once in its SQL Editor.
3. Put only the Project URL and `sb_publishable_` key into `config.js`.
4. Upload this folder's contents, including `vendor/`, to GitHub Pages.
5. Configure website redirect URLs, Google/GitHub OAuth, and email delivery using the guide.
6. Optionally run the admin bootstrap after your first sign-in.

The website requires no npm, Node.js, Vite, build process, or local installation. The official Supabase client is bundled locally. This edition requires an internet connection and a configured Supabase backend. It replaces the previously delivered local-only app; that app will not connect just by running SQL.

Keep all secrets out of GitHub. The only key intended in `config.js` is a **publishable** key. Google and GitHub client secrets belong in Supabase's provider settings. The database password and Supabase secret/service_role keys are not used by this website.

The cloud edition exports writing only. Attachments must be downloaded separately. Existing local backups are not automatically migrated. No cloud project or provider credentials are included.

Files:

- `index.html`, `app.js`, `style.css`, `icon.svg`: website.
- `config.js`: your two public Supabase values and website URL.
- `vendor/supabase.js`: official Supabase browser client, version 2.118.0.
- `sql/01-new-project.sql`: new database, RLS policies, triggers and private bucket.
- `sql/02-make-me-admin.sql`: optional admin bootstrap using your own User UID.
- `sql/03-check-setup.sql`: read-only setup inspection.
- `SETUP.html`, `SETUP.md`: complete instructions and troubleshooting.
- `VALIDATION.md`: what was tested and what still needs your live project.
- `THIRD-PARTY-NOTICES.md`, `vendor/SUPABASE-LICENSE.txt`: client-library attribution.
