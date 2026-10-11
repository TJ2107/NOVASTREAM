# 📺 STREAMBOX - Lecteur Multimédia Universel PWA

Application web progressive (PWA) responsive et multi-formats pour la lecture de TV en direct, films, séries et radios en streaming.

## ⚠️ Précision importante
**STREAMBOX ne contient ni n'héberge aucun contenu multimédia.** C'est un lecteur universel côté client. L'utilisateur fournit et gère ses propres flux et listes M3U/M3U8 en toute conformité.

## ✨ Fonctionnalités clés
- **PWA installable & Hors-ligne** : Support complet manifest.json, Service Worker, icônes 192/512px, bouton d'installation in-app pour Android/Desktop et guide iOS Safari.
- **Support multi-formats** :
  - Flux HLS (`.m3u8`) avec `hls.js` (qualités adaptatives, bascule de flux, bascule audio).
  - Flux DASH (`.mpd`) et fichiers directs (`.mp4`, `.webm`, `.mkv`).
  - Flux audio et radios en direct (`.mp3`, `.aac`, `.pls`, Shoutcast/Icecast).
  - Intégration iframe sécurisée pour YouTube, Twitch, pages web et portails vidéo (`vavoo.to`, `voltop.net`, `vavoo.top`, `kool.ws`, `oha.to`, `huhu.to`).
  - Parseur de playlists M3U avec détection automatique des métadonnées (`tvg-name`, `tvg-logo`, `group-title`).
- **Navigateur de Portails Intégré** : Navigateur web in-app dédié pour explorer et lire les portails multimédias (`vavoo.to`, `voltop.net`, `vavoo.top`, `kool.ws`, `oha.to`, `huhu.to`) avec bascule instantanée vers les 4 sections (TV en direct, Films, Séries, Radios).
- **STREAMBOX Duo (Continuité Multi-Écrans)** :
  - *« Commencez un film sur le téléphone, continuez sur la télé. Deux écrans, une image, et c'est le téléphone qui pilote. »*
  - Handoff immédiat du film ou flux entre votre mobile et la télévision sans coupure et à la seconde exacte.
  - Le smartphone se transforme en télécommande tactile interactive (Play/Pause, scrub temporel, volume, D-Pad virtuel et rappel sur mobile).
  - Simulateur double écran interactif côte-à-côte avec synchronisation en temps réel (BroadcastChannel & LocalBus).
- **Bouclier VPN Suisse** : Chiffrement en 1 tap, serveurs suisses sous juridiction LPD stricte, contournement des blocages FAI, zéro logs, pas de bridage.
- **Lecteur Radio persistant** : La radio continue de jouer en tâche de fond avec un visualiseur audio lors de la navigation entre les pages.
- **Mode TV (Smart TV)** : Navigation dédiée par télécommande ou clavier (`tv-focus`), zapping instantané (`↑` / `↓` / `PageUp` / `PageDown`), raccourcis (`Espace`, `F` plein écran, `M` muet, `P` PiP, `←`/`→` avance/recul 10s).
- **Reprise de lecture (VOD)** : Mémorisation de la progression pour reprendre les films et séries là où vous vous étiez arrêté.
- **Bibliothèque & Sauvegarde** : Exportation et importation de vos configurations et listes en JSON local.
- **Sources de démonstration** : France 24, Euronews, NASA TV, SomaFM Groove Salad, FIP Radio, Big Buck Bunny, Sintel.

## 🛠️ Technologies
- React 19 + TypeScript + Vite 8
- Tailwind CSS (design sombre glassmorphism néon)
- HLS.js
- Zustand (persistance `localStorage`)
- Framer Motion / Motion
- Lucide React
