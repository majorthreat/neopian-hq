// Neopian HQ: read-only proxy for the volunteer-maintained NeoStocks API.
const SOURCE = 'https://neostocks.info/api/tickers?period=1d';
export default async function handler(request) {
  if (request.method !== 'GET') return Response.json({ok:false,error:'GET only'}, {status:405});
  try {
    const signal=AbortSignal.timeout(9000);
    const upstream=await fetch(SOURCE, {signal, headers:{accept:'application/json','user-agent':'NeopianHQ/1.0 (personal dashboard; cached quotes)'}});
    if (!upstream.ok) throw new Error(`NeoStocks returned HTTP ${upstream.status}`);
    const data=await upstream.json();
    if(!Array.isArray(data)) throw new Error('Unexpected NeoStocks response');
    const stocks=data.filter(x=>x&&/^[A-Z]{2,6}$/.test(String(x.ticker||''))&&Number.isFinite(Number(x.curr))&&Number(x.curr)>=0).map(x=>({ticker:x.ticker,company:String(x.company||''),curr:Number(x.curr),change:Number.isFinite(Number(x.change))?Number(x.change):null,update_time_nst:x.update_time_nst||null}));
    if(stocks.length<1)throw new Error('No valid quotes found');
    return Response.json({ok:true,source:SOURCE,checkedAt:new Date().toISOString(),stocks},{headers:{'Netlify-CDN-Cache-Control':'public, durable, max-age=300, stale-while-revalidate=300','Cache-Control':'no-store'}});
  } catch (error) {
    return Response.json({ok:false,error:String(error?.message||error)}, {status:502,headers:{'Cache-Control':'no-store'}});
  }
}
