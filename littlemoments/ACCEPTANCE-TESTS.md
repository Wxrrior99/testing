# Honest acceptance record

Project URL: ______  Date: ______  Tester: ______

Local PostgreSQL checks passed for the original isolation/share/storage rules plus upgrade creation, username grants, reserved-column protection, moderator promotion restrictions, report visibility, hide/unhide, and admin-only logs. These used simulated auth identities. Real Supabase/browser results below are **NOT RUN** until you fill them in.

Create four separate test users: Sam (normal), Lee (normal), Mo (moderator), Ava (admin). Use separate browser profiles or sign out completely between tests. Confirm email OFF permits disposable test addresses. Dashboard makes Ava admin; Ava's panel makes Mo moderator. Test only disposable data.

| Test | Signed in as | Expected | Actual / evidence |
| --- | --- | --- | --- |
| Sign up/email password; reject weak password via direct Auth request | Sam | server rejects missing uppercase/lowercase/digit or <8 | NOT RUN |
| GitHub sign-in; refresh; sign out | Lee | session persists; sign-out removes access | NOT RUN |
| Unique/reserved username; first-login screen | Sam/Lee | duplicate/admin/mod rejected | NOT RUN |
| Change password and use new password | Sam | new password works | NOT RUN |
| Read Lee's unshared data/files | Sam | zero rows/no download | NOT RUN |
| Rewrite/remove Lee's data | Sam | no changed/deleted rows | NOT RUN |
| Insert self in admins/moderators from console | Sam | rejected; no role added | NOT RUN |
| Update profile with role/username/other protected columns | Sam | rejected; privileges unchanged | NOT RUN |
| Grant moderator | Ava | allowed; Mo gets moderation view | NOT RUN |
| Grant moderator/admin | Mo | rejected | NOT RUN |
| Shared content report | Lee | report saved; reporter cannot read reports table | NOT RUN |
| Read reports | Sam / Mo / Ava | Sam zero rows; Mo/Ava allowed | NOT RUN |
| Hide shared post | Mo | hidden_posts row added; recipients cannot see post/file | NOT RUN |
| Rewrite author words | Mo | zero changed rows | NOT RUN |
| Remove shared post and file | Mo | file gone then memory gone | NOT RUN |
| Remove own memory/file | Sam | allowed with confirmation | NOT RUN |
| Admin-only moderation log | Mo / Ava | Mo zero rows; Ava sees actions | NOT RUN |
| Block/unblock posting | Ava then Sam | blocked insert fails; unblocked works | NOT RUN |
| Upload disallowed/empty/oversized file | Sam | rejected by app and bucket rules | NOT RUN |
| Delete my data | Lee | all owned files/data/profile/account removed | NOT RUN |
| Dark mode then refresh/sign out/in | Sam | account preference retained; text readable | NOT RUN |
| Empty collection, blank input, 500-char input, 300 memories | Sam | clear validation, counts, search/filter/sort and paging | NOT RUN |
| Phone use with keyboard/forms/media | external tester | no blocked controls or sideways page scrolling | NOT RUN |
| Portfolio link opens live production app | external tester | correct HTTPS URL | NOT RUN |

Console helper (on the app page): `db` is the signed-in SDK client. Example: `await db.from('moderators').insert({user_id:user.id})` must fail for Sam. Try `await db.from('memories').update({body:'changed'}).eq('id','LEE_MEMORY_UUID').select()` as Sam/Mo: it must not modify Lee's row. For blocked UPDATE/DELETE, inspect returned rows and reload the original; absence of an error is not proof of success.

Break the Lock source: https://smith-teaches-tech.github.io/classroom-games/building-with-ai/break-the-lock/ . Complete its interactive lesson yourself and compare every checklist item with this record.

Independent users (three OTHER people required):

| Person | Date | Task completed without help | Issue / fix / retest |
| --- | --- | --- | --- |
| 1: ______ | ______ | ______ | ______ |
| 2: ______ | ______ | ______ | ______ |
| 3: ______ | ______ | ______ | ______ |

Teacher greenlight: ______. Handwritten explanation: ______. Handwritten rule diagram: ______. Live URL: ______. Portfolio link: ______.
