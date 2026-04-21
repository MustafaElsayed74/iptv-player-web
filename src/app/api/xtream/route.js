import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { url, username, password } = await req.json();

    if (!url || !username || !password) {
      return NextResponse.json({ error: 'Missing required credentials' }, { status: 400 });
    }

    // Clean URL
    const baseUrl = url.replace(/\/$/, '');

    // 1. Authenticate and get user info
    const authUrl = `${baseUrl}/player_api.php?username=${username}&password=${password}`;
    const authRes = await fetch(authUrl);
    const authData = await authRes.json();

    if (!authData || !authData.user_info || authData.user_info.auth === 0) {
      return NextResponse.json({ error: 'Invalid credentials or server URL' }, { status: 401 });
    }

    // 2. Fetch categories
    const categoriesUrl = `${baseUrl}/player_api.php?username=${username}&password=${password}&action=get_live_categories`;
    const catRes = await fetch(categoriesUrl);
    const categoriesData = await catRes.json();
    
    // Create a map of category_id to category_name
    const categoryMap = {};
    if (Array.isArray(categoriesData)) {
      categoriesData.forEach(cat => {
        categoryMap[cat.category_id] = cat.category_name;
      });
    }

    // 3. Fetch streams
    const streamsUrl = `${baseUrl}/player_api.php?username=${username}&password=${password}&action=get_live_streams`;
    const strRes = await fetch(streamsUrl);
    const streamsData = await strRes.json();

    if (!Array.isArray(streamsData)) {
      return NextResponse.json({ error: 'Failed to fetch streams. Expected array.' }, { status: 500 });
    }

    // 4. Map to our format
    const channels = streamsData.map((stream) => {
      // Xtream standard live url format is typically: baseUrl/username/password/stream_id
      // We append .m3u8 to try forcing HLS if the server supports it, or typically /live/username/password/id.m3u8.
      // Easiest standard format for Xtream codes:
      const streamUrl = `${baseUrl}/live/${username}/${password}/${stream.stream_id}.m3u8`;
      
      return {
        id: stream.stream_id.toString(),
        name: stream.name || 'Unknown Channel',
        logo: stream.stream_icon || null,
        group: categoryMap[stream.category_id] || 'Uncategorized',
        url: streamUrl,
      };
    });

    return NextResponse.json({ channels });

  } catch (error) {
    console.error('Xtream Proxy Error:', error);
    return NextResponse.json({ error: 'Failed to complete authentication sequence: ' + error.message }, { status: 500 });
  }
}
