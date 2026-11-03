# Validation — November 4, 2026

## Course upgrade status

The combined 01 + 04 migrations passed the local PostgreSQL policy suite, including added checks for moderator grants, forbidden self-promotion, staff-only reports, hidden_posts hide/restore, immutable usernames and admin-only logs. App syntax and the existing auth/vendor/domain tests passed (11 test groups). These are simulated database/Auth identities, not the required four real browser sessions. New username/theme/password/moderation/delete-data UI flows still require live integration testing. ACCEPTANCE-TESTS.md records those as NOT RUN. No three-person usability test, teacher approval, deployment, or handwritten artifact is claimed.

## Automated checks

Eleven test groups passed locally:

- Supabase client initializes with a public key and browser PKCE callback handling.
- The actual bundled browser library creates and initializes a PKCE client with no existing session, without making a network request.
- Secret/legacy keys and wrong project URL formats are rejected before client initialization.
- Google and GitHub sign-in calls use the configured GitHub Pages return URL.
- Invalid providers and `file:` sign-in attempts are rejected.
- Both provider buttons exist on the sign-in form; recovery omits them.
- File type/size validation; writing/tag normalization; text escaping; compound filters.
- The actual new-project SQL executes in local PostgreSQL through PGlite against mock Supabase Auth/Storage schemas.

The SQL group checks owner access; stranger denial; shared read-only access; storage access; trash visibility; share revocation; blocked admin escalation; protected profile and memory-ID columns; individual tag-length constraints; suspension; audit entries; attachment deletion guards; and account deletion. It also emulates explicit default function grants to anonymous/authenticated roles and verifies anonymous access to privileged helpers is removed. Social-provider names create profiles, while an `is_admin` metadata flag grants no admin role.

Application JavaScript syntax was checked. The official Supabase client archive was verified against the original lockfile's SHA-512 integrity value. The ZIP includes the browser client, configuration file, relative assets, SQL, and instructions; no Node.js or installation is required by the user.

## Limits

Chrome preview confirmed that the real packaged browser scripts load, the landing page renders, placeholder configuration displays the setup instructions, and the demo journal opens with the Refresh control. No JavaScript errors were reported in that preview. The HTML setup guide and its keys table were also visually checked.

No actual Supabase project URL/key or OAuth credentials were supplied. No live project was created or modified. Google/GitHub consent, real email delivery, recovery links, and real Storage operations therefore remain unverified end-to-end. The setup guide contains the production acceptance steps for your configured project.

The SQL test uses mock service schemas, not Supabase's running Auth/Storage services. It verifies database behavior and policies, not SMTP, provider dashboards, storage-bucket enforcement, or a real deployment.

The cloud edition uses the original journal UI with no-build scripts, locally bundled icons/client, and Google/GitHub sign-in controls. It does not migrate your previous offline journal or any existing cloud database. Export in this edition contains writing, not attachment bytes.
