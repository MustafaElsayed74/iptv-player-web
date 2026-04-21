import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { url, username, password, action = 'get_vod_streams', category_id, vod_id } = await req.json();

    if (!url || !username || !password) {
      return NextResponse.json({ error: 'Missing required credentials' }, { status: 400 });
    }

    const baseUrl = url.replace(/\/$/, '');
    
    let targetUrl = `${baseUrl}/player_api.php?username=${username}&password=${password}&action=${action}`;
    
    if (category_id) targetUrl += `&category_id=${category_id}`;
    if (vod_id) targetUrl += `&vod_id=${vod_id}`;

    const res = await fetch(targetUrl);
    const data = await res.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error('Xtream VOD Proxy Error:', error);
    return NextResponse.json({ error: 'Failed to fetch VOD data' }, { status: 500 });
  }
}
