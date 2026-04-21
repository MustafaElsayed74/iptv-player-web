'use client';

import Sidebar from '../components/Sidebar';
import PlaylistUploader from '../components/PlaylistUploader';
import VideoPlayer from '../components/VideoPlayer';
import ChannelGrid from '../components/ChannelGrid';
import MoviesView from '../components/MoviesView';
import SeriesView from '../components/SeriesView';
import MediaDetailView from '../components/MediaDetailView';
import usePlaylistStore from '../store/PlaylistStore';
import { useEffect, useState } from 'react';

export default function Home() {
  const { channels, xtreamCredentials, activeSection, activeViewMode } = usePlaylistStore();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch by waiting for mount before rendering persistent state dependent UI
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div style={styles.loading}>Loading IPTV Platform...</div>;

  return (
    <main style={styles.main}>
      <Sidebar />
      
      <div style={styles.content}>
        {channels.length === 0 && !xtreamCredentials ? (
          <PlaylistUploader />
        ) : activeViewMode === 'detail' ? (
          <MediaDetailView />
        ) : (
          <>
            <div style={styles.playerSection}>
              <VideoPlayer />
            </div>
            <div style={styles.gridSection}>
              {activeSection === 'movies' && <MoviesView />}
              {activeSection === 'series' && <SeriesView />}
              {(activeSection === 'live' || activeSection === 'sports') && <ChannelGrid />}
            </div>
          </>
        )}
      </div>
    </main>
  );
}

const styles = {
  main: {
    display: 'flex',
    height: '100vh',
    width: '100vw',
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    position: 'relative',
    background: 'radial-gradient(circle at 50% -20%, rgba(99, 102, 241, 0.15), transparent 60%)',
  },
  playerSection: {
    padding: '1.5rem 1.5rem 0 1.5rem',
    maxWidth: '1200px',
    margin: '0 auto',
    width: '100%',
  },
  gridSection: {
    flex: 1,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    maxWidth: '1600px',
    margin: '0 auto',
    width: '100%',
  },
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    color: 'var(--text-secondary)',
    fontFamily: 'inherit',
  }
};
