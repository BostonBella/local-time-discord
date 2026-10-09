# Local Time for Discord

A Discord Activity that lets a user choose a timezone and show the current time for that timezone in Discord Rich Presence.

## Repository layout

- `activity/` — the Discord Activity source code
- `privacy.html` — public Privacy Policy used by Discord
- `terms.html` — public Terms of Service used by Discord
- `index.html` — public landing page for GitHub Pages

## Local development

1. Copy `activity/.env.example` to `activity/.env`.
2. Add the Discord Application ID and Client Secret to `.env`.
3. From the `activity` folder, run:
   - `npm install`
   - `npm run dev`
4. Use a tunnel for the Vite URL during Discord Activity testing.

The real `.env` file is ignored by Git and must never be committed.
