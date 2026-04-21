'use client';

import { useState, useEffect } from 'react';
import { Play, ArrowLeft, Star, Calendar, Clock, Image as ImageIcon } from 'lucide-react';
import usePlaylistStore from '../store/PlaylistStore';

export default function MediaDetailView() {
  const { 
    activeMediaItem, 
    activeSection, 
    goBackToGrid, 
    xtreamCredentials, 
    setActiveChannel 
  } = usePlaylistStore();

  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Series specific state
  const [seasons, setSeasons] = useState([]);
  const [episodes, setEpisodes] = useState({});
  const [activeSeason, setActiveSeason] = useState(null);

  useEffect(() => {
    if (!activeMediaItem || !xtreamCredentials) return;

    let isMounted = true;
    setLoading(true);
    setError('');

    const fetchDetails = async () => {
      try {
        const action = activeSection === 'series' ? 'get_series_info' : 'get_vod_info';
        const idParam = activeSection === 'series' ? 'series_id' : 'vod_id';

        const res = await fetch(`/api/xtream/${activeSection === 'series' ? 'series' : 'vod'}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            ...xtreamCredentials, 
            action, 
            [idParam]: activeMediaItem.id 
          }),
        });
        
        const data = await res.json();
        
        if (!isMounted) return;

        if (activeSection === 'series') {
          if (data.info && data.episodes) {
            setDetails(data.info);
            // Seasons map
            const epsBySeason = data.episodes;
            const seasonKeys = Object.keys(epsBySeason);
            setSeasons(seasonKeys);
            setEpisodes(epsBySeason);
            if (seasonKeys.length > 0) setActiveSeason(seasonKeys[0]);
          } else {
            throw new Error('Invalid series deep-link payload');
          }
        } else {
          setDetails(data.info);
        }
      } catch (err) {
        if (isMounted) setError('Failed to load media details: ' + (err.message || 'Unknown network error.'));
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDetails();

    return () => { isMounted = false; };
  }, [activeMediaItem, activeSection, xtreamCredentials]);

  const handlePlayMovie = () => {
    // VODs already have their activeURL mapped directly on the store item
    setActiveChannel(activeMediaItem); 
    // Go back to the player/grid layout so the player renders on top
    goBackToGrid();
  };

  const handlePlayEpisode = (episode) => {
    // We construct the M3U8/MP4 URL mathematically for the Series Episode
    const extension = episode.container_extension || 'mp4';
    const baseUrl = xtreamCredentials.url.replace(/\/$/, '');
    const episodeUrl = `${baseUrl}/series/${xtreamCredentials.username}/${xtreamCredentials.password}/${episode.id}.${extension}`;
    
    setActiveChannel({
      id: episode.id,
      name: `${activeMediaItem.name} - S${activeSeason} E${episode.episode_num || '?'}`,
      logo: activeMediaItem.logo, // fallback to series poster
      url: episodeUrl,
      isSeries: true
    });
    
    goBackToGrid();
  };

  if (!activeMediaItem) return null;

  return (
    <div style={styles.container} className="animate-fade-in">
      <button onClick={goBackToGrid} style={styles.backBtn} className="glass hover-lift">
        <ArrowLeft size={20} /> Back to Library
      </button>

      {loading ? (
        <div style={styles.loadingState}>
          <div className="loader-spinner"></div>
          <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Gathering Metadata...</p>
        </div>
      ) : error ? (
        <div style={styles.errorState}>{error}</div>
      ) : (
        <div style={styles.contentLayout}>
          
          {/* Poster Column */}
          <div style={styles.posterColumn}>
            <div style={styles.mainPoster} className="glass">
              {(details?.cover || activeMediaItem.logo) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={details?.cover || activeMediaItem.logo} alt="Cover" style={styles.posterImage} />
              ) : (
                <div style={styles.placeholder}>
                  <ImageIcon size={64} opacity={0.3} />
                </div>
              )}
            </div>

            {activeSection === 'movies' && (
              <button 
                onClick={handlePlayMovie} 
                style={styles.hugePlayBtn}
                className="hover-lift"
              >
                <Play size={24} fill="currentColor" /> Play Movie
              </button>
            )}
          </div>

          {/* Details & Episodic Organizer */}
          <div style={styles.infoColumn}>
            <h1 style={styles.title}>{details?.name || activeMediaItem.name}</h1>
            
            <div style={styles.metaRow}>
              {details?.rating && details.rating !== "0" && (
                <span style={styles.badge}>
                  <Star size={14} color="#eab308" fill="#eab308" /> {details.rating}
                </span>
              )}
              {details?.releasedate && (
                <span style={styles.tag}><Calendar size={14} /> {details.releasedate}</span>
              )}
              {details?.duration && (
                <span style={styles.tag}><Clock size={14} /> {details.duration}</span>
              )}
              {details?.genre && (
                <span style={styles.tag}>{details.genre}</span>
              )}
            </div>

            <div style={styles.overview}>
              <h3 style={styles.subhead}>Overview</h3>
              <p style={styles.description}>
                {details?.plot || details?.description || 'No description available for this title.'}
              </p>
            </div>

            {(details?.cast || details?.director) && (
              <div style={styles.crewInfo}>
                {details?.director && <p><strong>Director:</strong> {details.director}</p>}
                {details?.cast && <p><strong>Cast:</strong> {details.cast}</p>}
              </div>
            )}

            {/* Series Organizer */}
            {activeSection === 'series' && seasons.length > 0 && (
              <div style={styles.episodesSection}>
                <h3 style={styles.subhead}>Seasons</h3>
                
                <div style={styles.seasonTabs}>
                  {seasons.map(s => (
                    <button 
                      key={s} 
                      onClick={() => setActiveSeason(s)}
                      style={{...styles.seasonBtn, ...(activeSeason === s ? styles.activeSeasonBtn : {})}}
                    >
                      Season {s}
                    </button>
                  ))}
                </div>

                <div style={styles.episodesGrid}>
                  {episodes[activeSeason]?.map((ep, i) => (
                    <div 
                      key={ep.id} 
                      className="glass hover-lift" 
                      style={styles.episodeCard}
                      onClick={() => handlePlayEpisode(ep)}
                    >
                      <div style={styles.epThumb}>
                        {ep.info?.movie_image ? (
                           // eslint-disable-next-line @next/next/no-img-element
                           <img src={ep.info.movie_image} alt="" style={styles.epImg} />
                        ) : (
                           <Play size={24} opacity={0.5} />
                        )}
                        <div style={styles.epPlayOverlay} className="ep-play-overlay">
                           <Play size={24} fill="#fff" />
                        </div>
                      </div>
                      <div style={styles.epInfo}>
                        <h4 style={styles.epTitle}>{ep.title || `Episode ${ep.episode_num || i + 1}`}</h4>
                        {ep.info?.duration && <span style={styles.epDuration}>{ep.info.duration}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .hover-lift { transition: transform 0.2s, box-shadow 0.2s; cursor: pointer; border: 1px solid transparent; }
        .hover-lift:hover { transform: translateY(-3px); box-shadow: var(--shadow-lg); border-color: rgba(255,255,255,0.1); }
        .episodeCard:hover .ep-play-overlay { opacity: 1 !important; }
        .loader-spinner {
          width: 40px; height: 40px;
          border: 3px solid rgba(255,255,255,0.2);
          border-top-color: var(--accent-color);
          border-radius: 50%;
          animation: spin 1s infinite linear;
        }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}} />
    </div>
  );
}

const styles = {
  container: {
    padding: '2rem',
    overflowY: 'auto',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  backBtn: {
    alignSelf: 'flex-start',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1.5rem',
    borderRadius: 'var(--radius-full)',
    border: '1px solid var(--glass-border)',
    color: 'var(--text-primary)',
    background: 'var(--bg-surface)',
    marginBottom: '2rem',
    fontWeight: '500',
  },
  loadingState: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorState: {
    padding: '2rem',
    background: 'rgba(239, 68, 68, 0.1)',
    color: '#ef4444',
    borderRadius: 'var(--radius-lg)',
    textAlign: 'center',
  },
  contentLayout: {
    display: 'flex',
    gap: '3rem',
    flexWrap: 'wrap',
  },
  posterColumn: {
    flex: '0 0 320px',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  mainPoster: {
    width: '100%',
    aspectRatio: '2/3',
    borderRadius: 'var(--radius-xl)',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0,0,0,0.4)',
    boxShadow: 'var(--shadow-xl)',
  },
  posterImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  placeholder: {
    color: 'var(--text-secondary)',
  },
  hugePlayBtn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
    padding: '1.25rem',
    background: 'var(--accent-color)',
    color: '#fff',
    border: 'none',
    borderRadius: 'var(--radius-lg)',
    fontSize: '1.1rem',
    fontWeight: '600',
    boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
  },
  infoColumn: {
    flex: '1 1 500px',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  title: {
    fontSize: '3rem',
    fontWeight: '800',
    lineHeight: '1.1',
    letterSpacing: '-0.02em',
    color: '#fff',
  },
  metaRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '1rem',
    alignItems: 'center',
  },
  badge: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    background: 'rgba(255,255,255,0.1)',
    padding: '0.5rem 0.75rem',
    borderRadius: 'var(--radius-sm)',
    fontWeight: '600',
    fontSize: '0.875rem',
  },
  tag: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: 'var(--text-secondary)',
    fontSize: '0.9rem',
  },
  overview: {
    marginTop: '1rem',
  },
  subhead: {
    fontSize: '1.25rem',
    fontWeight: '600',
    marginBottom: '0.75rem',
    color: '#fff',
    borderBottom: '1px solid var(--glass-border)',
    paddingBottom: '0.5rem',
  },
  description: {
    color: 'var(--text-secondary)',
    lineHeight: '1.7',
    fontSize: '1rem',
  },
  crewInfo: {
    color: 'var(--text-secondary)',
    fontSize: '0.9rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    background: 'rgba(255,255,255,0.03)',
    padding: '1rem',
    borderRadius: 'var(--radius-md)',
  },
  episodesSection: {
    marginTop: '2rem',
  },
  seasonTabs: {
    display: 'flex',
    gap: '0.5rem',
    overflowX: 'auto',
    paddingBottom: '1rem',
    marginBottom: '1rem',
  },
  seasonBtn: {
    padding: '0.5rem 1.25rem',
    background: 'var(--bg-surface)',
    border: '1px solid var(--glass-border)',
    color: 'var(--text-secondary)',
    borderRadius: 'var(--radius-full)',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all 0.2s',
  },
  activeSeasonBtn: {
    background: 'rgba(99, 102, 241, 0.2)',
    color: 'var(--accent-color)',
    borderColor: 'var(--accent-color)',
  },
  episodesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '1rem',
  },
  episodeCard: {
    display: 'flex',
    padding: '0.5rem',
    gap: '1rem',
    borderRadius: 'var(--radius-md)',
    alignItems: 'center',
    background: 'rgba(0,0,0,0.2)',
    border: '1px solid var(--glass-border)',
  },
  epThumb: {
    width: '120px',
    aspectRatio: '16/9',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: 'var(--radius-sm)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  epImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  epPlayOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0,0,0,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0,
    transition: 'opacity 0.2s',
  },
  epInfo: {
    flex: 1,
    overflow: 'hidden',
  },
  epTitle: {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    marginBottom: '0.25rem',
  },
  epDuration: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
  }
};
