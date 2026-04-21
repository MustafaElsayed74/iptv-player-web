'use client';

import { useState } from 'react';
import { UploadCloud, LogIn, Link as LinkIcon } from 'lucide-react';
import { parseM3U } from '../utils/m3uParser';
import usePlaylistStore from '../store/PlaylistStore';

export default function PlaylistUploader() {
  const [activeTab, setActiveTab] = useState('xtream'); // 'xtream', 'm3u', or 'url'
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Xtream Form State
  const [url, setUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // M3U URL Form State
  const [m3uUrlInput, setM3uUrlInput] = useState('');

  const setPlaylist = usePlaylistStore((state) => state.setPlaylist);

  // Handle M3U File Upload
  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError('');

    try {
      const text = await file.text();
      const channels = parseM3U(text);
      if (channels.length === 0) {
        setError('No valid channels found in the playlist.');
      } else {
        setPlaylist(channels);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to parse the M3U file. Please ensure it is a valid format.');
    } finally {
      setLoading(false);
    }
  };

  // Handle M3U URL Fetch
  const handleUrlSubmit = async (e) => {
    e.preventDefault();
    if (!m3uUrlInput) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/proxy?url=${encodeURIComponent(m3uUrlInput)}`);
      if (!res.ok) {
        throw new Error('Failed to load playlist from URL.');
      }
      const text = await res.text();
      const channels = parseM3U(text);
      if (channels.length === 0) {
        setError('No valid channels found in the playlist at that URL.');
      } else {
        setPlaylist(channels);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch or parse the M3U URL. Ensure the URL is valid and publicly accessible.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Xtream Codes Login
  const handleXtreamLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/xtream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      setPlaylist(data.channels, { url, username, password });
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="uploader-container animate-fade-in" style={styles.container}>
      <div className="glass" style={styles.card}>
        
        {/* Tabs */}
        <div style={styles.tabs}>
          <button 
            style={{...styles.tabBtn, ...(activeTab === 'xtream' ? styles.activeTab : {})}} 
            onClick={() => setActiveTab('xtream')}
          >
            <LogIn size={18} /> Xtream API
          </button>
          <button 
            style={{...styles.tabBtn, ...(activeTab === 'url' ? styles.activeTab : {})}} 
            onClick={() => setActiveTab('url')}
          >
            <LinkIcon size={18} /> M3U URL
          </button>
          <button 
            style={{...styles.tabBtn, ...(activeTab === 'm3u' ? styles.activeTab : {})}} 
            onClick={() => setActiveTab('m3u')}
          >
            <UploadCloud size={18} /> M3U File
          </button>
        </div>

        {/* Tab Content */}
        <div style={styles.content}>
          {activeTab === 'xtream' ? (
            <form onSubmit={handleXtreamLogin} style={styles.form}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Server URL</label>
                <input 
                  type="url" 
                  value={url} 
                  onChange={e => setUrl(e.target.value)} 
                  placeholder="http://nv.pro" 
                  required 
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Username</label>
                <input 
                  type="text" 
                  value={username} 
                  onChange={e => setUsername(e.target.value)} 
                  placeholder="j223j2n" 
                  required 
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Password</label>
                <input 
                  type="password" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  placeholder="kdsk33d" 
                  required 
                  style={styles.input}
                />
              </div>
              <button type="submit" disabled={loading} style={styles.submitBtn}>
                {loading ? 'Connecting...' : 'Login'}
              </button>
            </form>
          ) : activeTab === 'url' ? (
             <form onSubmit={handleUrlSubmit} style={styles.form}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Playlist URL</label>
                <input 
                  type="url" 
                  value={m3uUrlInput} 
                  onChange={e => setM3uUrlInput(e.target.value)} 
                  placeholder="https://example.com/playlist.m3u" 
                  required 
                  style={styles.input}
                />
              </div>
              <button type="submit" disabled={loading} style={styles.submitBtn}>
                {loading ? 'Fetching...' : 'Load Playlist'}
              </button>
            </form>
          ) : (
            <div style={styles.uploadSection}>
              <UploadCloud size={48} color="var(--accent-color)" style={{ marginBottom: '1rem' }} />
              <h2 style={styles.title}>Upload Your Playlist</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', textAlign: 'center' }}>
                Select an .m3u or .m3u8 file to load your channels locally.
              </p>
              <label style={styles.uploadBtn}>
                {loading ? 'Processing...' : 'Choose File'}
                <input 
                  type="file" 
                  accept=".m3u,.m3u8" 
                  onChange={handleFileUpload} 
                  style={{ display: 'none' }}
                  disabled={loading}
                />
              </label>
            </div>
          )}
        </div>

        {error && <p style={styles.error}>{error}</p>}
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    height: '100%',
    padding: '2rem',
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    borderRadius: 'var(--radius-xl)',
    maxWidth: '500px',
    width: '100%',
    boxShadow: 'var(--shadow-lg)',
    overflow: 'hidden',
  },
  tabs: {
    display: 'flex',
    borderBottom: '1px solid var(--glass-border)',
    background: 'rgba(0,0,0,0.1)',
  },
  tabBtn: {
    flex: 1,
    padding: '1rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    color: 'var(--text-secondary)',
    fontWeight: '500',
    transition: 'all 0.2s',
  },
  activeTab: {
    color: 'var(--text-primary)',
    borderBottom: '2px solid var(--accent-color)',
    background: 'rgba(255,255,255,0.02)',
  },
  content: {
    padding: '2.5rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: 'var(--text-secondary)',
  },
  input: {
    padding: '0.75rem 1rem',
    borderRadius: 'var(--radius-md)',
    background: 'var(--bg-surface)',
    border: '1px solid var(--glass-border)',
    color: 'var(--text-primary)',
    fontFamily: 'inherit',
    outline: 'none',
  },
  submitBtn: {
    marginTop: '0.5rem',
    backgroundColor: 'var(--accent-color)',
    color: '#fff',
    padding: '0.75rem 2rem',
    borderRadius: 'var(--radius-md)',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  uploadSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: '600',
    marginBottom: '0.5rem',
  },
  uploadBtn: {
    backgroundColor: 'var(--accent-color)',
    color: '#fff',
    padding: '0.75rem 2rem',
    borderRadius: 'var(--radius-md)',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  error: {
    margin: '0 2.5rem 2.5rem 2.5rem',
    padding: '1rem',
    borderRadius: 'var(--radius-sm)',
    background: 'rgba(239, 68, 68, 0.1)',
    color: '#ef4444',
    fontSize: '0.875rem',
    textAlign: 'center',
  }
};
