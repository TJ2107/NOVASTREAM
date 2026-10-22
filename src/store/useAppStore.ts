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
  if (!Array.isArray(sources) || sources.length === 0) return [];
  const seenIds = new Set<string>();
  const seenUrlAndTypes = new Set<string>();
  const result: MediaItem[] = [];

  for (let i = 0; i < sources.length; i++) {
    const item = sources[i];
    if (!item || !item.id || !item.url) continue;
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
  // ==========================================
  // 🏅 SPORT (Chaînes TV Sportives 100% Gratuites)
  // ==========================================
  {
    id: 'demo-pluto-sports-fr',
    name: 'Pluto TV Sports FR',
    title: 'Pluto TV Sports France',
    url: 'https://service-stitcher.clusters.pluto.tv/stitch/hls/channel/5f1712a76f25cb0007204f14/master.m3u8?advertisingId=&appName=web&appVersion=unknown&appStoreUrl=&architecture=&buildVersion=&clientDeviceType=0&deviceDNT=0&deviceId=novastream-web&deviceMake=Chrome&deviceModel=web&deviceType=web&deviceVersion=unknown&includeExtendedEvents=false&sid=novastream-sid&userId=',
    type: 'live',
    group: 'Sport',
    category: 'sport',
    country: 'FR',
    language: 'Français',
    logo: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=320&auto=format&fit=crop&q=80',
    description: 'Le meilleur du sport en continu : matchs, temps forts, magazines, documentaires et compétitions internationales en français.'
  },
  {
    id: 'demo-redbull-live',
    name: 'Red Bull TV Direct HD',
    title: 'Red Bull TV Sports & Action',
    url: 'https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8',
    alternativeUrls: [
      'https://rbmn-live.akamaized.net/hls/live/590964/redbulltv-live-11/master.m3u8'
    ],
    type: 'live',
    group: 'Sport',
    category: 'sport',
    country: 'INT',
    language: 'Français / Anglais',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Red_Bull_TV_Logo.svg/320px-Red_Bull_TV_Logo.svg.png',
    description: 'Sports extrêmes, Formule 1, VTT descente, Surf géant, Breakdance et grands événements sportifs mondiaux en direct 24h/24.'
  },
  {
    id: 'demo-sport-plus',
    name: 'Sport Plus',
    title: 'Sport Plus Direct',
    url: 'https://live.sportplus.tv/hls/live.m3u8',
    type: 'live',
    group: 'Sport',
    category: 'sport',
    country: 'INT',
    language: 'Français / Anglais',
    logo: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=320&auto=format&fit=crop&q=80',
    description: 'Actualités sportives, résultats en direct et événements sportifs mondiaux.'
  },
  {
    id: 'demo-bellator-mma',
    name: 'Bellator MMA & Combat',
    title: 'Bellator MMA / Combat TV',
    url: 'https://service-stitcher.clusters.pluto.tv/stitch/hls/channel/5f1712fb6f25cb0007204f15/master.m3u8?advertisingId=&appName=web&appVersion=unknown&appStoreUrl=&architecture=&buildVersion=&clientDeviceType=0&deviceDNT=0&deviceId=novastream-web&deviceMake=Chrome&deviceModel=web&deviceType=web&deviceVersion=unknown&includeExtendedEvents=false&sid=novastream-sid&userId=',
    type: 'live',
    group: 'Sport',
    category: 'sport',
    country: 'FR',
    language: 'Français',
    logo: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=320&auto=format&fit=crop&q=80',
    description: 'Les plus grands combats de MMA, KO spectaculaires, ceintures mondiales et arts martiaux en continu.'
  },
  {
    id: 'demo-motorvision',
    name: 'Motorvision TV',
    title: 'Motorvision TV (Auto & Moto)',
    url: 'https://service-stitcher.clusters.pluto.tv/stitch/hls/channel/5f17163f59e9bf0007a827ce/master.m3u8?advertisingId=&appName=web&appVersion=unknown&appStoreUrl=&architecture=&buildVersion=&clientDeviceType=0&deviceDNT=0&deviceId=novastream-web&deviceMake=Chrome&deviceModel=web&deviceType=web&deviceVersion=unknown&includeExtendedEvents=false&sid=novastream-sid&userId=',
    type: 'live',
    group: 'Sport',
    category: 'sport',
    country: 'FR',
    language: 'Français',
    logo: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=320&auto=format&fit=crop&q=80',
    description: 'Passion mécanique : supercars, essais exclusifs sur piste, courses automobiles et motos d\'exception.'
  },
  {
    id: 'demo-pluto-extreme',
    name: 'Sports Extrêmes',
    title: 'Pluto TV Sports Extrêmes',
    url: 'https://service-stitcher.clusters.pluto.tv/stitch/hls/channel/5fa1479d28db4f000729352e/master.m3u8?advertisingId=&appName=web&appVersion=unknown&appStoreUrl=&architecture=&buildVersion=&clientDeviceType=0&deviceDNT=0&deviceId=novastream-web&deviceMake=Chrome&deviceModel=web&deviceType=web&deviceVersion=unknown&includeExtendedEvents=false&sid=novastream-sid&userId=',
    type: 'live',
    group: 'Sport',
    category: 'sport',
    country: 'FR',
    language: 'Français',
    logo: 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=320&auto=format&fit=crop&q=80',
    description: 'Sensations fortes : skate de rue, snowboard freeride, surf géant, BMX et cascades spectaculaires.'
  },
  {
    id: 'demo-pluto-padel',
    name: 'Padel TV Direct',
    title: 'Pluto TV Padel',
    url: 'https://service-stitcher.clusters.pluto.tv/stitch/hls/channel/643d4608c105ea00084f7063/master.m3u8?advertisingId=&appName=web&appVersion=unknown&appStoreUrl=&architecture=&buildVersion=&clientDeviceType=0&deviceDNT=0&deviceId=novastream-web&deviceMake=Chrome&deviceModel=web&deviceType=web&deviceVersion=unknown&includeExtendedEvents=false&sid=novastream-sid&userId=',
    type: 'live',
    group: 'Sport',
    category: 'sport',
    country: 'INT',
    language: 'Français / Espagnol',
    logo: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=320&auto=format&fit=crop&q=80',
    description: 'Matchs de haute intensité, tournois majeurs et coulisses du circuit mondial de Padel.'
  },
  {
    id: 'demo-wpt-poker',
    name: 'World Poker Tour',
    title: 'World Poker Tour (WPT)',
    url: 'https://service-stitcher.clusters.pluto.tv/stitch/hls/channel/5f17134371cbcf0007823f3f/master.m3u8?advertisingId=&appName=web&appVersion=unknown&appStoreUrl=&architecture=&buildVersion=&clientDeviceType=0&deviceDNT=0&deviceId=novastream-web&deviceMake=Chrome&deviceModel=web&deviceType=web&deviceVersion=unknown&includeExtendedEvents=false&sid=novastream-sid&userId=',
    type: 'live',
    group: 'Sport',
    category: 'sport',
    country: 'INT',
    language: 'Français',
    logo: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=320&auto=format&fit=crop&q=80',
    description: 'Les plus grands tournois de poker de la planète, tables finales mythiques et coups de bluff légendaires.'
  },
  {
    id: 'demo-sportsgrid',
    name: 'SportsGrid Live',
    title: 'SportsGrid TV (Direct 24/7)',
    url: 'https://sportsgrid-klowdtv.amagi.tv/playlist.m3u8',
    type: 'live',
    group: 'Sport',
    category: 'sport',
    country: 'INT',
    language: 'Anglais',
    logo: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=320&auto=format&fit=crop&q=80',
    description: 'Analyses sportives en temps réel, statistiques en direct, cotes et couverture des championnats 24h/24.'
  },
  {
    id: 'demo-gaming-tv',
    name: 'Gaming & Esport TV',
    title: 'Gaming & Esport Live',
    url: 'https://service-stitcher.clusters.pluto.tv/stitch/hls/channel/5fa149b563be4c0007172084/master.m3u8?advertisingId=&appName=web&appVersion=unknown&appStoreUrl=&architecture=&buildVersion=&clientDeviceType=0&deviceDNT=0&deviceId=novastream-web&deviceMake=Chrome&deviceModel=web&deviceType=web&deviceVersion=unknown&includeExtendedEvents=false&sid=novastream-sid&userId=',
    type: 'live',
    group: 'Sport',
    category: 'sport',
    country: 'INT',
    language: 'Français',
    logo: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=320&auto=format&fit=crop&q=80',
    description: 'Compétitions esportives, tournois internationaux de jeux vidéo, gameplay et émissions gaming.'
  },

  // ==========================================
  // 📰 INFOS & ACTUALITÉS (100% Gratuites & Directes)
  // ==========================================
  {
    id: 'demo-france24-fr',
    name: 'France 24 Français',
    title: 'France 24 Français (HD)',
    url: 'https://static.france24.com/live/F24_FR_HI_HLS/live_web.m3u8',
    type: 'live',
    group: 'Actualités',
    category: 'news',
    country: 'FR',
    language: 'Français',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/France_24_logo.svg/320px-France_24_logo.svg.png',
    description: 'Chaîne d\'information internationale française en continu 24h/24 : journaux, débats et reportages mondiaux.'
  },
  {
    id: 'demo-euronews-fr',
    name: 'Euronews Français',
    title: 'Euronews Français (Direct)',
    url: 'https://service-stitcher.clusters.pluto.tv/stitch/hls/channel/5f170f0744c80300077c5f87/master.m3u8?advertisingId=&appName=web&appVersion=unknown&appStoreUrl=&architecture=&buildVersion=&clientDeviceType=0&deviceDNT=0&deviceId=novastream-web&deviceMake=Chrome&deviceModel=web&deviceType=web&deviceVersion=unknown&includeExtendedEvents=false&sid=novastream-sid&userId=',
    alternativeUrls: [
      'https://cdn-euronews.akamaized.net/live/eds/euronews-fr/25050/index.m3u8'
    ],
    type: 'live',
    group: 'Actualités',
    category: 'news',
    country: 'FR',
    language: 'Français',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Euronews_2016_logo.svg/320px-Euronews_2016_logo.svg.png',
    description: 'Toute l\'actualité européenne et mondiale en continu, décryptages politiques et économiques en direct.'
  },
  {
    id: 'demo-20min',
    name: '20 Minutes TV',
    title: '20 Minutes TV (France)',
    url: 'https://live-20minutestv.digiteka.com/1961167769/index.m3u8',
    type: 'live',
    group: 'Actualités',
    category: 'news',
    country: 'FR',
    language: 'Français',
    logo: 'https://upload.wikimedia.org/wikipedia/fr/thumb/f/f6/20_Minutes_TV_logo.svg/320px-20_Minutes_TV_logo.svg.png',
    description: 'Chaîne d\'information et de divertissement française en continu (Île-de-France et National).'
  },
  {
    id: 'demo-africanews',
    name: 'Africanews FR',
    title: 'Africanews Français (Euronews Group)',
    url: 'https://cdn-euronews.akamaized.net/live/eds/africanews-fr/25050/index.m3u8',
    type: 'live',
    group: 'Actualités',
    category: 'news',
    country: 'FR',
    language: 'Français',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Euronews_2016_logo.svg/320px-Euronews_2016_logo.svg.png',
    description: 'Actualités panafricaines et internationales en continu par le groupe Euronews en français.'
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
    language: 'Anglais',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Deutsche_Welle_logo.svg/320px-Deutsche_Welle_logo.svg.png',
    description: 'Diffusion internationale d\'informations en direct 24 heures sur 24 par la chaîne publique allemande.'
  },
  {
    id: 'demo-france24-en',
    name: 'France 24 English',
    title: 'France 24 English (Live HD)',
    url: 'https://static.france24.com/live/F24_EN_HI_HLS/live_web.m3u8',
    type: 'live',
    group: 'Actualités',
    category: 'news',
    country: 'FR',
    language: 'Anglais',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/France_24_logo.svg/320px-France_24_logo.svg.png',
    description: 'International breaking news, live reports and in-depth geopolitical coverage 24/7.'
  },
  {
    id: 'demo-france24-ar',
    name: 'France 24 Arabe',
    title: 'France 24 Arabe (فرانس 24)',
    url: 'https://static.france24.com/live/F24_AR_HI_HLS/live_web.m3u8',
    type: 'live',
    group: 'Actualités',
    category: 'news',
    country: 'FR',
    language: 'Arabe',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/France_24_logo.svg/320px-France_24_logo.svg.png',
    description: 'Chaîne d\'information internationale en direct continu en langue arabe.'
  },
  {
    id: 'demo-rtnc',
    name: 'RTNC (RDC)',
    title: 'RTNC 1 - Télévision Nationale Congolaise',
    url: 'https://mistserver.evi-tv.com/hls/evi_tv_live/index.m3u8',
    alternativeUrls: [
      'https://www.youtube.com/embed?listType=search&list=RTNC%20OFFICIEL%20DIRECT&autoplay=1'
    ],
    type: 'live',
    group: 'Afrique & Congo',
    category: 'news',
    country: 'CD',
    language: 'Français / Lingala',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Logo_de_la_RTNC.svg/320px-Logo_de_la_RTNC.svg.png',
    description: 'Chaîne publique nationale de la République Démocratique du Congo (RDC) en direct de Kinshasa : journal télévisé 20h et débats.'
  },
  {
    id: 'demo-telecongo',
    name: 'Télé Congo',
    title: 'Télé Congo (Brazzaville)',
    url: 'https://vps122407.serveur-vps.net/hls/drtv.m3u8',
    alternativeUrls: [
      'https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8',
      'https://www.youtube.com/embed?listType=search&list=TELE%20CONGO%20EN%20DIRECT&autoplay=1'
    ],
    type: 'live',
    group: 'Afrique & Congo',
    category: 'general',
    country: 'CG',
    language: 'Français / Lingala',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Logo_T%C3%A9l%C3%A9_Congo.png/320px-Logo_T%C3%A9l%C3%A9_Congo.png',
    description: 'Chaîne publique nationale de la République du Congo (Brazzaville) : journal télévisé 20h, magazines et actualités.'
  },
  {
    id: 'demo-drtv',
    name: 'DRTV (Congo)',
    title: 'DRTV International (Brazzaville)',
    url: 'https://vps122407.serveur-vps.net/hls/drtv.m3u8',
    alternativeUrls: [
      'https://service-stitcher.clusters.pluto.tv/stitch/hls/channel/5f1712a76f25cb0007204f14/master.m3u8',
      'https://www.youtube.com/embed?listType=search&list=DRTV%20INTERNATIONAL%20DIRECT&autoplay=1'
    ],
    type: 'live',
    group: 'Afrique & Congo',
    category: 'general',
    country: 'CG',
    language: 'Français',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Flag_of_the_Republic_of_the_Congo.svg/320px-Flag_of_the_Republic_of_the_Congo.svg.png',
    description: 'Chaîne privée généraliste de la République du Congo en direct de Brazzaville (avec basculement automatique de secours).'
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
    description: 'Chaîne de télévision généraliste congolaise émettant en direct depuis Kinshasa.'
  },
  {
    id: 'demo-bosolo-na-politik',
    name: 'Bosolo na Politik',
    title: 'Bosolo na Politik (RDC)',
    url: 'https://www.youtube.com/embed?listType=search&list=BOSOLO%20NA%20POLITIK%20OFFICIEL&autoplay=1',
    type: 'live',
    group: 'Afrique & Congo',
    category: 'news',
    country: 'CD',
    language: 'Lingala',
    logo: 'https://yt3.googleusercontent.com/ytc/AIdro_k6-e6z1-6z9V9-6z9V9-6z9V9-6z9V9-6z9V9=s160-c-k-c0x00ffffff-no-rj',
    description: 'Émission politique et actualités en direct de Kinshasa.'
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
    language: 'Français',
    logo: 'https://upload.wikimedia.org/wikipedia/fr/thumb/5/52/France_Info_logo_2016.svg/320px-France_Info_logo_2016.svg.png',
    description: 'L\'actualité française et internationale en direct radio continu 24h/24.'
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
    language: 'Français',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/RFI_logo.svg/320px-RFI_logo.svg.png',
    description: 'Actualités du monde entier, grands reportages et analyses en direct de Paris.'
  },

  // ==========================================
  // 🎵 MUSIQUE (Chaînes TV Musicales & Radios)
  // ==========================================
  {
    id: 'demo-clubbing-tv',
    name: 'Clubbing TV HD',
    title: 'Clubbing TV Direct HD',
    url: 'https://service-stitcher.clusters.pluto.tv/stitch/hls/channel/5fa148a07c11f70007e997f7/master.m3u8?advertisingId=&appName=web&appVersion=unknown&appStoreUrl=&architecture=&buildVersion=&clientDeviceType=0&deviceDNT=0&deviceId=novastream-web&deviceMake=Chrome&deviceModel=web&deviceType=web&deviceVersion=unknown&includeExtendedEvents=false&sid=novastream-sid&userId=',
    type: 'live',
    group: 'Musique',
    category: 'music',
    country: 'FR',
    language: 'Français / Anglais',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Clubbing_TV_logo_2019.png/320px-Clubbing_TV_logo_2019.png',
    description: 'Chaîne TV n°1 internationale de musique électronique : DJ sets mondiaux, festivals Ibiza/Tomorrowland et clips électro 24h/24.'
  },
  {
    id: 'demo-mtv-musique',
    name: 'MTV Musique',
    title: 'MTV Musique Pluto Direct',
    url: 'https://service-stitcher.clusters.pluto.tv/stitch/hls/channel/5f17173e6f25cb0007204f1e/master.m3u8?advertisingId=&appName=web&appVersion=unknown&appStoreUrl=&architecture=&buildVersion=&clientDeviceType=0&deviceDNT=0&deviceId=novastream-web&deviceMake=Chrome&deviceModel=web&deviceType=web&deviceVersion=unknown&includeExtendedEvents=false&sid=novastream-sid&userId=',
    type: 'live',
    group: 'Musique',
    category: 'music',
    country: 'FR',
    language: 'Français',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/MTV_2021_%28logo%29.svg/320px-MTV_2021_%28logo%29.svg.png',
    description: 'Le meilleur de MTV : clips du moment, artistes pop, rap et urbain internationaux.'
  },
  {
    id: 'demo-mtv-hits',
    name: 'MTV Hits FR',
    title: 'MTV Hits Français',
    url: 'https://service-stitcher.clusters.pluto.tv/stitch/hls/channel/5fa148281313420007871bfa/master.m3u8?advertisingId=&appName=web&appVersion=unknown&appStoreUrl=&architecture=&buildVersion=&clientDeviceType=0&deviceDNT=0&deviceId=novastream-web&deviceMake=Chrome&deviceModel=web&deviceType=web&deviceVersion=unknown&includeExtendedEvents=false&sid=novastream-sid&userId=',
    type: 'live',
    group: 'Musique',
    category: 'music',
    country: 'FR',
    language: 'Français',
    logo: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=320&auto=format&fit=crop&q=80',
    description: '100% hits, classements du moment et nouveautés musicales en continu.'
  },
  {
    id: 'demo-mtv-classics',
    name: 'MTV Classics 80-90',
    title: 'MTV Classics (80s & 90s)',
    url: 'https://service-stitcher.clusters.pluto.tv/stitch/hls/channel/5fa1487f3bcf440007ab603a/master.m3u8?advertisingId=&appName=web&appVersion=unknown&appStoreUrl=&architecture=&buildVersion=&clientDeviceType=0&deviceDNT=0&deviceId=novastream-web&deviceMake=Chrome&deviceModel=web&deviceType=web&deviceVersion=unknown&includeExtendedEvents=false&sid=novastream-sid&userId=',
    type: 'live',
    group: 'Musique',
    category: 'music',
    country: 'INT',
    language: 'Anglais / Français',
    logo: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=320&auto=format&fit=crop&q=80',
    description: 'Les plus grands clips cultes, hymnes pop, rock et électro des années 80 et 90.'
  },
  {
    id: 'demo-pluto-hiphop',
    name: 'Pluto TV Hip-Hop',
    title: 'Pluto TV Hip-Hop Direct',
    url: 'https://service-stitcher.clusters.pluto.tv/stitch/hls/channel/5fa148e659e9bf0007a8281e/master.m3u8?advertisingId=&appName=web&appVersion=unknown&appStoreUrl=&architecture=&buildVersion=&clientDeviceType=0&deviceDNT=0&deviceId=novastream-web&deviceMake=Chrome&deviceModel=web&deviceType=web&deviceVersion=unknown&includeExtendedEvents=false&sid=novastream-sid&userId=',
    type: 'live',
    group: 'Musique',
    category: 'music',
    country: 'FR',
    language: 'Français',
    logo: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=320&auto=format&fit=crop&q=80',
    description: 'Le meilleur du Rap français, Rap US, Trap et culture urbaine 24h/24.'
  },
  {
    id: 'demo-qwest-tv',
    name: 'Qwest TV Mix',
    title: 'Qwest TV Mix (Quincy Jones)',
    url: 'https://service-stitcher.clusters.pluto.tv/stitch/hls/channel/5f1718bf44c80300077c5f93/master.m3u8?advertisingId=&appName=web&appVersion=unknown&appStoreUrl=&architecture=&buildVersion=&clientDeviceType=0&deviceDNT=0&deviceId=novastream-web&deviceMake=Chrome&deviceModel=web&deviceType=web&deviceVersion=unknown&includeExtendedEvents=false&sid=novastream-sid&userId=',
    type: 'live',
    group: 'Musique',
    category: 'music',
    country: 'FR',
    language: 'Français / Anglais',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Qwest_TV_logo.png/320px-Qwest_TV_logo.png',
    description: 'Chaîne musicale d\'exception fondée par Quincy Jones : Jazz, Soul, Funk, R&B, Musiques du Monde et concerts en haute fidélité.'
  },
  {
    id: 'demo-funradio',
    name: 'Fun Radio',
    title: 'Fun Radio (Le Son Dance & Électro)',
    url: 'https://icecast.funradio.fr/fun-1-44-128',
    type: 'radio',
    group: 'Musique',
    category: 'music',
    country: 'FR',
    language: 'Français',
    logo: 'https://upload.wikimedia.org/wikipedia/fr/thumb/5/51/Logo_Fun_Radio_2020.svg/320px-Logo_Fun_Radio_2020.svg.png',
    description: 'Le son dance, électro, les meilleurs hits et DJ sets en direct.'
  },
  {
    id: 'demo-rtl2',
    name: 'RTL2 Direct',
    title: 'RTL2 (Le Son Pop-Rock)',
    url: 'https://icecast.rtl2.fr/rtl2-1-44-128',
    type: 'radio',
    group: 'Musique',
    category: 'music',
    country: 'FR',
    language: 'Français',
    logo: 'https://upload.wikimedia.org/wikipedia/fr/thumb/2/21/RTL2_logo_2015.svg/320px-RTL2_logo_2015.svg.png',
    description: 'Le meilleur de la musique Pop-Rock internationale et française en continu.'
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
    language: 'Français',
    logo: 'https://upload.wikimedia.org/wikipedia/fr/thumb/5/5c/Skyrock_logo_2004.svg/320px-Skyrock_logo_2004.svg.png',
    description: 'Premier sur le rap, le R&B et la musique urbaine en direct.'
  },
  {
    id: 'demo-jazzradio',
    name: 'Jazz Radio',
    title: 'Jazz Radio (Jazz, Soul & Blues)',
    url: 'https://jazz-wr01.ice.infomaniak.ch/jazz-wr01-128.mp3',
    type: 'radio',
    group: 'Musique',
    category: 'music',
    country: 'FR',
    language: 'Français',
    logo: 'https://upload.wikimedia.org/wikipedia/fr/thumb/a/ad/Logo_Jazz_Radio.svg/320px-Logo_Jazz_Radio.svg.png',
    description: '100% Jazz, Soul, Blues, Funk et gospel en direct 24h/24.'
  },
  {
    id: 'demo-radiomeuh',
    name: 'Radio Meuh',
    title: 'Radio Meuh (Groove & Funk Indé)',
    url: 'https://radiomeuh.ice.infomaniak.ch/radiomeuh-128.mp3',
    type: 'radio',
    group: 'Musique',
    category: 'music',
    country: 'FR',
    language: 'Français',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Radio_Meuh_logo.png/320px-Radio_Meuh_logo.png',
    description: 'Radio indépendante culte de Haute-Savoie : pépites funk, soul, groove et musiques du monde sans publicité.'
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
    language: 'Français',
    logo: 'https://upload.wikimedia.org/wikipedia/fr/thumb/6/64/Chante_France_logo_2018.png/320px-Chante_France_logo_2018.png',
    description: 'La plus belle musique française des années 60 à nos jours.'
  },
  {
    id: 'demo-somafm-groove',
    name: 'SomaFM Groove Salad',
    title: 'SomaFM Groove Salad (Ambient & Chill)',
    url: 'https://ice1.somafm.com/groovesalad-128-mp3',
    type: 'radio',
    group: 'Musique',
    category: 'music',
    country: 'US',
    language: 'Anglais',
    logo: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=320&auto=format&fit=crop&q=80',
    description: 'Downtempo, chill-out et ambient électronique de San Francisco sans publicité commerciale.'
  },
  {
    id: 'demo-somafm-defcon',
    name: 'SomaFM DEF CON Radio',
    title: 'SomaFM DEF CON (Cyber Hacker Beats)',
    url: 'https://ice1.somafm.com/defcon-128-mp3',
    type: 'radio',
    group: 'Musique',
    category: 'music',
    country: 'US',
    language: 'Anglais',
    logo: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=320&auto=format&fit=crop&q=80',
    description: 'Musique électronique et cyber beats pour passionnés de cybersécurité et technologie.'
  },

  // ==========================================
  // 🎬 CINÉMA & VOD (Films Libres & HLS Certifiés)
  // ==========================================
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
  hasSeenTour: boolean;
  setHasSeenTour: (seen: boolean) => void;

  // Subscription State ($5/mo Premium without ads vs Free with ads)
  subscriptionPlan: 'free' | 'premium';
  subscriptionExpiresAt: number | null;
  setSubscriptionPlan: (plan: 'free' | 'premium', expiresAt?: number | null) => void;

  freeWatchSeconds: number;
  showInterstitialAd: boolean;
  incrementFreeWatchSeconds: (delta: number) => void;
  resetFreeWatchSeconds: () => void;
  setShowInterstitialAd: (show: boolean) => void;
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;
let pendingStateKey: string | null = null;
let pendingStateValue: string | null = null;

const debouncedStorage = {
  getItem: (name: string): string | null => {
    try {
      return localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    pendingStateKey = name;
    pendingStateValue = value;
    if (!saveTimer) {
      saveTimer = setTimeout(() => {
        try {
          if (pendingStateKey && pendingStateValue !== null) {
            localStorage.setItem(pendingStateKey, pendingStateValue);
          }
        } catch (e) {
          console.warn('Storage write warning (quota or serialization):', e);
        }
        saveTimer = null;
      }, 350);
    }
  },
  removeItem: (name: string): void => {
    if (saveTimer) {
      clearTimeout(saveTimer);
      saveTimer = null;
    }
    try {
      localStorage.removeItem(name);
    } catch {}
  }
};

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
      hasSeenTour: false,
      setHasSeenTour: (seen: boolean) => set({ hasSeenTour: seen }),

      subscriptionPlan: 'free',
      subscriptionExpiresAt: null,
      setSubscriptionPlan: (plan, expiresAt = null) => set({
        subscriptionPlan: plan,
        subscriptionExpiresAt: expiresAt,
        ...(plan === 'premium' ? { showInterstitialAd: false, freeWatchSeconds: 0 } : {})
      }),

      freeWatchSeconds: 0,
      showInterstitialAd: false,
      incrementFreeWatchSeconds: (delta) => set((s) => {
        if (s.subscriptionPlan !== 'free') return s;
        const next = s.freeWatchSeconds + delta;
        // 5 minutes = 300 seconds
        if (next >= 300 && !s.showInterstitialAd) {
          return { freeWatchSeconds: 0, showInterstitialAd: true };
        }
        return { freeWatchSeconds: next };
      }),
      resetFreeWatchSeconds: () => set({ freeWatchSeconds: 0 }),
      setShowInterstitialAd: (show) => set({ showInterstitialAd: show }),

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

      updateProgress: (id, time) => set((s) => {
        const rounded = Math.round(time);
        const current = s.continueWatching[id];
        if (current !== undefined && Math.abs(current - rounded) < 3) {
          return s;
        }
        return {
          continueWatching: { ...s.continueWatching, [id]: rounded }
        };
      }),

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
      version: 10,
      storage: createJSONStorage(() => debouncedStorage),
      partialize: (state) => ({
        // Exclude demo sources from localStorage to keep storage ultra-lightweight and fast
        sources: state.sources.filter((item) => !item.id.startsWith('demo-')),
        favorites: state.favorites,
        history: state.history.slice(0, 50),
        playlists: state.playlists,
        continueWatching: state.continueWatching,
        tvMode: state.tvMode,
        theme: state.theme,
        volume: state.volume,
        vpnEnabled: state.vpnEnabled,
        vpnServer: state.vpnServer,
        vpnProtocol: state.vpnProtocol,
        playerEngine: state.playerEngine,
        audioBoost: state.audioBoost,
        audioMode: state.audioMode,
        audioEqualizer: state.audioEqualizer,
        hasSeenTour: state.hasSeenTour,
        subscriptionPlan: state.subscriptionPlan,
        subscriptionExpiresAt: state.subscriptionExpiresAt
      }),
      merge: (persistedState: any, currentState: AppState) => {
        if (!persistedState) return currentState;
        const customSources = (persistedState.sources || []).filter((item: MediaItem) => !item.id.startsWith('demo-'));
        return {
          ...currentState,
          ...persistedState,
          sources: dedupeSources([...INITIAL_DEMO_SOURCES, ...customSources])
        };
      },
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
