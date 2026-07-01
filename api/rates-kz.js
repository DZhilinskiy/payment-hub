// Vercel serverless function — прокси к НБ РК с CORS
// Возвращает JSON: { date: "01.07.2026", USD: 480.72, EUR: 548.07, BYN: 164.33, RUB: 6.14 }

export const config = { runtime: 'edge' };

const WANTED = ['USD', 'EUR', 'BYN', 'RUB', 'GBP', 'CNY'];

function fmtDate(d) {
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const yyyy = d.getUTCFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

export default async function handler(req) {
  const url = new URL(req.url);
  const dateParam = url.searchParams.get('date') || fmtDate(new Date());

  try {
    const upstream = await fetch(
      `https://nationalbank.kz/rss/get_rates.cfm?fdate=${dateParam}`,
      { headers: { 'User-Agent': 'PaymentHub/1.0' } }
    );
    if (!upstream.ok) throw new Error('upstream ' + upstream.status);
    const xml = await upstream.text();

    const rates = { date: dateParam };
    // Простой regex-парсер: <item> ... <title>CCY</title> ... <description>RATE</description> ... <quant>N</quant>
    const items = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
    for (const item of items) {
      const t = item.match(/<title>(\w+)<\/title>/);
      const d = item.match(/<description>([\d.]+)<\/description>/);
      const q = item.match(/<quant>(\d+)<\/quant>/);
      if (t && d && WANTED.includes(t[1])) {
        const rate = parseFloat(d[1]);
        const quant = q ? parseInt(q[1], 10) : 1;
        rates[t[1]] = +(rate / quant).toFixed(4);
      }
    }

    return new Response(JSON.stringify(rates), {
      status: 200,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'access-control-allow-origin': '*',
        // кэш на 1 час на CDN, 10 минут в браузере
        'cache-control': 'public, max-age=600, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: 'fetch failed', message: String(e) }),
      {
        status: 502,
        headers: {
          'content-type': 'application/json',
          'access-control-allow-origin': '*',
        },
      }
    );
  }
}
