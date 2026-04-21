import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return new Response('Missing proxy target url', { status: 400 });
  }

  try {
    const headers = new Headers();
    // Only forward safe headers like Range for seeking
    const range = req.headers.get('range');
    if (range) {
      headers.set('range', range);
    }
    // Fake a common user agent in case the IPTV provider blocks server bots
    headers.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');

    const res = await fetch(targetUrl, {
      method: 'GET',
      headers,
      redirect: 'follow'
    });

    const responseHeaders = new Headers(res.headers);
    // Explicitly override CORS
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Range');

    // Remove headers that might conflict
    responseHeaders.delete('content-encoding');

    // If this is an M3U8 playlist, we must rewrite all relative chunks to absolute proxy URLs
    const contentType = responseHeaders.get('content-type') || '';
    if (targetUrl.includes('.m3u8') || contentType.includes('mpegurl')) {
      const text = await res.text();
      const finalUrl = res.url || targetUrl;
      const finalUrlObj = new URL(finalUrl);

      const rewrittenText = text.split('\n').map(line => {
        let trimmed = line.trim();
        if (trimmed === '') return trimmed;

        // Handle URI parameters inside tags (e.g. #EXT-X-KEY:METHOD=AES-128,URI="...")
        if (trimmed.startsWith('#')) {
          const uriMatch = trimmed.match(/URI="([^"]+)"/);
          if (uriMatch) {
            let absoluteUri = uriMatch[1];
            if (!absoluteUri.startsWith('http')) {
              // Create absolute URL by appending to the base URL of the M3U8
              absoluteUri = new URL(absoluteUri, finalUrlObj.href).href;
            }
            const proxiedUri = `/api/stream?url=${encodeURIComponent(absoluteUri)}`;
            return trimmed.replace(`URI="${uriMatch[1]}"`, `URI="${proxiedUri}"`);
          }
          return trimmed;
        }

        // Handle variant playlist or .ts chunk paths
        let absoluteUri = trimmed;
        if (!trimmed.startsWith('http')) {
           // Ensure relative paths correctly bind to the M3U8 folder, not the root
           absoluteUri = new URL(trimmed, finalUrlObj.href).href;
        }

        // Add the file extension hint so VideoPlayer can correctly identify it
        let extParams = '';
        if (absoluteUri.includes('.m3u8')) extParams = '&ext=.m3u8';
        else if (absoluteUri.includes('.ts')) extParams = '&ext=.ts';

        // Rewrite chunk strictly back to this proxy
        return `/api/stream?url=${encodeURIComponent(absoluteUri)}${extParams}`;
      }).join('\n');

      return new Response(rewrittenText, {
        status: res.status,
        statusText: res.statusText,
        headers: responseHeaders,
      });
    }

    return new Response(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('Stream Proxy Error:', error);
    return new Response('Failed to proxy stream', { status: 500 });
  }
}

export async function OPTIONS() {
  const responseHeaders = new Headers();
  responseHeaders.set('Access-Control-Allow-Origin', '*');
  responseHeaders.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Range');
  return new Response(null, { headers: responseHeaders, status: 204 });
}
