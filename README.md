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
