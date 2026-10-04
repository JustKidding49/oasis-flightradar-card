# Oasis Flightradar Card

[English documentation](README.md)

Une carte Lovelace autonome, au style tableau d’aéroport noir et doré : bandeau de la ville, deux horloges à panneaux basculants, recherche OACI, départs, arrivées, vols suivis et boutons de gestion du suivi.

Nom du dépôt validé : **oasis-flightradar-card**. Mainteneur et compte GitHub : **JustKidding49**. Licence du code original : **GPL-3.0-only** (GNU GPL version 3 uniquement).

**Version 0.1.4 : interface multilingue automatique.** Les 32 tests locaux réussissent le 4 octobre 2026. Le rendu réel de la version précédente a été vérifié le 3 octobre 2026 dans Home Assistant : bandeau, horloges, recherche et tableaux à dix lignes visibles. Les appels de service et les changements de données synthétiques sont testés uniquement avec une simulation. La carte est distribuée par dépôt personnalisé HACS ; sa demande d’ajout au catalogue par défaut est en attente.

## Langue automatique

La carte et son éditeur suivent la langue de l’interface Home Assistant de l’utilisateur : `hass.locale.language`, ou `hass.language` pour compatibilité. Aucun réglage YAML n’est nécessaire. Un changement de langue actualise aussi les dialogues ouverts sans modifier les entités.

Treize langues : français, anglais, allemand, espagnol, italien, hongrois, portugais, indonésien, chinois simplifié, hindi, bengali, arabe et ourdou. Les variantes régionales utilisent la traduction de base (`en-GB`, `pt-BR`, `hu-HU`, etc.). Si la langue est absente ou non prise en charge, ou si une traduction manque, la carte utilise l’anglais. Toutes les traductions sont embarquées : aucun service de traduction ni appel réseau.

L’arabe et l’ourdou utilisent une interface de droite à gauche. L’ordre des colonnes des tableaux reste inchangé ; les codes OACI et les chiffres des horloges restent de gauche à droite, en chiffres latins sur 24 heures. Les noms d’aéroports, pays, statuts des capteurs, métadonnées des photos et titres personnalisés restent tels que fournis par leur source. Les messages techniques de validation YAML conservent leurs diagnostics d’origine. Une relecture des traductions par des locuteurs natifs est bienvenue.

Les dix langues demandées sont choisies selon le nombre total de locuteurs (langue maternelle et seconde langue), d’après le [classement Ethnologue 2026 reproduit ici](https://en.wikipedia.org/wiki/List_of_languages_by_total_number_of_speakers). L’allemand, l’italien et le hongrois s’y ajoutent.

## Ce qui est regroupé

- Bandeau dynamique d’après l’aéroport suivi ; photos locales prioritaires et crédits des photos Commons conservés.
- Heure locale du navigateur et heure de l’aéroport, avec gestion des changements d’heure via les fuseaux IANA. Les secondes se mettent à jour instantanément, sans basculement ; les heures et minutes restent animées.
- Recherche parmi 1 153 aéroports : nom, ville, pays, OACI et IATA ; saisie manuelle d’un code OACI.
- Départs à gauche, arrivées à droite ; dix lignes visibles par défaut, en-têtes fixes et défilement. Sur écran étroit, les tableaux se placent l’un sous l’autre.
- Tableaux au style panneaux d’aéroport : passage par les caractères intermédiaires, sans rotation des demi-panneaux. Cycle `vide → A…Z → 0…9 → : → - → vide`, parcouru dans le sens le plus court. Une cellule à la fois : Heure → Destination/Origine → Vol → Statut, puis ligne suivante ; Départs avant Arrivées. Seules les lignes visibles s’animent ; premier affichage et lignes hors écran instantanés. Les préférences de réduction du mouvement désactivent le cycle.
- Cinq panneaux pour l’heure, six pour le numéro de vol. Destination/Origine et Statut sont dimensionnés d’après le texte le plus long parmi tous les vols reçus dans les deux tableaux ensemble, avec des panneaux vides pour compléter les cellules plus courtes. Accents normalisés, autres signes hors alphabet remplacés par des espaces ; texte original conservé pour l’accessibilité et au survol. Un identifiant de vol dépassant six caractères est tronqué visuellement, mais reste complet au survol. Taille des panneaux et largeur des colonnes adaptées à l’espace disponible pour éviter le défilement horizontal ; les textes très longs deviennent plus petits.
- Après un changement d’aéroport, le premier rafraîchissement des vols est instantané pour chaque tableau, même si les Départs et Arrivées arrivent séparément ou après un état indisponible. Les mises à jour suivantes retrouvent leur animation habituelle.
- Résumé des vols suivis et liens Flightradar24.
- Police des panneaux identique aux horloges : hauteur = 1,45 × largeur et taille des caractères = 1,35 × largeur. Largeur adaptative commune aux Départs et Arrivées selon la place disponible, plafonnée à 11 px par panneau ; horloges inchangées.
- Ajout/retrait par formulaire ; effacement avec confirmation.
- Éditeur graphique pour les entités, le nombre de lignes et la lecture seule.

Un seul module JavaScript à installer. Pas de `card-mod`, `browser_mod`, `flightradar-flight-card`, CDN JavaScript ou framework supplémentaire. Les composants internes sont embarqués dans le même fichier et ne nécessitent aucune ressource séparée.

La présentation des vols suivis est un nouveau résumé natif : elle ne reproduit pas les photos, logos, barre de progression ou carrousel de la carte externe précédemment utilisée.

## Prérequis

L’[intégration Flightradar24](https://github.com/AlexandrErohin/home-assistant-flightradar24) doit déjà fournir les données dans Home Assistant. La carte ne se connecte pas directement à l’API Flightradar24 et ne demande aucun identifiant, mot de passe ou token.

Les capteurs doivent exposer un attribut `flights`, contenant une liste d’objets. Les noms d’entités dépendent de l’installation et de la langue : sélectionner ses propres entités, ne pas recopier aveuglément celles des exemples.

## Installation manuelle

1. Copier `dist/oasis-flightradar-card.js` dans le dossier `www` existant de Home Assistant.
2. Dans les ressources du tableau de bord, ajouter `/local/oasis-flightradar-card.js?v=0.1.4`, type **module**.
3. Ajouter la carte « Oasis Flightradar Card » et renseigner les entités.

Le fichier autonome mesure environ 108 Ko. Le catalogue des 1 153 aéroports est compressé sans perte et décompressé localement, sans requête réseau, grâce à `DecompressionStream` : un navigateur récent est nécessaire. L’installation comme fichier JS reste recommandée pour HACS. Une ressource inline MCP est possible si sa limite et la politique CSP du reverse proxy le permettent. Bumper la version de l’URL lors d’une mise à jour manuelle pour éviter les caches obsolètes.

## Configuration minimale

```yaml
type: custom:oasis-flightradar-card
airport_entity: text.mon_aeroport
departures_entity: sensor.mes_departs
arrivals_entity: sensor.mes_arrivees
followed_entity: sensor.mes_vols_suivis
add_entity: text.ajouter_un_vol
remove_entity: text.retirer_un_vol
clear_entity: button.effacer_les_suivis
visible_rows: 10
read_only: true
```

`airport_entity` est requis. Les autres entités sont facultatives : les données non configurées sont signalées et les boutons sans cible sont désactivés. **`read_only` vaut `true` par défaut** ; passer explicitement à `false` pour autoriser la validation des formulaires. Ouvrir une recherche ou choisir un résultat ne modifie aucun état.

Les trois champs texte acceptent les domaines `text` ou `input_text` ; l’effacement accepte `button` ou `input_button`. Une entité `input_text`/`input_button` ne pilote pas d’elle-même l’intégration : l’utilisateur doit déjà disposer d’un mécanisme adapté. Les entités `text`/`button` natives de l’intégration sont le choix recommandé.

En dehors des validations utilisateur, aucun service Home Assistant n’est lancé. La carte n’enregistre pas les recherches. Le mode lecture seule est un garde-fou de l’interface, pas un remplacement des permissions du compte Home Assistant.

## Options avancées

| Option | Valeur par défaut | Description |
| --- | --- | --- |
| `visible_rows` | `10` | Entier de 1 à 30 ; taille des tableaux. |
| `table_animations` | `true` | Active les animations de caractères des tableaux Départs et Arrivées. Option disponible dans l’éditeur visuel. Avec `false`, affichage immédiat des données, sans changer le style des panneaux ni les horloges. |
| `flights_attribute` | `flights` | Attribut contenant la liste de vols. |
| `read_only` | `true` | Bloque toutes les validations de suivi. |
| `online_images` | `true` | Autorise les recherches de photos Wikidata/Commons. |
| `online_timezones` | `true` | Autorise le téléchargement de la base des fuseaux pour un code inconnu. |
| `airport_timezones` | Table intégrée | Correspondances OACI → fuseau IANA, propres à chaque carte. |
| `local_images` | Aucun | Photos OACI → `{city, url}` ; chemin local ou URL HTTPS. |
| `airports` | Catalogue intégré | Liste personnalisée qui remplace le catalogue. Champs `code`, `name`, `country` ; `city`, `iata` facultatifs. |
| `departures_fields` | Voir ci-dessous | Champs `time`, `city`, `flight`, `status`. Chemins imbriqués autorisés. |
| `arrivals_fields` | Voir ci-dessous | Mêmes champs pour les arrivées. |

Départs : `time_scheduled_departure`, `airport_city`, `flight_number`, `status_text`.
Arrivées : `time_scheduled_arrival`, `airport_city`, `flight_number`, `status_text`.
Heures : timestamp Unix **en secondes** (nombre) ou chaîne ISO avec fuseau. Le champ de vol vide utilise `callsign` si présent. Les heures restent `--:--` si le fuseau de l’aéroport est inconnu plutôt que d’afficher une heure locale incorrecte.

```yaml
airport_timezones:
  LFPB: Europe/Paris
local_images:
  LFPB:
    city: Paris
    url: /local/photos/paris.jpg
online_images: false
online_timezones: false
```

Le fuseau local suit les réglages de l’appareil, **sans GPS**. L’aéroport utilise une petite table de fuseaux, puis éventuellement la base publique `mwgg/Airports`. Ces requêtes n’envoient aucun identifiant Home Assistant. Les requêtes photos transmettent le code OACI à Wikidata ; les images se chargent dans le navigateur. Pour un usage sans appels externes, désactiver les deux options `online_*` et utiliser des photos/fuseaux locaux.

## Développement et tests

```powershell
npm install
npm run build
npx playwright install chromium
$env:OASIS_BROWSER_CHANNEL='chromium'
npm test
```

Sur un Windows disposant déjà de Microsoft Edge, les tests utilisent Edge par défaut. Toutes les requêtes réseau des tests sont bloquées. Les données et les appels de service sont fictifs : aucun accès à Home Assistant.

`scripts/build.cjs` assemble les sources et le catalogue dans `dist/oasis-flightradar-card.js`. Ne pas modifier directement ce fichier généré. `examples/demo.html` fournit une démonstration locale, sans serveur ni connexion Home Assistant.

Tests : rendu autonome, fuseaux, recherche, lecture seule, confirmations, erreurs, double validation, mobile, tableaux, données absentes, protection contre l’injection HTML, deux instances, éditeur, séquençage Départs/Arrivées, proportions des caractères et chemin minimal sur les 1 521 paires de caractères, ordre cellule par cellule et absence de défilement horizontal.

Résultat local : **26 tests navigateur réussis** dans Microsoft Edge, le 3 octobre 2026. Les aperçus `docs/desktop.png` et `docs/mobile.png` utilisent uniquement des données fictives et un bandeau sans photo ; ils ne représentent pas une connexion à Home Assistant.

## Installation HACS

1. Dans HACS, ouvrir **Dépôts personnalisés**.
2. Ajouter `https://github.com/JustKidding49/oasis-flightradar-card`, type **Dashboard**.
3. Télécharger **Oasis Flightradar Card**, puis recharger le navigateur.
4. Vérifier la ressource `/hacsfiles/oasis-flightradar-card/oasis-flightradar-card.js`, type **module**. Ne pas conserver une seconde ressource inline de la même carte.
5. Ajouter la carte et sélectionner ses entités ; conserver `read_only: true` pendant les vérifications.

La présence dans le catalogue par défaut exige une demande distincte et l’acceptation par HACS. Les sources et le script de construction accompagnent chaque version dans le dépôt ; le fichier JS autonome est joint à la release.

Références : [exigences des cartes HACS](https://www.hacs.dev/docs/publish/plugin/), [exigences générales](https://www.hacs.dev/docs/publish/start/), [API des cartes Home Assistant](https://developers.home-assistant.io/docs/frontend/custom-ui/custom-card/).

## Limites de cette version

- Le mainteneur déclare les tests des actions sur ChatGPT et du rendu téléphone/tablette validés. Les 26 tests automatisés utilisent des données et services fictifs.
- Pas de matrice exhaustive de compatibilité Home Assistant/navigateurs/Companion.
- Pas de catalogue exhaustif de tous les aérodromes ; les données publiques peuvent contenir des erreurs.
- Les photos et fuseaux distants dépendent de services publics ; absence de photo ou fuseau signalée sans bloquer la carte.
- Les créneaux des vols sont limités par les capteurs de l’intégration, pas par la carte.

Licence : **GPL-3.0-only** ; voir `LICENSE` et `NOTICE.md`. Les éléments tiers conservent leurs licences et leurs crédits. La distribution du fichier JS doit rester accompagnée d’un accès aux sources correspondantes et au script de construction. Le paquet ZIP contient ces fichiers.
