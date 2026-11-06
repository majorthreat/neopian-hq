# Neopian HQ – nsheng Food Club importer

This Netlify project contains the existing dashboard (`index.html`) plus a read-only serverless importer (`netlify/functions/foodclub.mjs`).

## Deploy from GitHub

1. Add all files from this directory to the **root** of the GitHub repo linked to your Netlify site, preserving `netlify/functions/foodclub.mjs` and `package.json`.
2. Commit the changes to the branch Netlify deploys. Netlify installs the `cheerio` dependency and deploys the function.
3. Open `https://rocket-squid.netlify.app/.netlify/functions/foodclub` to see the import result in JSON.
4. Open the dashboard and click **Refresh from ~Shrmsh**. Recognized betting tables and NeoFoodClub links appear beneath the button.

**Important:** The NeoPets petpage could be inaccessible from Netlify or have a layout our initial parser doesn't recognize. In either case the dashboard shows an error and retains manual bet-entry features. The importer makes no Neopets account requests and never places bets. It is deliberately run on demand rather than aggressively polling a volunteer or game site. The browser dashboard saves your checklist and holdings to local storage; changing hostnames or browsers will not automatically migrate that data.

## Technical notes

- `GET /.netlify/functions/foodclub` returns `{ ok, checkedAt, source, round, links, tables, error }`.
- The response has a shared-cache policy of 15 minutes to avoid needless repeated requests, subject to Netlify infrastructure behavior.
- Only links pointing to `neofood.club` and tables with Food Club arena headers are extracted. It does not guess missing bets.
- If you see `No recognizable betting tables`, share the exact petpage HTML (or a copy of the source) to refine the parser; this environment cannot fetch that page to confirm its actual markup.

## Live NeoStocks quotes

`netlify/functions/stocks.mjs` fetches the public NeoStocks JSON data and returns a small read-only JSON payload. It uses a five-minute Netlify durable CDN cache. The dashboard fetches it at startup and roughly every five minutes when visible; saved quotes and holdings survive API failures. Visit `/.netlify/functions/stocks` after deployment to check the upstream connection. No API keys or Neopets credentials are needed.

## Layout update
- NeoStocks is now full width beneath the main activity columns.
- The market ticker grid uses two columns on desktop and one column on narrow screens.
- The holdings editor is collapsed by default (open **Manage your stock holdings** to add purchases or change targets).
- Manual price overrides are also collapsible; live-price refresh remains visible.
- Your dashboard settings appear as a full-width footer beneath NeoStocks.
- Existing localStorage keys and Netlify functions are unchanged, so saved holdings and live pricing remain compatible.

## Layout revision

Full-width three-column dailies; daily section auto-collapses when all tasks are checked (with an accessible manual toggle). Side-by-side Snowager and Tarla, including three Snowager windows. Food Club, NeoStocks, and settings are full width. Responsive on tablets and phones. Existing saved data and Netlify functions unchanged.

## November 6 integration update — Stocks + Food Club V2

This ZIP is the **complete dashboard**, based on `neopian-hq-wireframe-update(1).zip`. Dailies, Snowager, Tarla, NeoStocks, Food Club, and Your Dashboard remain on the page.

### Stock tracker
- User-settable maximum buying price (default **15 NP**); standard minimum eligible purchase price is **15 NP**, so cheaper quotes do not appear as buy opportunities.
- Filter labels updated accordingly. Existing holdings, targets, live NeoStocks proxy, and desktop two-column ticker grid preserved.

### Food Club
- Food Club homepage plus two customizable source links (HTTPS) with user-editable names.
- One Neofood.club share-link field with an action to open the exact pasted URL. Prior table-paste controls removed.
- Per-round "Bets placed" and "Winnings collected" checkboxes, saved in browser local storage.
- Current-round display in the top-right fetched from `https://cdn.neofood.club/current_round.txt`; new Netlify function `netlify/functions/foodclub-round.mjs` acts as a same-origin fallback if the CDN blocks browser CORS. Refreshes roughly every five minutes and can be refreshed manually. On failure, displays an unavailable state (or marks previously fetched round as last checked). Pasted URLs with a different round show a warning.

### Deployment and QA
- Deploy the **entire ZIP contents** as an update to the existing repository, not just `index.html`, so the added round-number Netlify function is available.
- Browser-backed interactive testing and the CDN's response still require confirmation in the deployed environment; static HTML verification and JavaScript syntax check passed.
- Back up existing local dashboard data with **Export data** before deployment. Existing `neopian-hq-v1` storage remains compatible, but browser origin changes do not automatically migrate it.
- Old Food Club backend `netlify/functions/foodclub.mjs` is left intact for compatibility but is not used by the simplified Food Club UI; remove later during code cleanup once confirmed unused elsewhere.
- The local-run V1 architecture and Netlify-only preview distinction are unchanged.
