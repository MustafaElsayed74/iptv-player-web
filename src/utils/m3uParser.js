export function parseM3U(content) {
  const lines = content.split('\n').map(line => line.trim());
  if (!lines[0] || !lines[0].startsWith('#EXTM3U')) {
    throw new Error('Invalid M3U file: Missing #EXTM3U header');
  }

  const channels = [];
  let currentChannel = {};

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('#EXTINF:')) {
      // Extract tvg-logo
      const logoMatch = line.match(/tvg-logo="([^"]+)"/);
      // Extract group-title
      const groupMatch = line.match(/group-title="([^"]+)"/);
      // Extract name (last comma separated value)
      const nameMatch = line.slice(line.lastIndexOf(',') + 1).trim();

      currentChannel = {
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(7),
        name: nameMatch || 'Unknown Channel',
        logo: logoMatch ? logoMatch[1] : null,
        group: groupMatch ? groupMatch[1] : 'Uncategorized',
      };
    } else if (line.startsWith('http') && Object.keys(currentChannel).length > 0) {
      currentChannel.url = line;
      channels.push(currentChannel);
      currentChannel = {};
    }
  }

  return channels;
}
