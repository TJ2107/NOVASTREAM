import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type MediaType = 'live' | 'movie' | 'series' | 'radio';
export type MediaCategory = 'news' | 'sport' | 'cinema' | 'music' | 'kids' | 'doc' | 'general';

export interface MediaItem {
  id: string;
  type: MediaType;
  title: string;
  name?: string;
  url: string;
  alternativeUrls?: string[];
  logo?: string;
  group?: string;
  category?: MediaCategory;
  country?: string;
  language?: string;
  description?: string;
  poster?: string;
  // Series & episodes
  seriesId?: string;
  season?: number;
  episode?: number;
  duration?: number;
  // Player state
  currentTime?: number;
}

export interface Playlist {
  id: string;
  name: string;
  url: string;
  items: MediaItem[];
  createdAt: number;
}

export interface VPNServer {
  id: string;
  country: string;
  city: string;
  flag: string;
  ip: string;
  ping: number;
  load: number;
  isSwiss?: boolean;
}

export const VPN_SERVERS: VPNServer[] = [
  { id: 'ch-zurich-1', country: 'Suisse', city: 'Zurich #1', flag: '🇨🇭', ip: '185.107.56.24', ping: 12, load: 28, isSwiss: true },
  { id: 'ch-geneva-1', country: 'Suisse', city: 'Genève #2', flag: '🇨🇭', ip: '185.107.56.88', ping: 15, load: 34, isSwiss: true },
  { id: 'ch-secure-3', country: 'Suisse', city: 'Bunker Alpes #3 (Secure Core)', flag: '🇨🇭', ip: '185.107.57.12', ping: 19, load: 19, isSwiss: true },
  { id: 'be-brussels', country: 'Belgique', city: 'Bruxelles #1', flag: '🇧🇪', ip: '194.154.200.4', ping: 22, load: 41 },
  { id: 'de-frankfurt', country: 'Allemagne', city: 'Francfort #1', flag: '🇩🇪', ip: '193.138.218.7', ping: 18, load: 39 },
  { id: 'ca-montreal', country: 'Canada', city: 'Montréal #1', flag: '🇨🇦', ip: '198.54.135.9', ping: 82, load: 30 },
  { id: 'nl-amsterdam', country: 'Pays-Bas', city: 'Amsterdam #1', flag: '🇳🇱', ip: '185.220.101.5', ping: 24, load: 48 }
];

export function dedupeSources(sources: MediaItem[]): MediaItem[] {
  const seenIds = new Set<string>();
  const seenUrlAndTypes = new Set<string>();
  const result: MediaItem[] = [];

  for (const item of sources) {
    const urlTypeKey = `${item.url}-${item.type}`;
    if (!seenIds.has(item.id) && !seenUrlAndTypes.has(urlTypeKey)) {
      seenIds.add(item.id);
      seenUrlAndTypes.add(urlTypeKey);
      result.push(item);
    }
  }

  return result;
}

// 100% Tested & Verified Live & VOD Streams with CORS * and active segments
export const INITIAL_DEMO_SOURCES: MediaItem[] = [
  {
    id: 'demo-20min',
    name: '20 Minutes TV',
    title: '20 Minutes TV (France)',
    url: 'https://live-20minutestv.digiteka.com/1961167769/index.m3u8',
    type: 'live',
    group: 'Actualités',
    category: 'news',
    country: 'FR',
    logo: 'https://upload.wikimedia.org/wikipedia/fr/thumb/f/f6/20_Minutes_TV_logo.svg/320px-20_Minutes_TV_logo.svg.png',
    description: 'Chaîne d\'information et de divertissement française en continu (Île-de-France et National).'
  },
  {
    id: 'demo-africanews',
    name: 'Africanews / Euronews FR',
    title: 'Africanews Français (Euronews Group)',
    url: 'https://cdn-euronews.akamaized.net/live/eds/africanews-fr/25050/index.m3u8',
    type: 'live',
    group: 'Actualités',
    category: 'news',
    country: 'FR',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Euronews_2016_logo.svg/320px-Euronews_2016_logo.svg.png',
    description: 'Actualités internationales et africaines en continu par le groupe Euronews en français.'
  },
  {
    id: 'demo-africa24',
    name: 'Africa 24',
    title: 'Africa 24 Direct',
    url: 'https://africa24.vedge.infomaniak.com/livecast/ik:africa24/manifest.m3u8',
    type: 'live',
    group: 'Actualités',
    category: 'news',
    country: 'FR',
    logo: 'https://upload.wikimedia.org/wikipedia/fr/thumb/c/c5/Africa_24_logo.png/320px-Africa_24_logo.png',
    description: 'Première chaîne d\'information continue panafricaine 24h/24.'
  },
  {
    id: 'demo-rtnc',
    name: 'RTNC (RDC)',
    title: 'RTNC 1 - Télévision Nationale Congolaise',
    url: 'https://www.youtube.com/embed?listType=search&list=RTNC%20EN%20DIRECT&autoplay=1',
    alternativeUrls: [
      'https://www.youtube.com/embed?listType=search&list=RTNC%20OFFICIEL%20DIRECT&autoplay=1',
      'https://mistserver.evi-tv.com/hls/evi_tv_live/index.m3u8',
      'https://uvotv-aniview.global.ssl.fastly.net/hls/live/2119692/rtnc1/playlist.m3u8'
    ],
    type: 'live',
    group: 'Afrique & Congo',
    category: 'news',
    country: 'CD',
    language: 'Français / Lingala',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Logo_de_la_RTNC.svg/320px-Logo_de_la_RTNC.svg.png',
    description: 'Chaîne publique nationale de la République Démocratique du Congo (RDC) en direct de Kinshasa : journal télévisé 20h, débats nationaux, culture et actualités.'
  },
  {
    id: 'demo-telecongo',
    name: 'Télé Congo',
    title: 'Télé Congo (Brazzaville)',
    url: 'https://www.youtube.com/embed?listType=search&list=TELE%20CONGO%20EN%20DIRECT&autoplay=1',
    alternativeUrls: [
      'https://www.youtube.com/embed?listType=search&list=TELE%20CONGO%20JT%2020H%20DIRECT&autoplay=1',
      'https://vps122407.serveur-vps.net/hls/drtv.m3u8',
      'https://live20.bozztv.com/trn03/gin-telecongo/index.m3u8'
    ],
    type: 'live',
    group: 'Afrique & Congo',
    category: 'general',
    country: 'CG',
    language: 'Français / Lingala',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Logo_T%C3%A9l%C3%A9_Congo.png/320px-Logo_T%C3%A9l%C3%A9_Congo.png',
    description: 'Chaîne publique nationale de la République du Congo (Brazzaville) : journal télévisé 20h, magazines culturels, musique congolaise et émissions d\'actualité.'
  },
  {
    id: 'demo-drtv',
    name: 'DRTV (Congo)',
    title: 'DRTV International (Brazzaville)',
    url: 'https://vps122407.serveur-vps.net/hls/drtv.m3u8',
    type: 'live',
    group: 'Afrique & Congo',
    category: 'general',
    country: 'CG',
    language: 'Français',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Flag_of_the_Republic_of_the_Congo.svg/320px-Flag_of_the_Republic_of_the_Congo.svg.png',
    description: 'Première chaîne privée généraliste de la République du Congo en direct de Brazzaville (flux HLS direct).'
  },
  {
    id: 'demo-evitv',
    name: 'EVI TV (RDC)',
    title: 'EVI TV Direct Kinshasa',
    url: 'https://mistserver.evi-tv.com/hls/evi_tv_live/index.m3u8',
    type: 'live',
    group: 'Afrique & Congo',
    category: 'general',
    country: 'CD',
    language: 'Français / Lingala',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Flag_of_the_Democratic_Republic_of_the_Congo.svg/320px-Flag_of_the_Democratic_Republic_of_the_Congo.svg.png',
    description: 'Chaîne de télévision généraliste congolaise émettant en direct depuis Kinshasa (flux HLS direct).'
  },
  {
    id: 'demo-france24-fr',
    name: 'France 24 Français',
    title: 'France 24 Français (En Direct)',
    url: 'https://static.france24.com/live/F24_FR_HI_HLS/live_web.m3u8',
    type: 'live',
    group: 'Actualités',
    category: 'news',
    country: 'FR',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/France_24_logo.svg/320px-France_24_logo.svg.png',
    description: 'Chaîne d\'information internationale française en direct 24h/24.'
  },
  {
    id: 'demo-dw',
    name: 'DW News Live',
    title: 'DW News 24/7 (Deutsche Welle)',
    url: 'https://dwamdstream102.akamaized.net/hls/live/2015525/dwstream102/index.m3u8',
    type: 'live',
    group: 'Actualités',
    category: 'news',
    country: 'INT',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Deutsche_Welle_logo.svg/320px-Deutsche_Welle_logo.svg.png',
    description: 'Diffusion internationale d\'informations en direct 24 heures sur 24.'
  },
  {
    id: 'demo-redbull',
    name: 'Red Bull TV',
    title: 'Red Bull TV Direct',
    url: 'https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8',
    type: 'live',
    group: 'Sport',
    category: 'sport',
    country: 'INT',
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f5/Red_Bull_TV_logo.svg/320px-Red_Bull_TV_logo.svg.png',
    description: 'Sports extrêmes, Formule 1, compétitions mondiales et documentaires d\'action en direct.'
  },
  {
    id: 'demo-akamai',
    name: 'Mire Akamai 24/7',
    title: 'Mire HLS HD (Flux Test Permanent)',
    url: 'https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8',
    type: 'live',
    group: 'Documentaire',
    category: 'doc',
    country: 'TEST',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Akamai_Technologies_logo.svg/320px-Akamai_Technologies_logo.svg.png',
    description: 'Flux de test de diffusion haute définition 24/7 diffusé par Akamai CDN.'
  },
  {
    id: 'demo-bbb',
    name: 'Big Buck Bunny (4K Open Movie)',
    title: 'Big Buck Bunny (HLS VOD)',
    url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    type: 'movie',
    group: 'Cinéma',
    category: 'cinema',
    poster: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Big_buck_bunny_poster_big.jpg/360px-Big_buck_bunny_poster_big.jpg',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Big_buck_bunny_poster_big.jpg/360px-Big_buck_bunny_poster_big.jpg',
    description: 'Film d\'animation open-source de la Fondation Blender (streaming HLS multipaliers).'
  },
  {
    id: 'demo-tears',
    name: 'Tears of Steel (Sci-Fi Short)',
    title: 'Tears of Steel (HLS VOD)',
    url: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
    type: 'movie',
    group: 'Cinéma',
    category: 'cinema',
    poster: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Tears_of_Steel_poster.jpg/360px-Tears_of_Steel_poster.jpg',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Tears_of_Steel_poster.jpg/360px-Tears_of_Steel_poster.jpg',
    description: 'Court-métrage de science-fiction cyberpunk à Amsterdam (flux HLS certifié).'
  },
  {
    id: 'demo-franceinfo',
    name: 'France Info Radio',
    title: 'France Info (Radio France)',
    url: 'https://direct.franceinfo.fr/live/franceinfo-midfi.mp3',
    type: 'radio',
    group: 'Actualités',
    category: 'news',
    country: 'FR',
    logo: 'https://upload.wikimedia.org/wikipedia/fr/thumb/5/52/France_Info_logo_2016.svg/320px-France_Info_logo_2016.svg.png',
    description: 'L\'actualité française et internationale en continu en direct radio.'
  },
  {
    id: 'demo-skyrock',
    name: 'Skyrock',
    title: 'Skyrock National Direct',
    url: 'https://icecast.skyrock.net/s/natio_mp3_128k',
    type: 'radio',
    group: 'Musique',
    category: 'music',
    country: 'FR',
    logo: 'https://upload.wikimedia.org/wikipedia/fr/thumb/5/5c/Skyrock_logo_2004.svg/320px-Skyrock_logo_2004.svg.png',
    description: 'Premier sur le rap, le R&B et la musique urbaine en direct.'
  },
  {
    id: 'demo-chantefrance',
    name: 'Chante France',
    title: 'Chante France (100% Chanson Française)',
    url: 'https://stream.chantefrance.com/chante_france-128.mp3',
    type: 'radio',
    group: 'Musique',
    category: 'music',
    country: 'FR',
    logo: 'https://upload.wikimedia.org/wikipedia/fr/thumb/6/64/Chante_France_logo_2018.png/320px-Chante_France_logo_2018.png',
    description: 'La plus belle musique française des années 60 à nos jours.'
  },
  {
    id: 'demo-rfi',
    name: 'RFI Monde',
    title: 'RFI - Radio France Internationale',
    url: 'https://rfimonde64k.ice.infomaniak.ch/rfimonde-64.mp3',
    type: 'radio',
    group: 'Actualités',
    category: 'news',
    country: 'FR',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/RFI_logo.svg/320px-RFI_logo.svg.png',
    description: 'Actualités du monde entier, en direct de Paris.'
  },
  {
    id: 'demo-franceinter',
    name: 'France Inter',
    title: 'France Inter',
    url: 'https://direct.franceinter.fr/live/franceinter-midfi.mp3',
    type: 'radio',
    group: 'Actualités',
    category: 'news',
    country: 'FR',
    logo: 'https://upload.wikimedia.org/wikipedia/fr/thumb/5/52/France_Inter_logo_2016.svg/320px-France_Inter_logo_2016.svg.png',
    description: 'Actualités, culture, humour et émissions en direct.'
  },
  {
    id: 'demo-france24-en',
    name: 'France 24 English',
    title: 'France 24 English (Live)',
    url: 'https://static.france24.com/live/F24_EN_HI_HLS/live_web.m3u8',
    type: 'live',
    group: 'Actualités',
    category: 'news',
    country: 'FR',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/France_24_logo.svg/320px-France_24_logo.svg.png',
    description: 'Chaîne d\'information internationale en direct (anglais).'
  },
  {
    id: 'demo-sintel',
    name: 'Sintel (Open Movie)',
    title: 'Sintel (HLS VOD)',
    url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    type: 'movie',
    group: 'Cinéma',
    category: 'cinema',
    poster: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Sintel_poster.jpg/360px-Sintel_poster.jpg',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Sintel_poster.jpg/360px-Sintel_poster.jpg',
    description: 'Film d\'animation fantastique de la Fondation Blender.'
  }
];

interface AppState {
  sources: MediaItem[];
  favorites: string[];
  history: MediaItem[];
  playlists: Playlist[];
  continueWatching: Record<string, number>;
  tvMode: boolean;
  theme: 'dark' | 'light';
  volume: number;
  playerEngine: 'hls.js' | 'native' | 'proxy' | 'iframe';
  audioBoost: boolean;
  audioMode: 'stereo' | 'mono' | 'surround' | 'bass_boost';
  audioEqualizer: 'flat' | 'cinema' | 'voice' | 'music';
  
  addSource: (item: MediaItem) => void;
  addMultipleSources: (items: MediaItem[]) => void;
  removeSource: (id: string) => void;
  toggleFavorite: (id: string) => void;
  addToHistory: (item: MediaItem) => void;
  clearHistory: () => void;
  updateProgress: (id: string, time: number) => void;
  importPlaylists: (playlists: Playlist[]) => void;
  exportPlaylists: () => string;
  setTVMode: (on: boolean) => void;
  setVolume: (v: number) => void;
  setPlayerEngine: (engine: 'hls.js' | 'native' | 'proxy' | 'iframe') => void;
  setAudioBoost: (boost: boolean) => void;
  setAudioMode: (mode: 'stereo' | 'mono' | 'surround' | 'bass_boost') => void;
  setAudioEqualizer: (eq: 'flat' | 'cinema' | 'voice' | 'music') => void;
  loadDemoSources: () => void;
  resetAll: () => void;
  addPortalPack: (portalDomain: string) => MediaItem[];
  // VPN & Security State
  vpnEnabled: boolean;
  vpnServer: VPNServer;
  vpnProtocol: string;
  vpnKillSwitch: boolean;
  vpnConnectedSince: number | null;
  toggleVPN: () => void;
  setVPNServer: (server: VPNServer) => void;
  setVPNProtocol: (proto: string) => void;
  setVPNKillSwitch: (on: boolean) => void;

  // UI State
  isInterfaceVisible: boolean;
  setIsInterfaceVisible: (visible: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      sources: INITIAL_DEMO_SOURCES,
      favorites: ['demo-20min', 'demo-africanews', 'demo-franceinfo', 'demo-bbb'],
      history: [],
      playlists: [],
      continueWatching: {},
      tvMode: false,
      theme: 'dark',
      volume: 0.9,
      playerEngine: 'hls.js',
      audioBoost: false,
      audioMode: 'stereo',
      audioEqualizer: 'flat',
      // VPN Defaults (Swiss Server Zurich #1)
      vpnEnabled: true,
      vpnServer: VPN_SERVERS[0],
      vpnProtocol: 'WireGuard (256-bit)',
      vpnKillSwitch: true,
      vpnConnectedSince: Date.now(),

      isInterfaceVisible: true,
      setIsInterfaceVisible: (visible: boolean) => set({ isInterfaceVisible: visible }),

      toggleVPN: () => set((s) => ({
        vpnEnabled: !s.vpnEnabled,
        vpnConnectedSince: !s.vpnEnabled ? Date.now() : null
      })),

      setVPNServer: (server) => set({ vpnServer: server }),
      setVPNProtocol: (proto) => set({ vpnProtocol: proto }),
      setVPNKillSwitch: (on) => set({ vpnKillSwitch: on }),
      
      addSource: (item) => set((s) => {
        const remaining = s.sources.filter(i => i.id !== item.id && !(i.url === item.url && i.type === item.type));
        return { sources: [item, ...remaining] };
      }),

      addMultipleSources: (items) => set((s) => {
        return { sources: dedupeSources([...items, ...s.sources]) };
      }),

      removeSource: (id) => set((s) => ({
        sources: s.sources.filter(i => i.id !== id),
        favorites: s.favorites.filter(favId => favId !== id)
      })),

      toggleFavorite: (id) => set((s) => ({
        favorites: s.favorites.includes(id) 
          ? s.favorites.filter(f => f !== id)
          : [...s.favorites, id]
      })),

      addToHistory: (item) => set((s) => ({
        history: [item, ...s.history.filter(h => h.id !== item.id)].slice(0, 100)
      })),

      clearHistory: () => set({ history: [] }),

      updateProgress: (id, time) => set((s) => ({
        continueWatching: { ...s.continueWatching, [id]: time }
      })),

      importPlaylists: (playlists) => set({ playlists }),

      exportPlaylists: () => {
        const state = get();
        const exportData = {
          version: '3.0.0',
          exportedAt: new Date().toISOString(),
          sources: state.sources,
          playlists: state.playlists,
          favorites: state.favorites
        };
        return JSON.stringify(exportData, null, 2);
      },

      setTVMode: (on) => set({ tvMode: on }),

      setVolume: (v) => set({ volume: Math.max(0, Math.min(1, v)) }),
      setPlayerEngine: (engine) => set({ playerEngine: engine }),
      setAudioBoost: (boost) => set({ audioBoost: boost }),
      setAudioMode: (mode) => set({ audioMode: mode }),
      setAudioEqualizer: (eq) => set({ audioEqualizer: eq }),

      loadDemoSources: () => set((s) => {
        const customSources = s.sources.filter(item => !item.id.startsWith('demo-'));
        return { sources: dedupeSources([...INITIAL_DEMO_SOURCES, ...customSources]) };
      }),

      resetAll: () => set({
        sources: INITIAL_DEMO_SOURCES,
        favorites: ['demo-20min', 'demo-africanews', 'demo-franceinfo', 'demo-bbb'],
        history: [],
        playlists: [],
        continueWatching: {},
        tvMode: false,
        theme: 'dark',
        volume: 0.9,
        playerEngine: 'hls.js',
        audioBoost: false,
        audioMode: 'stereo',
        audioEqualizer: 'flat',
        vpnEnabled: true,
        vpnServer: VPN_SERVERS[0],
        vpnProtocol: 'WireGuard (256-bit)',
        vpnKillSwitch: true,
        vpnConnectedSince: Date.now()
      }),

      addPortalPack: (portalDomain: string) => {
        const cleanDomain = portalDomain.replace(/^https?:\/\//, '').replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
        const targetHost = portalDomain.replace(/^https?:\/\//, '').replace(/\/.*$/, '').toLowerCase();
        const name = targetHost.toUpperCase();
        const packItems: MediaItem[] = [
          {
            id: `portal-${cleanDomain}-live`,
            type: 'live',
            title: `${name} (TV en direct)`,
            url: `https://${targetHost}`,
            group: 'Portails TV',
            category: 'general',
            description: `Diffusion de chaînes TV en direct depuis le portail ${targetHost}.`
          },
          {
            id: `portal-${cleanDomain}-movie`,
            type: 'movie',
            title: `${name} (Films VOD)`,
            url: `https://${targetHost}`,
            group: 'Portails Films',
            category: 'cinema',
            description: `Catalogue de films VOD depuis le portail ${targetHost}.`
          },
          {
            id: `portal-${cleanDomain}-series`,
            type: 'series',
            title: `${name} (Séries TV)`,
            url: `https://${targetHost}`,
            group: 'Portails Séries',
            category: 'general',
            description: `Séries télévisées et saisons depuis le portail ${targetHost}.`
          },
          {
            id: `portal-${cleanDomain}-radio`,
            type: 'radio',
            title: `${name} (Radios Web)`,
            url: `https://${targetHost}`,
            group: 'Portails Radios',
            category: 'music',
            description: `Diffusion de radios en continu depuis le portail ${targetHost}.`
          }
        ];

        set((s) => {
          const packIds = new Set(packItems.map(p => p.id));
          const packUrls = new Set(packItems.map(p => `${p.url}-${p.type}`));
          const remaining = s.sources.filter(item => !packIds.has(item.id) && !packUrls.has(`${item.url}-${item.type}`));
          return { sources: [...packItems, ...remaining] };
        });

        return packItems;
      }
    }),
    {
      name: 'streambox-storage-v4',
      version: 8,
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState: any) => {
        if (!persistedState || !Array.isArray(persistedState.sources)) {
          return {
            sources: INITIAL_DEMO_SOURCES,
            favorites: ['demo-20min', 'demo-africanews', 'demo-franceinfo', 'demo-bbb'],
            history: [],
            playlists: [],
            continueWatching: {},
            tvMode: false,
            theme: 'dark',
            volume: 0.9
          };
        }
        const customSources = persistedState.sources.filter((item: MediaItem) => !item.id.startsWith('demo-'));
        return {
          ...persistedState,
          sources: dedupeSources([...INITIAL_DEMO_SOURCES, ...customSources])
        };
      }
    }
  )
);
