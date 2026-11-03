# Little Moments: fresh Supabase setup

Read COURSE-REQUIREMENTS.md first for the assignment upgrade. Run 01 then 04 for a new project, or only 04 after an existing installation of 01. Follow these steps in order. You do not need to send your keys to anyone.

This download is the **connected edition** of your app. The previous ZIP was browser-only; adding SQL to Supabase would not connect that version. This package adds email/password, Google and GitHub sign-in, cloud memories, private attachments, account sharing, and the original admin tools. It still needs no installation or build step. The official Supabase browser client is included in `vendor/`.

## 1. Know which value goes where

| Value | Where you get it | Where you put it |
| --- | --- | --- |
| Supabase Project URL | Supabase project → Connect, or project API settings | `config.js` → `supabaseUrl` |
| Supabase publishable key, beginning `sb_publishable_` | Supabase project → Settings → API Keys | `config.js` → `supabasePublishableKey` |
| Supabase secret key / old service_role key | Supabase API Keys | **Nowhere in this website. Not needed.** |
| Database password | Chosen when creating your Supabase project | Your password manager. Not needed in the app. |
| Google Client ID and Client Secret | Google Auth Platform → Clients | Supabase → Authentication → Sign In / Providers → Google |
| GitHub Client ID and Client Secret | GitHub → Settings → Developer settings → OAuth Apps | Supabase → Authentication → Sign In / Providers → GitHub |
| SMTP username/password | Your email delivery provider | Supabase → Authentication → SMTP Settings |

`config.js` is public source code. A publishable key is intended for browser use; database row-level security (RLS) controls what each signed-in account can access. Secret/service-role keys bypass that protection and must never be uploaded to GitHub. [Supabase key types](https://supabase.com/docs/guides/getting-started/api-keys)

If a secret is accidentally published, revoke/rotate it at its provider immediately. Removing it in a later Git commit does not invalidate it.

## 2. Create a completely new Supabase project

1. Open [Supabase Dashboard](https://supabase.com/dashboard) and sign in.
2. Choose **New project** and your organization. Name it `Little Moments`.
3. Generate a strong database password and save it privately. Pick a region appropriate for your users.
4. Create the project and wait for it to finish preparing. Plan/pricing options shown by Supabase are separate from this code package.
5. Copy the **Project URL** and the **publishable key**. Do not use the database connection string, project dashboard URL, or secret key.

## 3. Run the database SQL

1. Open the new project → **SQL Editor → New query**.
2. On your computer, open `sql/01-new-project.sql` from this download in a text editor.
3. Copy the **entire file**, paste it into SQL Editor, and click **Run**.
4. Run `sql/03-check-setup.sql` in another query to inspect the result.

You should have six tables: `profiles`, `admins`, `memories`, `memory_shares`, `announcements`, and `admin_audit`. Each should have RLS enabled. Storage should contain a private `memory-files` bucket with a 10 MB file limit.

Run the main script **once in the new project**. It is transactional: if an object already exists, it stops instead of dropping/replacing data. If you already ran it successfully, do not run it again. The SQL creates storage policies and the profile trigger for new users; you do not need to create tables or the bucket manually. It does not create Google/GitHub credentials or configure their providers.

## 4. Put the two public values into config.js

Open `config.js` in a text editor. Replace the placeholder URL and key, keeping the quotes and commas:

```js
window.LITTLE_MOMENTS_CONFIG = {
  supabaseUrl: "https://YOUR_PROJECT.supabase.co",
  supabasePublishableKey: "sb_publishable_YOUR_ACTUAL_KEY",
  siteUrl: "https://catuce428-alt.github.io/ella-sus-source-code/littlemoments/",
  enableGoogle: true,
  enableGitHub: true,
};
```

Use your actual Project URL and key, not the example text. Leave `siteUrl` as shown if you will use your existing repository and folder. If you use a different website address, update it here and in the provider/redirect settings below.

There is **no `.env` file** and no `VITE_` variable in this edition. You do not need GitHub repository secrets or Actions variables. Google/GitHub secrets do not go into `config.js`, SQL, HTML, or JavaScript.

The two booleans show or hide the corresponding sign-in buttons. They do not configure the providers. Set a provider to `false` while it is not yet ready.

## 5. Publish these files to GitHub Pages

1. Extract the ZIP. Keep a backup of the old app and download any local journal backup before replacing it.
2. In [your repository](https://github.com/catuce428-alt/ella-sus-source-code), open the **littlemoments** folder.
3. Upload the contents of this new package into that folder. Replace `index.html`, `app.js`, `style.css`, and `icon.svg`, and include the new `config.js` and the **vendor folder**.
4. Commit to `main`. Keep the separate game and fitness folders untouched. The SQL and guide files contain no secrets and can be included, but they do not execute simply because they are uploaded.
5. Open **Settings → Pages → Deploy from a branch → main → /(root) → Save** if that is not already configured. An existing custom deployment must publish these files unchanged instead of rebuilding the old Vite source.
6. Wait for deployment and open your site using the full HTTPS address below. If it still shows old content, hard-refresh after deployment completes.

```text
https://catuce428-alt.github.io/ella-sus-source-code/littlemoments/
```

Do not test real sign-in by double-clicking `index.html`. OAuth and confirmation/reset links need an HTTP/HTTPS return address. Use the published website consistently, with the trailing slash shown above. If you are already running a local HTTP preview, give it its own exact allowed return URL and set `siteUrl` accordingly while testing.

[GitHub Pages publishing settings](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)

## 6. Tell Supabase where to return people

In **Supabase → Authentication → URL Configuration**:

- **Site URL:** `https://catuce428-alt.github.io/ella-sus-source-code/littlemoments/`
- **Redirect URLs:** add that **same exact URL**, including the folder and trailing slash.

That address must match `siteUrl` in `config.js`. This package returns directly to `index.html` through its folder URL and uses the browser client's PKCE handling; you do **not** need to create a server `/auth/callback` route in GitHub Pages.

[Supabase redirect settings](https://supabase.com/docs/guides/auth/redirect-urls)

## 7. Set up Google sign-in

1. In Supabase, open **Authentication → Sign In / Providers → Google**. Copy the displayed **Callback URL**. It normally looks like `https://YOUR_PROJECT.supabase.co/auth/v1/callback`.
2. Open [Google Cloud Console](https://console.cloud.google.com/) and create/select a project for Little Moments.
3. Open **Google Auth Platform**. Complete **Branding** with app name `Little Moments`, a support email, and a developer contact email. Under **Audience**, choose **External** for use by ordinary Google accounts. While testing, add the Google accounts you will use under **Test users**.
4. Under **Data Access**, use only basic sign-in scopes: `openid`, email, and profile. The app does not need Gmail, Drive, or Calendar permissions.
5. Open **Clients → Create client → Web application**. Name it `Little Moments Web`.
6. **Authorized JavaScript origins:** enter `https://catuce428-alt.github.io` — origin only, without `/ella-sus-source-code/littlemoments/`.
7. **Authorized redirect URIs:** paste the **Supabase Callback URL** copied in step 1. This is not your GitHub Pages address.
8. Create the client. Copy its **Client ID** and **Client Secret** into the **Google provider settings in Supabase**, enable Google, and save.
9. Ensure `enableGoogle: true` in `config.js`, publish that file, then click **Sign in → Continue with Google** on your website.

Sources: [Supabase Google setup](https://supabase.com/docs/guides/auth/social-sign-in/auth-google), [Google OAuth web clients](https://developers.google.com/identity/protocols/oauth2/web-server).

When moving beyond testing, review Google's Audience/publishing and verification requirements. Provide accurate branding and a real privacy policy for your operation; this code's generic privacy dialog is not a substitute for those details. School/work administrators may restrict Google OAuth independently of your app. [Google production requirements](https://developers.google.com/identity/protocols/oauth2/production-readiness/policy-compliance)

## 8. Set up GitHub sign-in

1. In Supabase, open **Authentication → Sign In / Providers → GitHub** and copy its **Callback URL**.
2. Open [GitHub OAuth Apps](https://github.com/settings/developers) → **New OAuth App** (or **Register a new application**).
3. Fill in **Application name:** `Little Moments`.
4. **Homepage URL:** `https://catuce428-alt.github.io/ella-sus-source-code/littlemoments/`.
5. **Authorization callback URL:** paste the **Supabase Callback URL** from step 1. Leave **Device Flow** off.
6. Register the application. Copy the **Client ID**, then choose **Generate a new client secret** and copy that secret.
7. Back in **Supabase → Authentication → Sign In / Providers → GitHub**, enable it, paste the Client ID and Client Secret into their corresponding fields, and save.
8. Ensure `enableGitHub: true` in `config.js`, publish that file, then click **Sign in → Continue with GitHub** on the website.

This uses a GitHub **OAuth App** for user login. You do not need a personal access token, repository secret, or GitHub App installation for this sign-in flow. Signing into the journal does not grant a user control of your repository.

Sources: [GitHub OAuth App creation](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app), [Supabase GitHub setup](https://supabase.com/docs/guides/auth/social-sign-in/auth-github).

## 9. Set up email/password and password reset

1. In **Supabase → Authentication → Sign In / Providers → Email**, enable Email and set **Confirm email** OFF for the course. Allow new sign-ups if you want people to register.
2. Set the minimum password length to **8**, and require lowercase letters, uppercase letters, and a number in Supabase. The precise dashboard grouping may be under password security settings.
3. In **Authentication → SMTP Settings**, configure an email delivery provider for real users. Enter its SMTP host, port, username/password, sender address, and sender name in Supabase. Follow that provider's sender-domain verification steps.
4. Keep the standard confirmation and password-reset email templates for the first test. If you later customize them, preserve the working confirmation/recovery link.
5. On the app, choose **Create an account**, register an email you control, and sign in directly (Confirm email is OFF for the assignment).
6. Sign out. Choose **Forgot password?**, request a reset, and open the newest reset link in that same browser/profile. The app should display **Choose a new password**.

Supabase's default mail service is restricted to authorized project-team addresses and has low limits; it is not a public production mail service. Google/GitHub login can be tested independently while you set up SMTP. [SMTP setup](https://supabase.com/docs/guides/auth/auth-smtp), [password authentication](https://supabase.com/docs/guides/auth/passwords).

The same-browser requirement comes from PKCE: the browser keeps the verifier needed to finish the link. If a link opens on another device, return to the original browser or start the request again there. [PKCE flow](https://supabase.com/docs/guides/auth/sessions/pkce-flow)

## 10. Make your own account an admin (optional)

1. Sign in to the published app once using your preferred method so your user and profile exist.
2. In **Supabase → Authentication → Users**, find your account and copy its **User UID**.
3. Open `sql/02-make-me-admin.sql`. Replace `PASTE_YOUR_USER_UUID_HERE` with that UID, keeping the quotes.
4. Paste the edited script into **SQL Editor → New query → Run**.
5. Reload the website. **Admin panel** should appear.

Admin status is stored in a database table; it is not a field someone can change in their profile or `config.js`. Admins can suspend/restore non-admin accounts, publish announcements, and inspect account-action records. The in-app role does not grant access to unshared journal entries. The Supabase project owner still has operator access through the dashboard.

Suspension blocks journal/database/file access through the policies. It does not itself revoke the Auth session. For an identity-level ban, use Supabase's user administration as well. To delete an admin's account, first remove its admin row using your project-owner access; normal account deletion deliberately refuses admin accounts.

## 11. Test with two accounts before sharing the app

Use two different people/accounts in separate browser profiles, A and B. Different providers using the same verified email may become the same Supabase user; use distinct emails for this test.

1. A saves a memory and attaches a small photo.
2. B opens the journal: A's private memory should not appear.
3. B copies its **Settings → sharing code**. A opens the memory → **Share** and pastes B's code.
4. B clicks **Refresh**, then **Shared with me**. The memory should be readable, with no edit/upload controls.
5. A revokes the share. B refreshes: access should disappear. Already-downloaded copies cannot be recalled.
6. A tests favorites, search, mood filters, Trash/restore, export, and an attachment download. Sharing is account-based, not a public link or email invitation service.
7. Test Google, GitHub, email confirmation, and recovery independently on the final HTTPS address.

The private bucket allows JPEG, PNG, WebP, PDF, MP3, WAV, and MP4, maximum **10 MB per file**. No additional bucket creation is required. Cloud writing export does not include file contents; download attachments separately. Permanent deletion removes a memory's files first. Account deletion requires removing all attachments, including ones in Trash.

The previous offline journal is not automatically uploaded or imported into this fresh cloud project. Keep its backup and use the old offline edition to read it. This setup does not access or migrate any earlier Supabase database.

## The two return addresses, side by side

| Address | Put it here |
| --- | --- |
| `https://YOUR_PROJECT.supabase.co/auth/v1/callback` | Google **Authorized redirect URIs** and GitHub **Authorization callback URL** |
| `https://catuce428-alt.github.io/ella-sus-source-code/littlemoments/` | Supabase **Site URL**, Supabase **Redirect URLs**, and `config.js` **siteUrl** |
| `https://catuce428-alt.github.io` | Google's **Authorized JavaScript origins** |

Flow: **Your website → Google or GitHub → Supabase callback → Your website.**

## If something fails

| Symptom | Check |
| --- | --- |
| Setup message instead of working sign-in | Replace both placeholders in `config.js`, upload the file, and refresh. |
| Supabase client did not load / blank page | Upload `vendor/supabase.js` and the other files with the original folder structure. This package does not use the old `src/` entry point. |
| Google `redirect_uri_mismatch` | Google must contain the exact callback shown in Supabase, including `/auth/v1/callback`. |
| GitHub callback mismatch | The OAuth App's callback must be Supabase's callback, not the Pages homepage. |
| Provider is not enabled / unsupported provider | Enable it in Supabase and save its Client ID/Secret. A `true` flag only shows the button. |
| Redirect goes to localhost or wrong repository | Correct Supabase Site URL, Redirect URLs, and `config.js` siteUrl so they agree. |
| Google denies a test user | Add the account under Audience → Test users; check organizational restrictions and publishing status. |
| Confirmation/reset email missing | Check SMTP setup, verified sender, spam, and auth mail limits. Default SMTP cannot send to arbitrary addresses. |
| Invalid/expired link or missing verifier | Request a fresh link and open it in the same browser/profile and exact website origin that initiated it. |
| Database error saving new user | Confirm the initial SQL succeeded; inspect Supabase Auth/database logs. Do not disable RLS to fix it. |
| Relation already exists when running SQL | You may have already run it, or this is not a fresh project. Use the read-only checker instead of dropping tables. |
| Permission denied / new row violates RLS | Confirm you are signed in to the same project configured in `config.js`, that the SQL policies exist, and that your account is not suspended. |
| Admin panel absent | The UID in `admins` must match the account you are currently signed in as; reload after adding it. |
| Shared journal looks out of date | Click Refresh. This edition does not subscribe to live updates. |

If a problem remains, share the **error text** and which numbered step failed. Do not share provider secrets, database passwords, or a whole callback URL containing a login code.

## What has been verified

The SQL was tested locally using PostgreSQL semantics against mocked Supabase Auth/Storage tables. Checks cover owner isolation, sharing/revocation, private storage rules, suspension, forbidden admin promotion, restricted profile fields, and account/file deletion guards. These are not live Supabase integration tests.

Google/GitHub authorization, SMTP delivery, and real Supabase Storage require your new project and provider credentials. They have not been completed on your account. `VALIDATION.md` lists the exact local checks.

No website publishing, cloud project creation, paid-plan selection, or credential changes were performed for you. Everything needed to upload the site and configure it is in this folder.
