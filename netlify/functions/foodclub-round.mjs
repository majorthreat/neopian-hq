// Read-only round-number proxy. The UI tries the CDN directly before this function.
export default async function handler() {
  try {
    const res = await fetch('https://cdn.neofood.club/current_round.txt', {
      headers: { 'Accept': 'text/plain' }, signal: AbortSignal.timeout(8000)
    });
    if (!res.ok) throw new Error(`Upstream HTTP ${res.status}`);
    const value = (await res.text()).trim();
    if (!/^\d{4,8}$/.test(value)) throw new Error('Unexpected round format');
    return new Response(value, {
      status: 200,
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=0, s-maxage=300' }
    });
  } catch (error) {
    return new Response('Round unavailable', { status: 502, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }
}
export const config = { path: '/.netlify/functions/foodclub-round' };
