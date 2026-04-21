'use client';

import { Play, Clapperboard, Heart } from 'lucide-react';
import usePlaylistStore from '../store/PlaylistStore';
import { useState } from 'react';

export default function SeriesView() {
  const { getFilteredChannels, setActiveMediaItem, activeMediaItem, xtreamCredentials, setSeries, toggleFavorite, favorites } = usePlaylistStore();
  const seriesList = getFilteredChannels(); // Uses PlaylistStore activeSection logic
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const displayedSeries = seriesList.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const fetchSeries = async () => {
    if (!xtreamCredentials) return;
    setLoading(true);
    try {
      // 1. Fetch categories
      const catRes = await fetch('/api/xtream/series', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...xtreamCredentials, action: 'get_series_categories' }),
      });
      const catData = await catRes.json();
      const catMap = {};
      if (Array.isArray(catData)) {
        catData.forEach(c => catMap[c.category_id] = c.category_name);
      }

      // 2. Fetch streams
      const res = await fetch('/api/xtream/series', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...xtreamCredentials, action: 'get_series' }),
      });
      const data = await res.json();
      
      if (Array.isArray(data)) {
        const mappedSeries = data.map(stream => ({
          id: stream.series_id.toString(),
          name: stream.name || 'Unknown Series',
          logo: stream.cover || null,
          group: catMap[stream.category_id] || 'Series',
          // Series don't have a direct URL to play, they require info fetch. 
          // Setting a mock URL so it doesn't break player, but actual logic should fetch episodes.
          url: '',
          isSeries: true
        }));
        setSeries(mappedSeries);
      } else {
        console.warn('API returned non-array data for Series streams:', data);
        setError(`Failed to load. API returned: ${typeof data}`);
      }
    } catch(err) {
      console.error(err);
      setError(err.message || 'Unknown error occurred while fetching Series');
    }
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      {error && (
        <div style={styles.errorBanner}>{error}</div>
      )}
      {seriesList.length === 0 ? (
        <div style={styles.emptyState}>
          <Clapperboard size={48} color="var(--text-secondary)" style={{marginBottom: '1rem'}} />
          <h3>No Series Loaded</h3>
          {xtreamCredentials && (
            <button onClick={fetchSeries} disabled={loading} style={styles.loadBtn}>
              {loading ? 'Downloading...' : 'Load Series Library'}
            </button>
          )}
        </div>
      ) : (
        <>
          <div style={{marginBottom: '1.5rem'}}>
            <input 
              style={styles.searchInput}
              type="text" 
              placeholder="Search series..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div style={styles.grid}>
            {displayedSeries.map((seriesItem, index) => (
            <div 
              key={`${seriesItem.id}-${index}`} 
              className="glass animate-fade-in"
              style={{
                ...styles.card,
                ...(activeMediaItem?.id === seriesItem.id ? styles.activeCard : {})
              }}
              onClick={() => setActiveMediaItem(seriesItem)}
            >
              <div style={styles.posterWrapper}>
                {seriesItem.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={seriesItem.logo} alt={seriesItem.name} style={styles.poster} />
                ) : (
                  <div style={styles.placeholderPoster}>
                    <Clapperboard size={32} />
                  </div>
                )}
                
                <div 
                  style={{
                    ...styles.playOverlay, 
                    opacity: activeMediaItem?.id === seriesItem.id ? 1 : undefined
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
                    toggleFavorite(seriesItem.id, 'series');
                  }}
                >
                  <Heart 
                    size={18} 
                    color={(favorites || {}).series?.includes(seriesItem.id) ? '#ef4444' : '#fff'}
                    fill={(favorites || {}).series?.includes(seriesItem.id) ? '#ef4444' : 'rgba(0,0,0,0.5)'}
                  />
                </button>
              </div>
              
              <div style={styles.info}>
                <h4 style={styles.title} title={seriesItem.name}>{seriesItem.name}</h4>
                <span style={styles.group}>{seriesItem.group}</span>
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
