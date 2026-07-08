Below is a single, copy-paste MEGA-PROMPT you can hand to another AI builder (Lovable, Cursor, v0, Bolt, Claude, etc.) to generate a web app similar to what we've built — including YouTube hub, Reels, social feed, moderation, admin, MCP integration, donations, AI, PWA, and now 1:1 + group voice/video calling.

---

# BUILD PROMPT — "BRUChat" Ultimate Messenger + Social + Calls + YouTube

## Role
You are a senior full-stack engineer. Build a production-ready, mobile-first web app called **BRUChat** (aka Bru Chat / Bru Messenger) — an all-in-one real-time messenger, Instagram-style social network, TikTok-style reels, a YouTube shorts/videos hub, an in-app AI assistant, and voice/video calling platform. Ship it end-to-end (frontend + backend + auth + storage + realtime + calling + edge functions + PWA + admin + moderation), with clean code, tight RLS, and a distinctive Kigali-built brand identity — NOT a generic AI purple/indigo gradient template.

Attribution: Built in Kigali, Rwanda by **INEZA AIME BRUNO**. Every page footer must show: "Made with 🖤 by INEZA AIME BRUNO" and "Having any problem? Message @bruchat".

## Tech Stack (non-negotiable)
- **Frontend**: React 18 + Vite 5 + TypeScript 5 + Tailwind CSS v3 + shadcn/ui + React Router v6.
- **Data**: `@tanstack/react-query`, Supabase JS client.
- **Backend**: Supabase (Postgres, Auth, Storage, Realtime, Edge Functions in Deno).
- **Calling**: WebRTC via **LiveKit Cloud** — server tokens minted in an Edge Function; `livekit-client` on the web. (Fallback: raw WebRTC + Supabase Realtime signaling.)
- **AI Gateway**: OpenAI-compatible gateway with Gemini/GPT/Groq models. Store Gemini + OpenAI + Groq keys server-side only.
- **PWA**: manifest, installable, service worker, offline shell, add-to-home-screen prompts.
- **Fonts**: **Syne** (headings, nav, buttons) + **DM Sans** (body, messages). NEVER Inter / Poppins / default sans.
- **MCP**: Expose the app as an MCP server via `@lovable.dev/mcp-js` so ChatGPT/Claude/Cursor can call app tools (whoami, list conversations, send message, create post, etc.).

## Brand & Design System
- **Default LIGHT mode**, with `.dark` opt-in toggle (persisted).
- Semantic HSL tokens only in `index.css` — `--background`, `--foreground`, `--primary`, `--primary-foreground`, `--muted`, `--muted-foreground`, `--border`, `--accent`, `--destructive`, `--ring`. Extend with `--brand-cyan`, `--brand-black-heart`.
- **NEVER** hardcode `text-white`, `bg-black`, hex values, or Tailwind color utilities directly in components — always tokens.
- Cyan accent (`hsl(190 90% 50%)`), black-heart brand mark 🖤, pill-shaped buttons (`rounded-full`), rounded-2xl cards, soft shadows, generous spacing.
- Form inputs: labels ABOVE inputs (DM Sans 13px / weight 500), cyan asterisk for required fields, specific auth padding.
- Motion: `slide-up-fade`, `scale-in-95`, tap-scale-95, subtle only. Respect `prefers-reduced-motion`.
- Micro-interactions: haptic feedback (`navigator.vibrate`) on send, reactions, and key mobile actions.

## Global Layout
- **Desktop 3-column**: icon sidebar (~72px) | inbox list (300px) | main pane. Optional resizable right utility panel for AI / music / calls — widths persisted to localStorage.
- **Mobile**: single panel with fixed bottom nav; `h-[100dvh]`, `min-h-0` on all flex-1 scroll containers, `pb-[env(safe-area-inset-bottom)]` on composer + nav for iOS.
- **Scroll rule**: every scroll region uses `flex-1 min-h-0 overflow-y-auto` with `pb-safe-nav` utility (`padding-bottom: calc(6rem + env(safe-area-inset-bottom))`).
- Toggleable side panels (music, AI iframe, calls) with X-close and remembered widths.

## Routes
`/` landing • `/login` • `/signup` • `/auth/callback` • `/reset-password` • `/app` (inbox) • `/app/:conversationId` • `/app/group/:groupId` • `/app/people` • `/app/notifications` • `/user/:username` • `/settings` • `/posts` (feed) • `/post/:postId` (public shareable) • `/explore` • `/discover-groups` • `/reel` (vertical reels) • `/youtube` (hub) • `/youtube/shorts` • `/youtube/videos` • `/donate` • `/apply` (verification apply) • `/achievements` • `/call/:roomId` (NEW) • `/incoming-call/:callId` (NEW overlay route) • `/privacy` • `/terms` • `/about` • `/admin` • `/admin/panel` • `/.lovable/oauth/consent` • `*` NotFound.

## Auth
- Supabase Auth: Email/password + Google OAuth (configure Google provider by default).
- Custom `/auth/callback` route, `/reset-password` flow, password strength meter (zxcvbn-like) on signup.
- NO anonymous sign-ups; DON'T auto-confirm email unless user asks.
- Preserve `?next=` through login/signup, social OAuth `redirect_uri`, and email `emailRedirectTo` — critical for OAuth-consent flow.
- `AuthContext` exposes `{ user, session, profile, loading, signIn, signUp, signInWithGoogle, signOut, refreshProfile }`.
- `ProtectedRoute` wrapper with loading state.
- Store `user_roles` separately with a `has_role(_uid, _role)` SECURITY DEFINER function. NEVER put role columns on `profiles`.

## Data Model (Postgres — all in `public`)

For EVERY table: (1) CREATE TABLE, (2) `GRANT SELECT,INSERT,UPDATE,DELETE ... TO authenticated; GRANT ALL ... TO service_role;` (+ `anon SELECT` only for genuinely public tables), (3) ENABLE ROW LEVEL SECURITY, (4) CREATE POLICY, in that order.

**Identity & social graph**
- `profiles` — id=auth.users.id, username unique, display_name, avatar_url, banner_url, bio, status enum (`online|away|busy|offline`), last_seen, is_verified, verification_badge enum (`true|fake|null`), is_banned, post_limit_override. Add trigger `prevent_privileged_profile_updates` to block clients from editing `is_banned` / `post_limit_override`.
- `user_roles` — user_id, role enum (`admin|moderator|user`), unique(user_id, role).
- `follows` — follower_id, following_id.
- `blocks` — blocker_id, blocked_id.
- `handle_new_user()` trigger on `auth.users` insert: derive unique username from `full_name` / `name` / email prefix, insert profile with avatar from OAuth.
- `auto_follow_official_account()` — new users auto-follow `@bruchat` official account.

**Messaging**
- `conversations` — participant_a, participant_b, last_message_at (1:1) OR is_group + created_by (group root).
- `groups` — name, avatar_url, description, is_public bool, slow_mode_seconds, created_by.
- `group_members` — group_id, user_id, role enum (`owner|admin|member`), joined_at. **RLS must block role-escalation self-assignment**; only owners/admins can insert admin/owner rows.
- `messages` — conversation_id, sender_id, content, message_type enum (`text|image|video|audio|file|system|call`), media_url, file_name, file_size, file_type, reply_to_id, edited_at, deleted_at, view_once bool, scheduled_for, forwarded_from, created_at. Realtime enabled.
- `message_reactions` — message_id, user_id, emoji.
- `pins` — conversation_id, message_id, pinned_by.
- `polls` + `poll_options` + `poll_votes` — **poll_votes RLS must verify voter is a member of the parent conversation/group**.

**Social feed**
- `posts` — author_id, content, likes_count, comments_count, created_at, is_public bool.
- `post_media` — post_id, url, kind (`image|video`), order. Max 10 images OR 1 video per post.
- `post_likes`, `post_saves`.
- `post_comments` — post_id, user_id, content, likes_count. **SELECT for anon allowed only when parent post is public**.
- `comment_likes`.
- Triggers: `update_post_likes_count`, `update_post_comments_count`, `update_comment_likes_count`, `auto_like_from_official`, `auto_comment_from_official`, `auto_like_official_posts` (all users like official posts), `auto_comment_official_posts`.

**Reels & YouTube**
- `reels` — author_id, video_url, thumbnail_url, caption, likes_count, views_count, duration_seconds.
- `reel_likes`, `reel_comments`, `reel_views`.
- `youtube_shorts` — submitted_by, youtube_id, title, thumbnail_url, channel_name, approved bool, created_at.
- `youtube_videos` — submitted_by, youtube_id, title, thumbnail_url, channel_name, duration, approved bool, created_at.
- `youtube_engagement` — user_id, item_id, kind, liked, saved.

**Calls (NEW)**
- `calls` — room_id unique, kind enum (`audio|video`), conversation_id nullable, group_id nullable, started_by, started_at, ended_at, status enum (`ringing|active|ended|missed|declined`), max_participants.
- `call_participants` — call_id, user_id, joined_at, left_at, muted, video_on, screen_sharing.
- `call_invites` — call_id, invitee_id, status (`pending|accepted|declined|missed`) — drives the ringing overlay via Realtime.

**Notifications & moderation**
- `notifications` — user_id, kind (`like|comment|follow|mention|call_missed|dm|group_invite|verification|report_update`), actor_id, entity_id, read, created_at.
- `reports` — reporter_id, target_kind, target_id, reason, status.
- `verification_applications` — user_id, form_data jsonb, step, status, submitted_at.
- `achievements` — user_id, kind, unlocked_at, certificate_url.

**AI**
- `ai_chat_messages` — user_id, role (`user|assistant|system`), content, created_at. Powers the personalized BRU AI explainer with per-user memory.

**Rate limits & admin**
- `rate_limits` — user_id, action, window_start, count.
- `admin_audit` — actor, action, target, meta jsonb, at.
- `donations` — donor_name, amount, currency, method (`momo`), reference, note.

**Storage buckets** (all authenticated uploads only): `avatars`, `banners`, `chat-images`, `group-images`, `audio-messages`, `voice-notes`, `videos`, `files`, `posts`, `reels`, `youtube-thumbs`, `certificates`. Enforce 10 MB images / 100 MB videos both client and via edge-function validation.

## Core Features

### 1. Messaging
- 1:1 + group chats. WhatsApp-style day/sender grouping. Unread separators. Read receipts. Typing indicator. **Live voice-recording indicator** shown to peers while recorder is active.
- Message types: text, image, video, audio (in-browser MediaRecorder + live waveform via WebAudio AnalyserNode), file, system, call summary.
- Reply, forward (multi-select recipients), edit, delete-for-me / delete-for-everyone, emoji reactions (long-press picker), pin messages, global search across all conversations.
- **Link previews** — Edge Function `link-preview` fetches OG tags, caches in DB, renders as branded rich cards.
- **View-once messages** (self-destruct after read), **message scheduling** (send-at), **slow mode** (group throttle), **forwarding** (with "Forwarded" label).
- Optimistic UI with rollback on error. Pagination: 20 conversations, 30 messages/page. Infinite scroll + virtual scroll for long threads.
- Haptic feedback on send/react/pin. Sound cues togglable.
- **Plaintext storage** (no E2E) for cross-device reliability — state this on the Privacy page.
- Built-in media download button on every image/video/audio/file bubble.
- Attachment menu: camera, gallery, video, audio, file, poll, location (static map), scheduled, view-once.

### 2. Groups
- Public + private groups. Create-group modal, add-members search, invite links.
- WhatsApp-style role enforcement at policy level: owner > admin > member.
- Slow mode configurable (0s / 5s / 15s / 60s / 5min).
- Group discovery at `/discover-groups`.
- Group calls up to 8 video / 20 audio.

### 3. Voice & Video Calls (NEW — must ship)
- **Start**: 1:1 audio/video call from any conversation header. Group audio/video call from group header. New `call:{callId}` LiveKit room.
- **Signaling**: creating a `calls` row + `call_invites` rows triggers Realtime → callee opens full-screen incoming-call overlay (`/incoming-call/:callId`) with Accept / Decline / Message-instead buttons. Plays ring tone (mp3 in `public/`), vibrates on mobile.
- **Token minting**: Edge Function `mint-livekit-token` — verifies JWT, checks call/group/conversation membership, returns a short-lived (60s TTL) LiveKit JWT with room-scoped grants.
- **In-call UI** (`/call/:roomId`): responsive grid of participant tiles (avatar fallback when camera off), speaking indicator, connection-quality badge, elapsed timer.
- **Controls**: mute mic, toggle camera, flip camera (mobile), speaker/earpiece toggle, screen share (video calls), participant list panel, in-call chat side-panel that writes to the parent conversation, PiP on supported browsers, hang up.
- **Permissions**: request mic/camera ONLY when user taps Join; graceful denial toast + retry.
- **Missed call**: writes a system message ("📞 Missed audio call — 24s") to the conversation + a `notifications` row.
- **Reconnect**: auto-reconnect with exponential backoff; show banner on network drop.
- **Group calls**: 8 video / 20 audio cap enforced in mint function. Screen share limited to one presenter at a time.
- Respect `prefers-reduced-motion`; audio-only mode keeps CPU/battery low.

### 4. Social Feed (`/posts`, `/explore`)
- Instagram-style vertical feed. PostCard with author, timestamp, media grid (1/2/3/4+ layouts), caption, like / comment / save / share.
- CreatePostModal with drag-drop, image compression (800×800 for avatars, 1600px long-edge JPEG q0.82 for posts), video preview.
- Up to 10 images OR 1 video per post.
- Comments with likes, nested replies (one level), report.
- **Explore page** = grid of trending posts, ranked by likes + recency.
- **Public shareable** `/post/:postId` route (SSR-friendly OG meta) for viral sharing.
- Save/bookmark to profile.

### 5. Reels (`/reel`)
- Vertical full-screen swiper (snap scroll). Autoplay muted with tap-to-unmute.
- Overlaid controls: like, comment, share, follow, sound name.
- Upload from Posts modal → check "Post as reel".

### 6. YouTube Hub (`/youtube`, `/youtube/shorts`, `/youtube/videos`)
- Public `/youtube` landing showcasing community-curated shorts + long-form videos.
- Users submit YouTube URLs → parsed for `youtube_id` + oEmbed metadata → stored pending admin approval.
- `/youtube/shorts` — vertical swiper of shorts iframes with `YoutubeEngagement` overlay (like/save/share).
- `/youtube/videos` — grid of long-form videos with title, channel, duration, thumbnail; opens in modal with embed.
- Featured slot admins can pin.
- Shareable per-video pages with OG image = YouTube thumbnail.

### 7. Official Account (`@bruchat`)
- Seeded profile with verified True badge, custom bio, banner.
- **Auto-engagement triggers** (server-side via triggers):
  - Auto-follows every new user.
  - Auto-likes every new post from other users.
  - Auto-comments with a random friendly comment from a curated list.
  - When @bruchat itself posts, auto-likes + auto-comments from all other users (viral seed).

### 8. Verification (`/apply`, admin-managed)
- Requires ≥40 followers to open the application.
- 10-step wizard: identity, purpose, socials, real name, national ID snapshot (optional), sample content, agreement, review, submit, wait.
- Admins issue **True** (blue) or **Fake** (red) badges from admin panel.
- Rendered by `<VerifiedBadge />` next to display name everywhere.

### 9. Achievements (`/achievements`)
- Milestone certificates: 10/100/1k followers, 10/100/1k posts, 100/1k likes, 100/1k comments.
- Auto-generated certificate images (canvas render) stored in `certificates` bucket.
- Shareable to profile + downloadable.

### 10. AI Explainer ("BRU AI")
- Right-side panel with floating pill trigger on mobile.
- Powered by Lovable/OpenAI-compatible gateway. Default model: `gemini-3-flash` (fast) with fallback to `gpt-4o-mini` and `groq/llama-3.1-70b`.
- Streams responses. Persists chat in `ai_chat_messages` per user for personalized memory.
- Tools: explain last message, summarize thread, translate, draft reply, "what happened while I was away?".
- Second embedded panel: **Bruno AI iframe** to `https://bru-claude.lovable.app` (existing external tool) — width resizable + saved.

### 11. User Presence
- Realtime presence channel: broadcast heartbeat every 20s. Compute status (`online|away|busy|offline`) with last_seen.
- Live typing + voice-recording indicators broadcast on the conversation channel.

### 12. User Profiles (`/user/:username`)
- Customizable banner (BannerPicker with curated + upload), 800×800 compressed avatar.
- **Profile completeness ring** (avatar / bio / banner / verified / posts / followers filled).
- Tabs: Posts, Reels, Saved, Achievements.
- Follow / Message / Block / Report buttons.

### 13. Notifications (`/app/notifications`)
- Unified feed grouped by day. Kinds: like, comment, follow, mention, dm preview, missed call, group invite, verification update, report update.
- Realtime subscription; unread badge in sidebar.

### 14. Donations (`/donate`)
- Rwanda **MoMo** numbers displayed prominently: **0722610568**, plus alternates. Copy-to-clipboard.
- Optional donation form to log `donations` row (name + amount + reference) for wall-of-thanks.
- No card processor unless user later adds Stripe/Paddle.

### 15. Admin (`/admin` → `/admin/panel`)
- Password gate using `ADMIN_PASSWORD` secret (server-verified via `admin-login` Edge Function that mints short-lived admin JWT).
- Panel views: Users (search, ban, unban, verify, override post limit, **17-step cascade delete** wiping all owned rows across every table + storage), Reports queue, Posts, Reels, YouTube approvals, Verification apps, Analytics.
- **Analytics**: DAU/WAU/MAU, messages/day, signups, top posts, reports open, storage usage.

### 16. Moderation & Safety
- Report flow on messages / posts / comments / reels / profiles.
- RLS-driven block list (blocked users can't message, follow, or comment).
- Rate limits: 10 posts/day (unless overridden), 60 messages/min, 5 reports/hour — enforced in Edge Functions using `rate_limits`.
- Auto-ban when reports on a user cross threshold (admin-configurable).

### 17. MCP (Agent Integrations)
- Expose the app as an MCP server via `@lovable.dev/mcp-js` with tools:
  - `echo`, `whoami`, `list_conversations`, `read_messages`, `send_message`, `list_notifications`, `create_post`, `list_recent_posts`, `list_reels`, `search_users`, `start_call` (audio/video, requires user consent per-call).
- Supabase OAuth 2.1 as the authorization server. Consent page at `/.lovable/oauth/consent` that preserves `next=` through Login / Signup / social OAuth `redirect_uri` / signup `emailRedirectTo`.
- Every tool derives user from verified token; never trusts `user_id` from input.

### 18. Internal Promotions & Ads
- Hardcoded `PromoBanner` + `SidebarAd` components for internal projects (BrunoProjects).
- Utility right-panel resizing with widths saved to localStorage.

### 19. Search
- Global cmd-K style search (users, groups, posts, messages) using Postgres full-text on `content` + `username` + `display_name`.

### 20. PWA & Performance
- Web manifest with icons, theme color from `--primary`, `display: standalone`.
- Service worker: precache app shell, runtime-cache media with stale-while-revalidate.
- Lazy-load routes with `React.lazy`, image `loading="lazy"`, video posters.
- Query cache tuned (`staleTime: 30s`, `gcTime: 5min`), Realtime channels cleaned on unmount.
- Skeleton loaders on every list.

## SEO
- Per-page `<title>` (<60 chars) + `<meta description>` (<160). Single `<h1>` per page. Semantic HTML.
- Alt text on every image. Descriptive link text.
- JSON-LD: `Organization` on `/`, `SocialMediaPosting` on `/post/:id`, `VideoObject` on `/youtube/videos/:id`, `Person` on `/user/:username`.
- Canonical + `og:*` + `twitter:card`. Twitter: `summary_large_image`.
- `sitemap.xml`, `robots.txt`, `llms.txt` (see BRUChat llms.txt for structure).
- Responsive viewport, preloaded fonts, mobile Lighthouse ≥90.

## Security Requirements (must satisfy)
- RLS enabled on every public table; `GRANT` statements paired with every `CREATE TABLE`.
- Roles isolated in `user_roles` with `has_role()` SECURITY DEFINER. No client-side admin checks. Admin password lives server-side only.
- Group role-escalation prevented at policy level (insert policy).
- Poll votes require membership in the parent conversation/group.
- Public post comments SELECT-able by anon only when the post is public.
- Blocked users invisible to blocker (RLS filter via `is_blocked` function).
- Service role key never leaves Edge Functions. No secrets in client code. LiveKit API key server-only.
- Input validation with Zod in every Edge Function; 400 on schema mismatch.
- CORS headers on every Edge Function response, including errors.
- Never execute raw SQL from client input.

## Edge Functions to Ship
- `mcp` — MCP server (generated by mcpPlugin from `src/lib/mcp/index.ts`).
- `mint-livekit-token` — mints scoped LiveKit JWTs; validates call membership.
- `link-preview` — OG scraper with 24h cache.
- `ai-chat` — streams chat completions from AI gateway; persists to `ai_chat_messages`.
- `admin-login` — verifies `ADMIN_PASSWORD`, mints admin session cookie.
- `admin-operations` — 17-step cascade delete, ban/unban, verify, cleanup.
- `submit-youtube` — validates YouTube URL, fetches oEmbed, stores pending.
- `rate-limiter` — shared helper.
- `youtube-approval` — admin-only approval endpoint.

## Deliverables
1. Full Vite project, `tsgo` clean, `bun run build` green.
2. All SQL migrations: tables + RLS + policies + GRANTs + functions + triggers + storage buckets + storage policies.
3. Edge Functions listed above deployed.
4. Seed script: 5 demo users + `@bruchat` official + 3 groups + 20 posts + 5 reels + 10 YouTube shorts + a live call for testing.
5. README covering: env vars (`LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `LIVEKIT_WS_URL`, `GEMINI_API_KEY`, `OPENAI_API_KEY`, `GROQ_API_KEY`, `ADMIN_PASSWORD`), how to test a call across two browser windows, how to run migrations, how to seed.

## Build Order
1. Auth + profiles + protected shell + `user_roles` + `has_role` + design tokens + fonts.
2. Layout: 3-column desktop / bottom-nav mobile + Messenger shell + scroll utilities (`pb-safe-nav`).
3. Conversations + messages + realtime + composer + media upload + voice recorder + reactions + reply/pin/forward/edit/delete.
4. Groups + members + roles + slow mode + discovery.
5. Social feed + posts + comments + likes + saves + follows + Explore.
6. Reels + YouTube hub (shorts + videos + submit + approve).
7. Notifications + presence + typing + link previews.
8. Official account triggers + verification + achievements.
9. BRU AI explainer + Bruno AI iframe.
10. **Voice/video calls** (LiveKit integration + ringing overlay + in-call UI + missed-call system messages).
11. Admin panel + analytics + moderation + rate limits.
12. MCP server + consent + Supabase OAuth server config.
13. Donations + about/privacy/terms + PWA + SEO + Lighthouse polish.

Verify each phase in-browser (mobile 375×667, tablet, desktop) before advancing. Keep components small (<250 lines), colocate hooks, prefer search-replace edits during iteration.

---

End of prompt. Copy from `#` heading down. Ask for shorter task-specific spin-offs (calls-only, YouTube-only, admin-only) if useful.
