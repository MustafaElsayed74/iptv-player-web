import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  try {
    const res = await fetch(targetUrl);
    if (!res.ok) {
      throw new Error(`Failed to fetch from url: ${targetUrl}. Status: ${res.status}`);
    }
    const text = await res.text();
    return new NextResponse(text, {
      headers: {
        'Content-Type': 'text/plain',
        // Optional CORS headers if needed for direct browser fetch proxying
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
