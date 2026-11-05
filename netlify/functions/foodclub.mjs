import * as cheerio from 'cheerio';

const PAGE = 'https://www.neopets.com/~Shrmsh';
const MAX_BYTES = 1_500_000;
const ARENAS = ['shipwreck', 'lagoon', 'treasure', 'hidden', 'harpoon'];
const allowedStrategies = ['beginner', 'standard', 'aggressive', 'adventurous'];
const neat = value => String(value ?? '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();

export function extractBets(html) {
  const $ = cheerio.load(html);
  $('script, style, noscript, iframe').remove();
  const bodyText = neat($('body').text());
  const title = neat($('title').first().text());
  const neofoodLinks = [];
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    try {
      const url = new URL(href, PAGE);
      if (!/^https?:$/.test(url.protocol)) return;
      if (!/(^|\.)neofood\.club$/i.test(url.hostname)) return;
      if (!neofoodLinks.some(x => x.url === url.href)) {
        neofoodLinks.push({ label: neat($(el).text()).slice(0, 100) || 'NeoFoodClub', url: url.href });
      }
    } catch {}
  });

  let round = null;
  const roundCandidates = [
    ...neofoodLinks.map(x => x.url.match(/(?:[?#&])round=(\d{4,7})/i)?.[1]),
    bodyText.match(/(?:Food\s*Club\s*)?(?:Round|Rd\.?)[\s#:]*([0-9]{4,7})/i)?.[1]
  ].filter(Boolean);
  if (roundCandidates.length) round = Number(roundCandidates[0]);

  const tables = [];
  $('table').each((_, table) => {
    const trs = $(table).find('tr');
    if (trs.length < 3 || trs.length > 120) return;
    const rows = trs.toArray().map(tr => $(tr).children('td,th').toArray().map(el => neat($(el).text()))).filter(x => x.length);
    if (!rows.length) return;
    const header = rows[0].join(' ').toLowerCase();
    const arenaHits = ARENAS.filter(x => header.includes(x)).length;
    // Only retain identifiable Food Club bet tables (don't mistake navigation tables for bets).
    if (arenaHits < 3) return;
    const preceding = neat($(table).prevAll('h1,h2,h3,h4,h5,h6,strong,b,p,div').first().text()).slice(0, 150);
    const nearby = neat($(table).parent().prevAll('h1,h2,h3,h4,h5,h6,strong,b').first().text()).slice(0, 150);
    const context = [preceding, nearby, neat($(table).attr('id')), neat($(table).attr('class'))].join(' ');
    const strategy = allowedStrategies.find(s => new RegExp('\\b' + s + '\\b', 'i').test(context)) || null;
    tables.push({strategy, label: preceding || nearby || `Bet table ${tables.length + 1}`, headers: rows[0], rows: rows.slice(1, 22)});
  });

  const possibleProtection = /just a moment|checking your browser|access denied|captcha|cloudflare|enable javascript/i.test(`${title} ${bodyText.slice(0, 400)}`);
  const error = possibleProtection && !tables.length && !neofoodLinks.length
    ? 'Neopets returned an access-check page instead of the petpage.'
    : (!tables.length && !neofoodLinks.length ? 'No recognizable betting tables or NeoFoodClub links were found. The page layout may have changed.' : null);

  return {round, links: neofoodLinks, tables, error, pageTitle: title, preview: error ? bodyText.slice(0, 180) : undefined};
}

export async function handler(event) {
  if (event.httpMethod !== 'GET') return {statusCode:405, headers:{Allow:'GET'}, body:JSON.stringify({error:'Method not allowed'})};
  const headers = {'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'public, max-age=0, s-maxage=900, stale-while-revalidate=300', 'X-Content-Type-Options':'nosniff'};
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 9000);
    let response;
    try {
      response = await fetch(PAGE, {
        signal: controller.signal,
        headers: { 'User-Agent':'Mozilla/5.0 (compatible; NeopianHQ/1.1; personal dashboard)', 'Accept':'text/html,application/xhtml+xml' },
        redirect:'follow'
      });
    } finally { clearTimeout(timer); }
    if (!response.ok) return {statusCode:502, headers, body:JSON.stringify({ok:false,error:`Neopets returned HTTP ${response.status}.`,source:PAGE})};
    const length = Number(response.headers.get('content-length') || 0);
    if (length > MAX_BYTES) return {statusCode:502,headers,body:JSON.stringify({ok:false,error:'Source page too large.',source:PAGE})};
    const html = await response.text();
    if (html.length > MAX_BYTES) return {statusCode:502,headers,body:JSON.stringify({ok:false,error:'Source page too large.',source:PAGE})};
    const parsed = extractBets(html);
    return {statusCode:200,headers,body:JSON.stringify({ok:!parsed.error,source:PAGE,checkedAt:new Date().toISOString(),...parsed})};
  } catch (error) {
    return {statusCode:502,headers,body:JSON.stringify({ok:false,source:PAGE,error:error.name==='AbortError'?'Timed out requesting the petpage.':'Could not retrieve the petpage from Netlify.'})};
  }
}
