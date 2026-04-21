'use client';

import { Tv, List, Grid, MonitorPlay, Trash2, Film, Clapperboard, Medal, Heart } from 'lucide-react';
import usePlaylistStore from '../store/PlaylistStore';

export default function Sidebar() {
  const { 
    groups, vodGroups, seriesGroups, 
    activeGroup, setActiveGroup, 
    activeSection, setActiveSection,
    clearPlaylist, channels, xtreamCredentials 
  } = usePlaylistStore();

  const getActiveGroups = () => {
    if (activeSection === 'movies') return vodGroups;
    if (activeSection === 'series') return seriesGroups;
    return groups;
  };

  const navGroups = getActiveGroups();

  if (channels.length === 0) return null;

  return (
    <div className="glass" style={styles.sidebar}>
      <div style={styles.header}>
        <MonitorPlay size={28} color="var(--accent-color)" />
        <h1 style={styles.brand}>IPTV</h1>
      </div>

      <div style={styles.sectionsNav}>
        <h3 style={styles.navTitle}>Sections</h3>
        <ul style={styles.sectionList}>
          <li style={{...styles.listItem, ...(activeSection === 'live' ? styles.activeItem : {})}}>
            <button onClick={() => setActiveSection('live')} style={styles.btn}>
              <MonitorPlay size={18} /> <span style={styles.groupText}>Live TV</span>
            </button>
          </li>
          <li style={{...styles.listItem, ...(activeSection === 'movies' ? styles.activeItem : {})}}>
            <button onClick={() => setActiveSection('movies')} style={styles.btn}>
              <Film size={18} /> <span style={styles.groupText}>Movies</span>
            </button>
          </li>
          <li style={{...styles.listItem, ...(activeSection === 'series' ? styles.activeItem : {})}}>
            <button onClick={() => setActiveSection('series')} style={styles.btn}>
              <Clapperboard size={18} /> <span style={styles.groupText}>Series</span>
            </button>
          </li>
          <li style={{...styles.listItem, ...(activeSection === 'sports' ? styles.activeItem : {})}}>
            <button onClick={() => setActiveSection('sports')} style={styles.btn}>
              <Medal size={18} /> <span style={styles.groupText}>Sports</span>
            </button>
          </li>
        </ul>
      </div>

      <div style={styles.nav}>
        <h3 style={styles.navTitle}>Categories</h3>
        <ul style={styles.list}>
          {/* Persistent Favorites Tab */}
          <li style={{...styles.listItem, ...(activeGroup === 'Favorites' ? styles.activeItem : {})}}>
            <button 
              onClick={() => setActiveGroup('Favorites')}
              style={styles.btn}
            >
              <Heart size={18} color={activeGroup === 'Favorites' ? 'var(--accent-color)' : 'currentColor'} fill={activeGroup === 'Favorites' ? 'var(--accent-color)' : 'none'} />
              <span style={styles.groupText}>Favorites</span>
            </button>
          </li>
          
          {navGroups.map((group) => (
            <li key={group} style={{...styles.listItem, ...(activeGroup === group ? styles.activeItem : {})}}>
              <button 
                onClick={() => setActiveGroup(group)}
                style={styles.btn}
              >
                {group === 'All' ? <List size={18} /> : <Tv size={18} />}
                <span style={styles.groupText}>{group}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div style={styles.footer}>
        {xtreamCredentials && (
          <div style={styles.userInfo}>
            <div style={styles.userLabel}>Logged in as</div>
            <div style={styles.userName}>{xtreamCredentials.username}</div>
          </div>
        )}
        <button onClick={clearPlaylist} style={styles.clearBtn}>
          <Trash2 size={16} />
          {xtreamCredentials ? 'Log Out' : 'Clear Playlist'}
        </button>
      </div>
    </div>
  );
}

const styles = {
  sidebar: {
    width: '280px',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    borderRight: '1px solid var(--glass-border)',
    borderTop: 'none',
    borderBottom: 'none',
    borderLeft: 'none',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '2rem 1.5rem',
    borderBottom: '1px solid var(--glass-border)',
  },
  brand: {
    fontSize: '1.25rem',
    fontWeight: '700',
    letterSpacing: '-0.025em',
  },
  sectionsNav: {
    padding: '1.5rem 1.5rem 0 1.5rem',
    borderBottom: '1px solid var(--glass-border)',
    paddingBottom: '1.5rem',
  },
  sectionList: {
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  nav: {
    padding: '1.5rem',
    flex: 1,
    overflowY: 'auto',
  },
  navTitle: {
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: 'var(--text-secondary)',
    marginBottom: '1rem',
    fontWeight: '600',
  },
  list: {
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  listItem: {
    borderRadius: 'var(--radius-md)',
    transition: 'all 0.2s',
  },
  activeItem: {
    background: 'rgba(99, 102, 241, 0.15)',
    color: 'var(--accent-color)',
  },
  btn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    width: '100%',
    padding: '0.75rem 1rem',
    color: 'inherit',
    textAlign: 'left',
  },
  groupText: {
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    fontSize: '0.875rem',
    fontWeight: '500',
  },
  footer: {
    padding: '1.5rem',
    borderTop: '1px solid var(--glass-border)',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  userInfo: {
    padding: '0.75rem',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: 'var(--radius-md)',
  },
  userLabel: {
    fontSize: '0.65rem',
    textTransform: 'uppercase',
    color: 'var(--text-secondary)',
    marginBottom: '0.25rem',
  },
  userName: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: 'var(--accent-color)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  clearBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    width: '100%',
    padding: '0.75rem',
    color: '#ef4444',
    background: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.875rem',
    fontWeight: '500',
    transition: 'background 0.2s',
  }
};
