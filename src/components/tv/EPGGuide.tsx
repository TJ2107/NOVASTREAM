import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  Play,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Info,
  Tv,
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  X
} from 'lucide-react';
import { type MediaItem } from '../../store/useAppStore';

interface EPGProgram {
  id: string;
  channelId: string;
  title: string;
  category: string;
  start: Date;
  end: Date;
  synopsis: string;
  rating?: string;
}

interface EPGGuideProps {
  channels: MediaItem[];
  onSelectChannel: (channel: MediaItem) => void;
}

// Generate realistic daily schedules aligned with current date & time
function generateProgramsForChannel(channel: MediaItem, baseDate: Date): EPGProgram[] {
  const isRtnc = channel.id.includes('rtnc') || channel.title.toLowerCase().includes('rtnc');
  const isTeleCongo = channel.id.includes('telecongo') || channel.title.toLowerCase().includes('télé congo') || channel.title.toLowerCase().includes('tele congo');
  const isNews = channel.category === 'news' || channel.group?.toLowerCase().includes('actu');
  const isSport = channel.category === 'sport' || channel.group?.toLowerCase().includes('sport');
  const isCinema = channel.category === 'cinema' || channel.group?.toLowerCase().includes('ciné');

  const programsTemplate = isRtnc
    ? [
        { title: 'Matinale RTNC : Kinshasa Réveil', durationMin: 180, category: 'Information', synopsis: 'Actualités nationales de la RDC, météo, revue des journaux kinois et invités en direct de Kinshasa.' },
        { title: 'Journal Télévisé en Langues Nationales', durationMin: 120, category: 'Journal', synopsis: 'Édition spéciale d\'informations en Lingala, Swahili, Kikongo et Tshiluba.' },
        { title: 'Le Grand Journal de 13 Heures', durationMin: 90, category: 'Journal', synopsis: 'Le tour complet de l\'actualité politique, économique et provinciale en RDC.' },
        { title: 'Karibu Variétés & Culture Congolaise', durationMin: 150, category: 'Culture', synopsis: 'Musique congolaise, découverte des talents, artistes et patrimoine culturel des provinces.' },
        { title: 'Débat Citoyen & Institutions', durationMin: 120, category: 'Politique', synopsis: 'Analyses des grands dossiers de la République et interventions d\'experts.' },
        { title: 'Le Grand Journal Télévisé de 20h', durationMin: 60, category: 'Journal', synopsis: 'La grande édition nationale d\'information présentée en direct depuis la Cité de la Voix du Peuple.' },
        { title: 'Émission Spéciale & Grand Forum', durationMin: 120, category: 'Talk-Show', synopsis: 'Entretiens exclusifs, dossiers parlementaires et développement économique.' },
        { title: 'Nuit Congolaise & Rumba Nostalgie', durationMin: 360, category: 'Divertissement', synopsis: 'Concerts d\'anthologie des grands maîtres de la rumba et rediffusions des grands magazines.' }
      ]
    : isTeleCongo
    ? [
        { title: 'Brazzaville Matin & Réveil du Congo', durationMin: 180, category: 'Matinale', synopsis: 'Actualités du matin en République du Congo, revue de la presse brazzavilloise et météo.' },
        { title: 'Journal Télévisé en Langues (Kituba & Lingala)', durationMin: 120, category: 'Information', synopsis: 'Flashs d\'information et reportages de proximité dans les départements.' },
        { title: 'Le Journal de 13 Heures Télé Congo', durationMin: 90, category: 'Journal', synopsis: 'Toute l\'actualité nationale et internationale en direct du plateau de Télé Congo.' },
        { title: 'Congo Terre d\'Avenir & Écologie', durationMin: 150, category: 'Magazine', synopsis: 'Protection du Bassin du Congo, agriculture et développement durable.' },
        { title: 'Magazine des Arts & Rumba Congolaise', durationMin: 120, category: 'Culture', synopsis: 'Rencontres avec les orchestres et artistes de Brazzaville et Pointe-Noire.' },
        { title: 'Le Journal Télévisé de 20 Heures', durationMin: 60, category: 'Journal', synopsis: 'L\'édition reine de l\'information de la République du Congo en direct.' },
        { title: 'La Grande Soirée de Télé Congo', durationMin: 120, category: 'Société', synopsis: 'Grand format d\'investigation et débat en direct avec les acteurs congolais.' },
        { title: 'Télé Congo Nuit & Archives Historiques', durationMin: 360, category: 'Archives', synopsis: 'Rétrospectives des grandes heures de la télévision congolaise et musique douce.' }
      ]
    : isNews
    ? [
        { title: 'La Matinale Info Direct', durationMin: 180, category: 'Information', synopsis: 'Le tour complet des actualités du matin, météo, revue de presse et invités en direct.' },
        { title: 'L\'Édition de 09h : En Direct', durationMin: 120, category: 'Économie & Monde', synopsis: 'Analyse des marchés et dossiers internationaux avec nos correspondants.' },
        { title: 'Le Grand Journal de Midi', durationMin: 90, category: 'Journal', synopsis: 'Toute l\'actualité nationale et internationale en direct avec reportages exclusifs.' },
        { title: 'Grand Reportage & Débat', durationMin: 150, category: 'Magazine', synopsis: 'Immersion au cœur des enjeux géopolitiques et sociétaux contemporains.' },
        { title: 'Focus 18h : L\'Heure des Experts', durationMin: 120, category: 'Débat', synopsis: 'Débats contradictoires et décryptage des événements majeurs de la journée.' },
        { title: 'Le Journal de 20 Heures', durationMin: 60, category: 'Journal', synopsis: 'La grande session d\'information du soir présentée en direct.' },
        { title: 'Le Grand Débat du Soir', durationMin: 120, category: 'Talk-Show', synopsis: 'Invités politiques, intellectuels et acteurs du monde culturel.' },
        { title: 'Nuit de l\'Info & Rediffusion', durationMin: 240, category: 'Continu', synopsis: 'Rétrospective des temps forts de la journée et flashs d\'information nocturnes.' },
        { title: 'L\'Aurore : Premières Nouvelles', durationMin: 120, category: 'Matinale', synopsis: 'Réveil en information pour les lève-tôt.' }
      ]
    : isSport
    ? [
        { title: 'Sport Matin : Rétrospective', durationMin: 180, category: 'Mag Sport', synopsis: 'Résultats de la nuit, classements mondiaux et résumé des grandes compétitions.' },
        { title: 'Direct : Entraînements & Essais', durationMin: 120, category: 'Direct', synopsis: 'Suivi exclusif des séances d\'entraînement et qualifications.' },
        { title: 'Le Club Omnisports', durationMin: 90, category: 'Magazine', synopsis: 'Focus sur les disciplines extrêmes, sports mécaniques et athlétisme.' },
        { title: 'Grand Format : Champions du Monde', durationMin: 150, category: 'Documentaire', synopsis: 'Portraits intimes des plus grands athlètes de l\'histoire contemporaine.' },
        { title: 'Avant-Match & Palettes Tactiques', durationMin: 120, category: 'Analyses', synopsis: 'Décryptage tactique et interviews d\'avant-rencontre par nos consultants.' },
        { title: 'Le Grand Live Omnisports', durationMin: 120, category: 'Direct', synopsis: 'Diffusion en haute définition des rencontres du jour.' },
        { title: 'L\'After Sport : Débrief & Conférences', durationMin: 120, category: 'Débrief', synopsis: 'Réactions à chaud, conférences de presse et analyses des scores.' },
        { title: 'Nuit Sportive : Grands Moments', durationMin: 300, category: 'Archives', synopsis: 'Les matchs mythiques et records légendaires en rediffusion intégrale.' }
      ]
    : isCinema
    ? [
        { title: 'Courts-Métrages d\'Auteur', durationMin: 120, category: 'Cinéma', synopsis: 'Sélection des pépites primées dans les festivals internationaux.' },
        { title: 'Ciné-Club Classique', durationMin: 150, category: 'Rétro', synopsis: 'Les chefs-d\'œuvre intemporels du 7ème art restaurés en haute définition.' },
        { title: 'Dans les Coulisses d\'Hollywood', durationMin: 90, category: 'Making-of', synopsis: 'Secrets de tournage, effets spéciaux et interviews des réalisateurs cultes.' },
        { title: 'Film Jeunesse & Animation', durationMin: 120, category: 'Animation', synopsis: 'Univers fantastiques et aventures animées pour toute la famille.' },
        { title: 'Thriller d\'Après-Midi', durationMin: 120, category: 'Suspense', synopsis: 'Intrigues policières et enquêtes haletantes.' },
        { title: 'Le Grand Film du Soir (Prime)', durationMin: 140, category: 'Long-métrage', synopsis: 'Blockbuster ou film primé inédit diffusé en version masterisée.' },
        { title: 'Cinéma de Minuit : Frissons', durationMin: 120, category: 'Horreur / SF', synopsis: 'Séance nocturne dédiée aux amateurs de sensations fortes et de science-fiction.' },
        { title: 'Nuit Indie & Films Expérimentaux', durationMin: 340, category: 'Indépendant', synopsis: 'Créations audacieuses et avant-garde cinématographique.' }
      ]
    : [
        { title: 'Éveil Découverte & Nature', durationMin: 180, category: 'Documentaire', synopsis: 'Exploration des plus beaux sanctuaires naturels de la planète.' },
        { title: 'Tendances & Innovations', durationMin: 120, category: 'Technologie', synopsis: 'Les nouvelles technologies qui transforment notre quotidien.' },
        { title: 'Midi Magazine : Cuisine & Terroir', durationMin: 90, category: 'Art de vivre', synopsis: 'Voyage gastronomique à la rencontre des producteurs locaux.' },
        { title: 'Odyssée des Civilisations', durationMin: 150, category: 'Histoire', synopsis: 'Reconstitution des grands empires et fouilles archéologiques majeures.' },
        { title: 'Planète Sciences', durationMin: 120, category: 'Science', synopsis: 'Les mystères de l\'univers et explorations spatiales récentes.' },
        { title: 'La Grande Soirée Documentaire', durationMin: 120, category: 'Prime', synopsis: 'Investigation approfondie sur les grands défis du XXIe siècle.' },
        { title: 'Culture & Musiques du Monde', durationMin: 120, category: 'Concert', synopsis: 'Captations de concerts symphoniques et festivals du monde.' },
        { title: 'Nuit Zen : Sons de la Nature', durationMin: 300, category: 'Ambiance', synopsis: 'Paysages contemplatifs 4K et ambiance sonore relaxante.' }
      ];

  const programs: EPGProgram[] = [];
  const startOfDay = new Date(baseDate);
  startOfDay.setHours(6, 0, 0, 0); // Start program day at 06:00

  let currentCursor = new Date(startOfDay);

  programsTemplate.forEach((tmpl, idx) => {
    const end = new Date(currentCursor.getTime() + tmpl.durationMin * 60 * 1000);
    programs.push({
      id: `${channel.id}-prog-${idx}`,
      channelId: channel.id,
      title: tmpl.title,
      category: tmpl.category,
      start: new Date(currentCursor),
      end,
      synopsis: tmpl.synopsis
    });
    currentCursor = end;
  });

  return programs;
}

export function EPGGuide({ channels, onSelectChannel }: EPGGuideProps) {
  const navigate = useNavigate();
  const [now, setNow] = useState(new Date());
  const [search, setSearch] = useState('');
  const [selectedProgram, setSelectedProgram] = useState<EPGProgram | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('Tous');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const PAGE_SIZE = 25;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Update clock every 30 seconds for live progress tracking
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  // Filter channels
  const filteredChannels = useMemo(() => {
    return channels.filter((c) => {
      const matchSearch =
        !search.trim() ||
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        (c.group && c.group.toLowerCase().includes(search.toLowerCase()));
      const matchCat =
        selectedCategory === 'Tous' ||
        (c.group && c.group.toLowerCase().includes(selectedCategory.toLowerCase())) ||
        (c.category && c.category.toLowerCase().includes(selectedCategory.toLowerCase()));
      return matchSearch && matchCat;
    });
  }, [channels, search, selectedCategory]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [search, selectedCategory]);

  const displayedChannels = useMemo(() => {
    return filteredChannels.slice(0, visibleCount);
  }, [filteredChannels, visibleCount]);

  // Generate programs dictionary for displayed channels only (stabilized by day date)
  const todayDay = now.toDateString();
  const channelPrograms = useMemo(() => {
    const dict: Record<string, EPGProgram[]> = {};
    displayedChannels.forEach((chan) => {
      dict[chan.id] = generateProgramsForChannel(chan, now);
    });
    return dict;
  }, [displayedChannels, todayDay]);

  // Hours list for the header (e.g. 06h to 02h)
  const hours = useMemo(() => {
    const list: string[] = [];
    for (let h = 6; h <= 28; h++) {
      const displayHour = h % 24;
      list.push(`${displayHour < 10 ? '0' : ''}${displayHour}:00`);
    }
    return list;
  }, []);

  // Pixels per minute scaling for the timeline grid
  const PIXELS_PER_MINUTE = 4; // 240px per hour
  const gridStartHour = 6;

  // Real-time timeline indicator X coordinate
  const currentIndicatorOffset = useMemo(() => {
    const currentMinutesFromStart =
      (now.getHours() < gridStartHour ? now.getHours() + 24 : now.getHours()) * 60 +
      now.getMinutes() -
      gridStartHour * 60;
    return Math.max(0, currentMinutesFromStart * PIXELS_PER_MINUTE);
  }, [now]);

  // Center timeline on current hour on initial load
  useEffect(() => {
    if (scrollContainerRef.current) {
      const targetScroll = Math.max(0, currentIndicatorOffset - 300);
      scrollContainerRef.current.scrollTo({ left: targetScroll, behavior: 'smooth' });
    }
  }, [currentIndicatorOffset]);

  const formatHourMin = (date: Date) => {
    const h = date.getHours();
    const m = date.getMinutes();
    return `${h < 10 ? '0' : ''}${h}:${m < 10 ? '0' : ''}${m}`;
  };

  return (
    <div className="space-y-4 select-none">
      {/* Top Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl glass-strong border border-white/[0.08]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#E50914] flex items-center justify-center shadow-lg accent-glow flex-shrink-0">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-black text-lg md:text-xl text-white tracking-tight">Guide TV en direct (EPG)</h2>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#E50914]/20 text-[#E50914] border border-[#E50914]/40">
                TEMPS RÉEL
              </span>
            </div>
            <p className="text-xs text-[#A1A1A6]">
              Horaires, résumés et progression en continu des programmes de vos chaînes.
            </p>
          </div>
        </div>

        {/* Current Time Clock & Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="px-3.5 py-1.5 rounded-xl bg-black/60 border border-white/10 font-mono text-xs flex items-center gap-2 text-white shadow-inner">
            <span className="w-2 h-2 rounded-full bg-[#E50914] animate-ping" />
            <span className="text-[#A1A1A6]">Heure actuelle :</span>
            <span className="font-bold text-white text-sm">{formatHourMin(now)}</span>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filtrer chaîne ou émission..."
              className="pl-8 pr-3 py-1.5 rounded-xl bg-black/50 border border-white/10 text-xs text-white placeholder-white/30 focus:border-[#E50914] outline-none"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-black/50 border border-white/10 text-xs text-white focus:border-[#E50914] outline-none cursor-pointer"
          >
            <option value="Tous">Toutes catégories</option>
            <option value="Actualités">Actualités</option>
            <option value="Sport">Sport</option>
            <option value="Cinéma">Cinéma</option>
            <option value="Documentaire">Documentaire</option>
          </select>
        </div>
      </div>

      {/* Main EPG Timeline Grid View */}
      <div className="rounded-2xl glass-strong border border-white/[0.08] overflow-hidden shadow-2xl relative">
        <div className="flex">
          {/* Left Column: Fixed Channel Logos & Headers */}
          <div className="w-48 md:w-56 flex-shrink-0 border-r border-white/10 bg-black/80 z-20 shadow-xl">
            {/* Corner header */}
            <div className="h-12 px-3 flex items-center gap-2 border-b border-white/10 text-xs font-mono font-bold text-white/50 bg-black/90">
              <Tv className="w-3.5 h-3.5 text-[#E50914]" />
              <span>CHAÎNES ({displayedChannels.length} / {filteredChannels.length})</span>
            </div>

            {/* Channels List column */}
            <div className="divide-y divide-white/5">
              {displayedChannels.map((channel, idx) => (
                <div
                  key={channel.id}
                  onClick={() => onSelectChannel(channel)}
                  className="h-20 px-3 flex items-center gap-3 hover:bg-white/[0.05] transition-all cursor-pointer group"
                >
                  <span className="font-mono text-[10px] text-white/40 w-4 text-center">{idx + 1}</span>
                  <div className="w-10 h-10 rounded-lg glass flex items-center justify-center p-1 flex-shrink-0 bg-white/5 group-hover:border-[#E50914]/40 transition-colors">
                    {channel.logo ? (
                      <img src={channel.logo} alt="" className="w-full h-full object-contain" />
                    ) : (
                      <Tv className="w-5 h-5 text-white/60" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="font-semibold text-xs text-white block truncate group-hover:text-[#E50914] transition-colors">
                      {channel.title}
                    </span>
                    <span className="text-[10px] text-white/40 block truncate">
                      {channel.group || 'Direct TV'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Area: Horizontally Scrollable Timeline Schedule */}
          <div ref={scrollContainerRef} className="flex-1 overflow-x-auto relative scrollbar-thin">
            {/* Hours Header Row */}
            <div className="h-12 border-b border-white/10 bg-black/60 sticky top-0 flex items-center relative z-10 min-w-max">
              {hours.map((hr, idx) => (
                <div
                  key={idx}
                  style={{ width: `${60 * PIXELS_PER_MINUTE}px` }}
                  className="px-2 text-xs font-mono font-bold text-white/60 border-l border-white/5 flex items-center justify-between"
                >
                  <span>{hr}</span>
                  <span className="text-[10px] text-white/20 font-normal">:30</span>
                </div>
              ))}
            </div>

            {/* Real-Time Red Vertical Marker */}
            <div
              style={{ left: `${currentIndicatorOffset}px` }}
              className="absolute top-0 bottom-0 w-0.5 bg-[#E50914] z-30 pointer-events-none shadow-[0_0_12px_#E50914]"
            >
              <div className="sticky top-1 -ml-9 px-2 py-0.5 rounded-full bg-[#E50914] text-white text-[10px] font-mono font-bold shadow-lg flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" />
                <span>{formatHourMin(now)}</span>
              </div>
            </div>

            {/* Schedule Rows per Channel */}
            <div className="divide-y divide-white/5 min-w-max">
              {displayedChannels.map((channel) => {
                const progs = channelPrograms[channel.id] || [];
                return (
                  <div key={channel.id} className="h-20 flex items-center relative py-1.5">
                    {progs.map((prog) => {
                      // Calculate offset and width in pixels
                      const progStartMinutes =
                        (prog.start.getHours() < gridStartHour ? prog.start.getHours() + 24 : prog.start.getHours()) * 60 +
                        prog.start.getMinutes() -
                        gridStartHour * 60;
                      const durationMinutes = (prog.end.getTime() - prog.start.getTime()) / (60 * 1000);

                      const leftPx = Math.max(0, progStartMinutes * PIXELS_PER_MINUTE);
                      const widthPx = Math.max(80, durationMinutes * PIXELS_PER_MINUTE - 4);

                      const isLiveNow = now >= prog.start && now < prog.end;
                      const progressPercent = isLiveNow
                        ? Math.min(100, Math.max(0, ((now.getTime() - prog.start.getTime()) / (prog.end.getTime() - prog.start.getTime())) * 100))
                        : 0;

                      return (
                        <div
                          key={prog.id}
                          style={{
                            left: `${leftPx}px`,
                            width: `${widthPx}px`,
                            position: 'absolute'
                          }}
                          onClick={() => setSelectedProgram(prog)}
                          className={`h-16 rounded-xl p-2.5 flex flex-col justify-between transition-all cursor-pointer border select-none ${
                            isLiveNow
                              ? 'bg-gradient-to-r from-red-950/60 to-black/70 border-[#E50914]/60 text-white shadow-lg shadow-red-950/40 hover:border-[#E50914]'
                              : 'bg-white/[0.03] hover:bg-white/[0.08] border-white/5 text-white/80 hover:text-white'
                          }`}
                        >
                          {/* Program title and live badge */}
                          <div className="flex items-start justify-between gap-1.5 min-w-0">
                            <span className="font-bold text-xs truncate leading-snug">
                              {prog.title}
                            </span>
                            {isLiveNow && (
                              <span className="flex-shrink-0 text-[9px] font-mono font-black px-1.5 py-0.2 rounded bg-[#E50914] text-white">
                                DIRECT
                              </span>
                            )}
                          </div>

                          {/* Hours and Live progress bar */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[10px] text-white/50 font-mono">
                              <span>{formatHourMin(prog.start)} - {formatHourMin(prog.end)}</span>
                              <span className="text-[9px] truncate max-w-[80px] text-white/40">{prog.category}</span>
                            </div>

                            {isLiveNow && (
                              <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-[#E50914] rounded-full transition-all duration-1000 shadow-[0_0_6px_#E50914]"
                                  style={{ width: `${progressPercent}%` }}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Load More EPG Channels Button */}
        {visibleCount < filteredChannels.length && (
          <div className="p-4 text-center border-t border-white/10 bg-black/60 flex items-center justify-center gap-3">
            <button
              onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
              className="px-6 py-2.5 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-500/40 text-xs font-bold text-white transition shadow-lg flex items-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#E50914]" />
              <span>Afficher plus de chaînes EPG ({filteredChannels.length - visibleCount} restantes)</span>
            </button>
          </div>
        )}
      </div>

      {/* Program Details Modal */}
      {selectedProgram && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl glass-strong border border-white/10 p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setSelectedProgram(null)}
              className="absolute top-4 right-4 p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#E50914]/20 border border-[#E50914]/40 text-[#E50914] text-xs font-mono font-bold">
                {selectedProgram.category}
              </span>
              <span className="text-xs text-white/50 font-mono">
                {formatHourMin(selectedProgram.start)} - {formatHourMin(selectedProgram.end)}
              </span>
            </div>

            <h3 className="text-xl font-black text-white">{selectedProgram.title}</h3>

            <p className="text-sm text-[#A1A1A6] leading-relaxed">
              {selectedProgram.synopsis}
            </p>

            {/* If live now, show progress status */}
            {now >= selectedProgram.start && now < selectedProgram.end && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-[#E50914]/30 space-y-2">
                <div className="flex items-center justify-between text-xs font-medium text-red-200">
                  <span className="flex items-center gap-1.5 font-bold">
                    <span className="w-2 h-2 rounded-full bg-[#E50914] animate-ping" />
                    En cours de diffusion
                  </span>
                  <span>
                    Fin dans {Math.max(1, Math.round((selectedProgram.end.getTime() - now.getTime()) / (60 * 1000)))} min
                  </span>
                </div>
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#E50914] rounded-full"
                    style={{
                      width: `${Math.min(100, Math.max(0, ((now.getTime() - selectedProgram.start.getTime()) / (selectedProgram.end.getTime() - selectedProgram.start.getTime())) * 100))}%`
                    }}
                  />
                </div>
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                onClick={() => setSelectedProgram(null)}
                className="px-4 py-2 rounded-xl glass hover:bg-white/10 text-white/70 hover:text-white text-xs font-medium transition"
              >
                Fermer
              </button>
              {(() => {
                const targetChan = channels.find((c) => c.id === selectedProgram.channelId);
                return (
                  <button
                    onClick={() => {
                      if (targetChan) {
                        onSelectChannel(targetChan);
                        setSelectedProgram(null);
                      }
                    }}
                    className="px-5 py-2.5 rounded-xl bg-[#E50914] hover:bg-[#F40612] text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-red-950/50 transition"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Regarder la chaîne en direct</span>
                  </button>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
