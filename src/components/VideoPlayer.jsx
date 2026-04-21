'use client';

import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Play, Pause, Volume2, VolumeX, Maximize } from 'lucide-react';
import usePlaylistStore from '../store/PlaylistStore';

export default function VideoPlayer() {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const { activeChannel, saveProgress, resumeProgress } = usePlaylistStore();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [error, setError] = useState(null);
  const hasLoadedProgress = useRef(false);

  useEffect(() => {
    if (!activeChannel || !videoRef.current) return;

    let hls;
    const video = videoRef.current;

    setIsBuffering(true);
    setError(null);
    setIsPlaying(false);
    hasLoadedProgress.current = false;

    // Determine if it's a raw video file instead of an M3U8 payload
    const isFileStream = activeChannel.url.includes('.mp4') || activeChannel.url.includes('.mkv') || activeChannel.url.includes('.avi');

    if (!isFileStream && Hls.isSupported()) {
      // "Perfect Tech" Live Configuration
      hls = new Hls({
        maxBufferLength: 30,             // Target forward buffer
        maxMaxBufferLength: 60,          // Maximum memory buffer
        liveSyncDurationCount: 3,        // Lock onto the live edge (offset 3 segments)
        liveMaxLatencyDurationCount: 10, // Hard reset if latency trails too far
        enableWorker: true,              // Multithreaded chunk decryption
        lowLatencyMode: true,            // Ultra-low latency mode
        fragLoadingTimeOut: 20000,       // 20s timeout for slow streams
        manifestLoadingTimeOut: 10000,   // 10s timeout for playlists
        levelLoadingTimeOut: 10000,
      });
      
      // We append &ext=.m3u8 to trick hls.js into always identifying the proxy as a valid playlist file
      hls.loadSource(`/api/stream?url=${encodeURIComponent(activeChannel.url)}&ext=.m3u8`);
      hls.attachMedia(video);
      
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().then(() => {
          setIsPlaying(true);
        }).catch(e => {
          console.log('Autoplay blocked:', e);
          setIsPlaying(false);
        });
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.warn('HLS Network Error, attempting autonomous recovery...');
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.warn('HLS Media Error, recovering pipeline...');
              hls.recoverMediaError();
              break;
            default:
              setError('Stream format unsupported or completely unrecoverable.');
              hls.destroy();
              setIsBuffering(false);
              break;
          }
        }
      });
    } else {
      // Native fallback for MP4/MKV or Safari iOS HLS playback
      // Route through local proxy to bypass CORS blocks on raw files
      video.src = `/api/stream?url=${encodeURIComponent(activeChannel.url)}`;
      video.addEventListener('loadedmetadata', () => {
        video.play().then(() => {
          setIsPlaying(true);
        }).catch(e => {
          console.log('Autoplay blocked:', e);
          setIsPlaying(false);
        });
      });
      video.addEventListener('error', () => {
        setError('Video failed to load. Format unsupported or link dead.');
        setIsBuffering(false);
      });
    }

    const handleTimeUpdate = () => {
      if (!video) return;
      if (video.duration && video.duration !== Infinity && video.currentTime > 5) {
        saveProgress(activeChannel.id, video.currentTime);
      }
    };

    const handleLoadedMetadata = () => {
      if (video.duration && video.duration !== Infinity && !hasLoadedProgress.current) {
         const savedTime = resumeProgress[activeChannel.id];
         if (savedTime && savedTime < video.duration - 10) {
           video.currentTime = savedTime;
         }
         hasLoadedProgress.current = true;
      }
    };

    const handleWaiting = () => setIsBuffering(true);
    const handlePlaying = () => setIsBuffering(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
      if (hls) {
        hls.destroy();
      }
    };
  }, [activeChannel, resumeProgress, saveProgress]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(!isMuted);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  if (!activeChannel) {
    return null; // Handled by page.js conditionally
  }

  return (
    <div ref={containerRef} className="glass" style={styles.container}>
      {error && (
        <div style={styles.errorOverlay}>
          <div style={styles.errorBox}>{error}</div>
        </div>
      )}
      
      {isBuffering && !error && (
        <div style={styles.bufferingOverlay}>
          <div className="loader-spinner"></div>
        </div>
      )}

      <video
        ref={videoRef}
        style={{...styles.video, opacity: error ? 0.3 : 1}}
        onClick={togglePlay}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
      
      <div style={styles.overlay}>
        <div style={styles.header}>
          {activeChannel.logo && <img src={activeChannel.logo} alt="" style={styles.logo} />}
          <h2 style={styles.title}>{activeChannel.name}</h2>
        </div>
        
        <div style={styles.controlsLayer}>
          <div style={styles.controls}>
            <button onClick={togglePlay} style={styles.iconBtn}>
              {isPlaying ? <Pause color="#fff" /> : <Play color="#fff" />}
            </button>
            <button onClick={toggleMute} style={styles.iconBtn}>
              {isMuted ? <VolumeX color="#fff" /> : <Volume2 color="#fff" />}
            </button>
            
            <div style={{ flex: 1 }}></div>
            
            <button onClick={toggleFullscreen} style={styles.iconBtn}>
              <Maximize color="#fff" />
            </button>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .loader-spinner {
          width: 48px;
          height: 48px;
          border: 4px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top-color: var(--accent-color);
          animation: spin 1s ease-in-out infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}} />
    </div>
  );
}

const styles = {
  container: {
    height: '100%',
    maxHeight: '100%',
    aspectRatio: '16/9',
    position: 'relative',
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
    backgroundColor: '#000',
    display: 'flex',
    boxShadow: 'var(--shadow-xl)',
  },
  video: {
    width: '100%',
    height: '100%',
    cursor: 'pointer',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    background: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 20%, transparent 80%, rgba(0,0,0,0.8) 100%)',
  },
  header: {
    padding: '1.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  logo: {
    width: '40px',
    height: '40px',
    objectFit: 'contain',
    background: 'rgba(255,255,255,0.1)',
    borderRadius: '8px',
    padding: '4px',
  },
  title: {
    color: '#fff',
    fontSize: '1.25rem',
    fontWeight: '600',
    textShadow: '0 2px 4px rgba(0,0,0,0.5)',
  },
  controlsLayer: {
    padding: '1rem',
    pointerEvents: 'auto',
  },
  controls: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(8px)',
    padding: '0.75rem 1rem',
    borderRadius: 'var(--radius-md)',
  },
  iconBtn: {
    padding: '0.5rem',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.2s',
  },
  errorOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  errorBox: {
    padding: '1rem 2rem',
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    color: '#fff',
    borderRadius: 'var(--radius-md)',
    boxShadow: 'var(--shadow-lg)',
  },
  bufferingOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.3)',
  }
};
