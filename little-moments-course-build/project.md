# Little Moments — planner draft for teacher greenlight

Status: DRAFT, not greenlit. Existing project extended through Builds 1–3.

One saved thing: a memory. Fields: title, body, memory_date, mood, tags, favorite. Mood choices: grateful/happy/calm/nostalgic/sad/excited.

Views: journal browsing; focused New/Edit memory dialog; Settings; first-sign-in username; password change; admin panel; moderation; privacy policy.

Tables and checks:

| Table | Who can do what | Checks |
| --- | --- | --- |
| profiles | user reads own; admins roster; user changes theme; username via one-time RPC | auth.uid, active_user, username constraints |
| memories | owner CRUD; chosen recipients read visible shared rows; staff read shared rows | profiles, shares, hidden_posts, blocked_users, moderators, admins |
| memory_shares | owner grants/revokes; recipient leaves | memories, profiles, blocked_users |
| admins | own role read; dashboard changes only | admins, profiles |
| moderators | admins grant/revoke via RPC; no self-promotion | admins |
| reports | signed-in reader submits through RPC; staff reads | memories, shares, moderators, admins |
| hidden_posts | staff hides/unhides via RPC; no editing writing | moderators, admins, shares |
| blocked_users | admins manage via RPC; blocks new posting/sharing | admins; checked by can_post |
| moderation_log | server functions append; admin-only read | admins |
| storage.objects | owner files; permitted readers download; staff removes shared files | memories, shares, hidden_posts, moderators, admins |

Private unshared memories are excluded from staff browsing. Shared memories can be reported/reviewed/hidden/removed. Teacher approval needed for this interpretation.

Security boundary: RLS, restricted column grants and checked security-definer RPCs. Interface controls do not grant permissions. No provider secret in source. Auth password rules are configured separately in Supabase.

Extras chosen: writing export, moderation log, reserved names, confirmation, clear states, mobile layout, accessibility labels, favicon/title, posting blocks.

Handwritten explanation: explain a save request from the form to Supabase; explain auth.uid and RLS; explain how roles are checked in separate tables; explain storage permissions and deletion order.

Handwritten diagram: browser → Supabase Auth → memory table; arrows from memory SELECT to shares and hidden_posts; from staff checks to moderators/admins; from posting to blocked_users; from storage policy to memory access. Draw this yourself and label which rule reads each table.
