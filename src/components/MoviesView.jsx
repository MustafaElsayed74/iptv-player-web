'use client';

import { Play, Film, Heart } from 'lucide-react';
import usePlaylistStore from '../store/PlaylistStore';
import { useState } from 'react';

export default function MoviesView() {
  const { getFilteredChannels, setActiveMediaItem, activeMediaItem, xtreamCredentials, setVods, toggleFavorite, favorites } = usePlaylistStore();
  const vods = getFilteredChannels();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const displayedVods = vods.filter(v => v.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const fetchVods = async () => {
    if (!xtreamCredentials) return;
    setLoading(true);
    try {
      // 1. Fetch categories
      const catRes = await fetch('/api/xtream/vod', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...xtreamCredentials, action: 'get_vod_categories' }),
      });
      const catData = await catRes.json();
      const catMap = {};
      if (Array.isArray(catData)) {
        catData.forEach(c => catMap[c.category_id] = c.category_name);
      }

      // 2. Fetch streams
      const res = await fetch('/api/xtream/vod', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...xtreamCredentials, action: 'get_vod_streams' }),
      });
      const data = await res.json();
      
      if (Array.isArray(data)) {
        const mappedVods = data.map(stream => ({
          id: stream.stream_id.toString(),
          name: stream.name || 'Unknown Movie',
          logo: stream.stream_icon || null,
          group: catMap[stream.category_id] || 'Movies',
          url: `${xtreamCredentials.url.replace(/\/$/, '')}/movie/${xtreamCredentials.username}/${xtreamCredentials.password}/${stream.stream_id}.mp4`
        }));
        setVods(mappedVods);
      } else {
        console.warn('API returned non-array data for VOD streams:', data);
        setError(`Failed to load. API returned: ${typeof data}`);
      }
    } catch(err) {
      console.error(err);
      setError(err.message || 'Unknown error occurred while fetching VODs');
    }
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      {error && (
        <div style={styles.errorBanner}>{error}</div>
      )}
      {vods.length === 0 ? (
        <div style={styles.emptyState}>
          <Film size={48} color="var(--text-secondary)" style={{marginBottom: '1rem'}} />
          <h3>No Movies Loaded</h3>
          {xtreamCredentials && (
            <button onClick={fetchVods} disabled={loading} style={styles.loadBtn}>
              {loading ? 'Downloading...' : 'Load VOD Library'}
            </button>
          )}
        </div>
      ) : (
        <>
          <div style={{marginBottom: '1.5rem'}}>
            <input 
              style={styles.searchInput}
              type="text" 
              placeholder="Search movies..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div style={styles.grid}>
            {displayedVods.map((movie, index) => (
            <div 
              key={`${movie.id}-${index}`} 
              className="glass animate-fade-in"
              style={{
                ...styles.card,
                ...(activeMediaItem?.id === movie.id ? styles.activeCard : {})
              }}
              onClick={() => setActiveMediaItem(movie)}
            >
              <div style={styles.posterWrapper}>
                {movie.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={movie.logo} alt={movie.name} style={styles.poster} />
                ) : (
                  <div style={styles.placeholderPoster}>
                    <Film size={32} />
                  </div>
                )}
                
                <div 
                  style={{
                    ...styles.playOverlay, 
                    opacity: activeMediaItem?.id === movie.id ? 1 : undefined
                  }} 
                  className="play-overlay"
                >
                  <div style={styles.playIconBg}>
                    <Play size={20} color="#fff" style={{ marginLeft: '2px' }} />
                  </div>
                </div>

                {/* Heart Toggle */}
                <button 
                  style={styles.heartBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(movie.id, 'movies');
                  }}
                >
                  <Heart 
                    size={18} 
                    color={(favorites || {}).movies?.includes(movie.id) ? '#ef4444' : '#fff'}
                    fill={(favorites || {}).movies?.includes(movie.id) ? '#ef4444' : 'rgba(0,0,0,0.5)'}
                  />
                </button>
              </div>
              
              <div style={styles.info}>
                <h4 style={styles.title} title={movie.name}>{movie.name}</h4>
                <span style={styles.group}>{movie.group}</span>
              </div>
            </div>
          ))}
        </div>
        </>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .play-overlay {
          opacity: 0;
          transition: opacity 0.2s;
        }
        .glass:hover .play-overlay {
          opacity: 1;
        }
        .glass:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-lg);
        }
      `}} />
    </div>
  );
}

const styles = {
  container: {
    padding: '1.5rem',
    overflowY: 'auto',
    flex: 1,
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: 'var(--text-secondary)'
  },
  loadBtn: {
    marginTop: '1rem',
    padding: '0.75rem 2rem',
    backgroundColor: 'var(--accent-color)',
    color: '#fff',
    borderRadius: 'var(--radius-md)',
    fontWeight: '500',
    cursor: 'pointer',
    border: 'none'
  },
  errorBanner: {
    padding: '1rem',
    marginBottom: '1rem',
    background: 'rgba(239, 68, 68, 0.1)',
    color: '#ef4444',
    borderRadius: 'var(--radius-md)',
    textAlign: 'center',
    border: '1px solid rgba(239, 68, 68, 0.2)',
  },
  searchInput: {
    width: '100%',
    padding: '0.75rem 1rem',
    borderRadius: 'var(--radius-md)',
    background: 'var(--bg-surface)',
    border: '1px solid var(--glass-border)',
    color: 'var(--text-primary)',
    outline: 'none',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
    gap: '1.5rem',
  },
  card: {
    cursor: 'pointer',
    padding: '0.5rem',
    borderRadius: 'var(--radius-lg)',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    border: '1px solid transparent',
  },
  activeCard: {
    borderColor: 'var(--accent-color)',
    background: 'rgba(99, 102, 241, 0.1)',
  },
  posterWrapper: {
    width: '100%',
    aspectRatio: '2/3',
    background: 'rgba(0,0,0,0.4)',
    borderRadius: 'var(--radius-md)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  poster: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  placeholderPoster: {
    color: 'var(--text-secondary)',
    opacity: 0.5,
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    backdropFilter: 'blur(2px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIconBg: {
    background: 'var(--accent-color)',
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)',
  },
  info: {
    width: '100%',
    padding: '0 0.25rem',
  },
  title: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    marginBottom: '0.25rem',
  },
  group: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  heartBtn: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    zIndex: 10,
    transition: 'transform 0.2s',
  }
};
