import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const usePlaylistStore = create(
  persist(
    (set, get) => ({
      channels: [], // Live TV
      groups: [],
      
      vods: [], // Movies
      vodGroups: [],
      
      series: [], // TV Shows
      seriesGroups: [],

      activeSection: 'live', // 'live', 'movies', 'series', 'sports'
      activeChannel: null, // Stream playing in VideoPlayer
      activeMediaItem: null, // Selected media for MediaDetailView
      activeViewMode: 'grid', // 'grid', 'detail'
      activeGroup: 'All',
      globalSearchQuery: '',
      
      xtreamCredentials: null,

      // User progression & lists
      favorites: { live: [], movies: [], series: [] }, // Array of IDs
      customLists: [], // e.g. { id, name, section, items: [] }
      watchHistory: [], // Array of recently watched objects
      resumeProgress: {}, // { streamId: seconds }
      
      setPlaylist: (channels, credentials = null) => {
        const uniqueGroups = Array.from(new Set(channels.map(c => c.group))).sort();
        set({ channels, groups: ['All', ...uniqueGroups], activeGroup: 'All', xtreamCredentials: credentials, activeSection: 'live' });
      },

      setVods: (vods) => {
        const uniqueGroups = Array.from(new Set(vods.map(c => c.group))).sort();
        set({ vods, vodGroups: ['All', ...uniqueGroups] });
      },

      setSeries: (series) => {
        const uniqueGroups = Array.from(new Set(series.map(c => c.group))).sort();
        set({ series, seriesGroups: ['All', ...uniqueGroups] });
      },

      setActiveSection: (section) => set({ activeSection: section, activeGroup: 'All', activeViewMode: 'grid' }),
      
      setActiveMediaItem: (item) => set({ activeMediaItem: item, activeViewMode: 'detail' }),
      
      goBackToGrid: () => set({ activeViewMode: 'grid', activeMediaItem: null }),
      
      setActiveChannel: (channel) => {
        set((state) => {
           // Add to watch history
           if (!channel) return { activeChannel: null };
           const duplicateFreeHistory = state.watchHistory.filter(h => h.id !== channel.id);
           const newHistory = [{ ...channel, section: state.activeSection, timestamp: Date.now() }, ...duplicateFreeHistory].slice(0, 50);
           return { activeChannel: channel, watchHistory: newHistory };
        });
      },
      
      setActiveGroup: (group) => set({ activeGroup: group }),
      
      setGlobalSearchQuery: (query) => set({ globalSearchQuery: query }),
      
      clearPlaylist: () => set({ 
        channels: [], groups: [], vods: [], vodGroups: [], series: [], seriesGroups: [],
        activeChannel: null, activeMediaItem: null, activeGroup: 'All', activeViewMode: 'grid', xtreamCredentials: null,
        globalSearchQuery: '',
        favorites: { live: [], movies: [], series: [] },
        customLists: [], watchHistory: [], resumeProgress: {}, activeSection: 'live'
      }),
      
      getFilteredChannels: () => {
        const { activeSection, activeGroup, channels, vods, series, favorites } = get();
        const safeFavorites = favorites || { live: [], movies: [], series: [] };
        
        let sourceList = channels || [];
        if (activeSection === 'movies') sourceList = vods || [];
        if (activeSection === 'series') sourceList = series || [];
        
        // Pseudo sports section by identifying live channels with 'sport' in group
        if (activeSection === 'sports') {
           sourceList = sourceList.filter(c => c.group && c.group.toLowerCase().includes('sport'));
           if (activeGroup === 'Favorites') return sourceList.filter(c => safeFavorites.live?.includes(c.id));
           if (activeGroup === 'All') return sourceList;
           return sourceList.filter(c => c.group === activeGroup);
        }

        if (activeGroup === 'Favorites') {
           const favSection = activeSection === 'sports' ? 'live' : activeSection;
           return sourceList.filter(c => safeFavorites[favSection]?.includes(c.id));
        }

        if (activeGroup === 'All') return sourceList;
        return sourceList.filter(c => c.group === activeGroup);
      },

      // Favourites operations
      toggleFavorite: (id, section) => set((state) => {
         const currentFavorites = state.favorites || { live: [], movies: [], series: [] };
         const secFavs = currentFavorites[section] || [];
         if (secFavs.includes(id)) {
           return { favorites: { ...currentFavorites, [section]: secFavs.filter(fid => fid !== id) }};
         } else {
           return { favorites: { ...currentFavorites, [section]: [...secFavs, id] }};
         }
      }),

      // Progress Tracker
      saveProgress: (id, time) => set((state) => ({
         resumeProgress: { ...state.resumeProgress, [id]: time }
      })),
    }),
    {
      name: 'iptv-playlist-storage',
    }
  )
);

export default usePlaylistStore;
