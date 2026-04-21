'use client';

import { Play, Heart } from 'lucide-react';
import usePlaylistStore from '../store/PlaylistStore';

import { useState, useEffect } from 'react';

export default function ChannelGrid() {
  const { getFilteredChannels, setActiveChannel, activeChannel, toggleFavorite, favorites, globalSearchQuery } = usePlaylistStore();
  const channels = getFilteredChannels();
  const [displayLimit, setDisplayLimit] = useState(100);

  const filteredChannels = channels.filter(c => c.name.toLowerCase().includes(globalSearchQuery.toLowerCase()));
  const displayedChannels = filteredChannels.slice(0, displayLimit);

  // Reset limit when search changes
  useEffect(() => { 
    setDisplayLimit(100); 
  }, [globalSearchQuery, getFilteredChannels]);

  return (
    <div style={styles.container}>
      <div style={styles.grid}>
        {displayedChannels.map((channel, index) => (
          <div 
            key={`${channel.id}-${index}`} 
            className="glass animate-fade-in"
            style={{
              ...styles.card,
              ...(activeChannel?.id === channel.id ? styles.activeCard : {})
            }}
            onClick={() => setActiveChannel(channel)}
          >
            <div style={styles.iconWrapper}>
              {channel.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={channel.logo} alt={channel.name} style={styles.logo} />
              ) : (
                <div style={styles.placeholderLogo}>
                  {channel.name.substring(0, 2).toUpperCase()}
                </div>
              )}
              
              <div 
                style={{
                  ...styles.playOverlay, 
                  opacity: activeChannel?.id === channel.id ? 1 : undefined
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
                  toggleFavorite(channel.id, 'live');
                }}
              >
                <Heart 
                  size={18} 
                  color={(favorites || {}).live?.includes(channel.id) ? '#ef4444' : '#fff'}
                  fill={(favorites || {}).live?.includes(channel.id) ? '#ef4444' : 'rgba(0,0,0,0.5)'}
                />
              </button>
            </div>
            
            <div style={styles.info}>
              <h4 style={styles.title} title={channel.name}>{channel.name}</h4>
              <span style={styles.group}>{channel.group}</span>
            </div>
          </div>
        ))}
      </div>
      
      {filteredChannels.length > displayLimit && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
          <button 
            onClick={() => setDisplayLimit(prev => prev + 100)}
            style={{
              background: 'var(--accent-color)', color: '#fff', border: 'none', 
              padding: '0.75rem 2rem', borderRadius: 'var(--radius-full)', 
              fontWeight: '600', cursor: 'pointer', transition: 'transform 0.2s'
            }}
            className="hover-lift"
          >
            Load More (Showing {displayLimit} of {filteredChannels.length})
          </button>
        </div>
      )}
      
      {/* Add global styles for hover effects that React inline styles don't support well */}
      <style dangerouslySetInnerHTML={{__html: `
        .play-overlay {
          opacity: 0;
          transition: opacity 0.2s;
        }
        .glass:hover .play-overlay {
          opacity: 1;
        }
        .glass:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
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
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: '1rem',
  },
  card: {
    cursor: 'pointer',
    padding: '1rem',
    borderRadius: 'var(--radius-lg)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'transparent',
  },
  activeCard: {
    borderColor: 'var(--accent-color)',
    background: 'rgba(99, 102, 241, 0.1)',
  },
  iconWrapper: {
    width: '100%',
    aspectRatio: '1',
    background: 'rgba(0,0,0,0.2)',
    borderRadius: 'var(--radius-md)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  logo: {
    width: '70%',
    height: '70%',
    objectFit: 'contain',
  },
  placeholderLogo: {
    fontSize: '2rem',
    fontWeight: '700',
    color: 'var(--text-secondary)',
    opacity: 0.5,
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.4)',
    backdropFilter: 'blur(2px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIconBg: {
    background: 'var(--accent-color)',
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)',
  },
  info: {
    width: '100%',
    textAlign: 'center',
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
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
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
