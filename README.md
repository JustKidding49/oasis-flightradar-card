# Oasis Flightradar Card

An airport-style Home Assistant dashboard card: city banner, split-flap clocks, ICAO search, departures, arrivals and flight tracking — in one standalone JavaScript module.

[Latest release](https://github.com/JustKidding49/oasis-flightradar-card/releases/latest) · [Français](README.fr.md) · [Report an issue](https://github.com/JustKidding49/oasis-flightradar-card/issues)

**Version 0.1.1 · GPL-3.0-only · Maintained by JustKidding49**

Available as a **custom HACS repository**, not yet in the default catalog. Documentation is in English; the current card interface is primarily French, with bilingual flight-board headings.

## Preview

Public previews use synthetic flight data and the fallback banner: no live traffic, private entities or Home Assistant connection. Local or automatically fetched city photos can be configured, with attribution.

![Desktop preview: clocks and side-by-side flight boards](https://raw.githubusercontent.com/JustKidding49/oasis-flightradar-card/main/docs/desktop.png)

<details>
<summary>Phone and tablet previews</summary>

### Phone

![Phone preview](https://raw.githubusercontent.com/JustKidding49/oasis-flightradar-card/main/docs/mobile.png)

### Tablet

![Tablet preview](https://raw.githubusercontent.com/JustKidding49/oasis-flightradar-card/main/docs/tablet.png)

</details>

## Features

- Dynamic city banner with local images or credited Wikimedia Commons photos.
- Device-local and airport-local clocks using IANA time zones and daylight-saving rules. Hours/minutes flip; seconds update instantly.
- Search 1,153 airports by name, city, country, ICAO or IATA, or enter an ICAO code manually.
- Departures/arrivals with sticky headers, vertical scrolling and ten visible rows by default. Tables stack on narrow screens.
- Character cycling without half-panel rotation: shortest path through `space → A…Z → 0…9 → : → - → space`.
- Sequential updates: time, destination/origin, flight, status, then next row; departures before arrivals. Only visible rows animate; reduced-motion preferences disable cycling.
- After an airport switch, the first fresh data for each board appears instantly, even if the sensors update separately or temporarily become unavailable. Later updates animate normally.
- Five panels for time and six for flight numbers. Destination/status widths are calculated from both boards; long text scales down, with original text accessible and available on hover.
- Followed-flight summaries, Flightradar24 links, add/remove forms and confirmation before clearing follows.
- Visual configuration editor; **read-only mode enabled by default**.

No additional `card-mod`, `browser_mod`, external flight card, JavaScript CDN or framework is required. Followed flights use native summaries rather than an external photo carousel.

## Requirements

Configure the [Flightradar24 integration](https://github.com/AlexandrErohin/home-assistant-flightradar24) first. Sensors must expose a `flights` attribute containing a list of objects. Entity IDs vary: select your own entities instead of copying the example unchanged.

A modern browser supporting `DecompressionStream` is required for the bundled catalog. The card reads Home Assistant entities; it does not authenticate directly with Flightradar24 or ask for passwords/tokens.

## HACS installation

1. Open **HACS → Custom repositories**.
2. Add `https://github.com/JustKidding49/oasis-flightradar-card`, category **Dashboard**.
3. Download **Oasis Flightradar Card** and reload your browser.
4. Check `/hacsfiles/oasis-flightradar-card/oasis-flightradar-card.js` is registered as a **JavaScript module**. Do not keep a second manual/inline copy.
5. Add the card, select your entities and keep `read_only: true` while checking configuration.

HACS manages the resource version query in storage-mode dashboards. If an old copy remains cached, hard-reload the browser or reset the frontend cache in the Companion app.

### Manual installation

Download `oasis-flightradar-card.js` from the latest release, put it in Home Assistant's existing `www` directory and register `/local/oasis-flightradar-card.js?v=0.1.1` as a JavaScript module. Bump the query version on updates. Do not use manual and HACS resources simultaneously.

## Configuration

```yaml
type: custom:oasis-flightradar-card
airport_entity: text.my_airport
departures_entity: sensor.my_departures
arrivals_entity: sensor.my_arrivals
followed_entity: sensor.my_followed_flights
add_entity: text.my_add_flight
remove_entity: text.my_remove_flight
clear_entity: button.my_clear_follows
visible_rows: 10
read_only: true
```

Only `airport_entity` is required. Other entities are optional; missing data is reported and actions without targets are disabled. Explicitly set `read_only: false` to enable follow submissions. Opening search or selecting a provisional result does not write an entity; submitting does. Read-only mode is an interface guard, not an account-permission replacement.

Airport/add/remove entities accept `text` or `input_text`; clear accepts `button` or `input_button`. Prefer native integration entities. Helpers need an existing mechanism connecting them to the integration. No service is called except following a user confirmation/submission.

### Options

| Option | Default | Purpose |
| --- | --- | --- |
| `visible_rows` | `10` | Visible rows, from 1 to 30. |
| `flights_attribute` | `flights` | Attribute containing flight objects. |
| `read_only` | `true` | Block follow-action submissions. |
| `online_images` | `true` | Allow Wikidata/Commons photo lookup. |
| `online_timezones` | `true` | Allow public time-zone lookup for unknown airports. |
| `airport_timezones` | Built-in mappings | Per-card ICAO → IANA overrides. |
| `local_images` | None | ICAO → `{city, url}`; local path or HTTPS URL. |
| `airports` | Bundled catalog | Custom list: `code`, `name`, `country`; optional `city`, `iata`. |
| `departures_fields` | Below | Mappings for `time`, `city`, `flight`, `status`; nested paths allowed. |
| `arrivals_fields` | Below | Equivalent mappings for arrivals. |

Departure defaults: `time_scheduled_departure`, `airport_city`, `flight_number`, `status_text`.
Arrival defaults: `time_scheduled_arrival`, `airport_city`, `flight_number`, `status_text`.

Times accept Unix timestamps **in seconds** or ISO strings with a time zone. Empty flight numbers fall back to `callsign`. Numbers exceeding six characters are visually truncated, with the full value on hover. Unknown time zones show `--:--`, not a misleading local time.

### Local photos and offline lookups

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

The local clock follows device settings, **not GPS**. Online photo lookup sends the ICAO code to Wikidata; images load from their source. Time-zone fallback downloads the public `mwgg/Airports` database. No Home Assistant credentials are sent. Disable both `online_*` options and provide local photos/time zones to avoid external lookups. Photo credits remain accessible in the banner.

## Troubleshooting

- **Custom element not found:** check resource/module registration and reload. Remove duplicate resources.
- **No flights:** check configured sensors and their `flights` attribute. Coverage is controlled by the integration, not this card.
- **Disabled actions:** check read-only mode, entity mappings and availability. Enable actions only when ready to change real follows.
- **Unknown time zone:** add an `airport_timezones` override.
- **No city photo:** configure a local image or check online lookup availability. The fallback keeps the card usable.

Issue reports should include card/HA/browser versions and redacted configuration or synthetic data. **Never publish tokens, passwords, private URLs or unredacted backups.**

## Development and verification

Requires Node.js 20+. On Windows:

```powershell
npm install
npm run build
npx playwright install chromium
$env:OASIS_BROWSER_CHANNEL='chromium'
npm test
node scripts/screenshots.cjs
```

On Linux/macOS, use `OASIS_BROWSER_CHANNEL=chromium npm test` and the same prefix for screenshots. Tests default to Microsoft Edge without a channel override. `scripts/build.cjs` generates `dist/oasis-flightradar-card.js`; do not edit it directly. `examples/demo.html` runs with synthetic data offline.

**26 automated browser tests passed** on October 3, 2026. Network requests are blocked and services/airport changes are simulated. Coverage includes safeguards, confirmation/errors, responsive layout, time zones, HTML injection prevention, multiple instances, character cycling and airport-switch first refresh.

The maintainer reports action tests on the ChatGPT test dashboard and phone/tablet rendering checks as passed. These are maintainer-reported acceptance results, not additional automated tests. No exhaustive HA/browser/Companion compatibility matrix is claimed.

## License and credits

Original code: **GPL-3.0-only**. See [LICENSE](LICENSE) and [NOTICE.md](NOTICE.md). OurAirports data is public domain; time-zone data retains its MIT notice. Photos retain their individual licenses and attribution. No third-party flight-card or integration code is bundled. Source/build scripts are available in every release tag; the standalone JavaScript is attached to each release.

Not affiliated with Flightradar24, Home Assistant or HACS. **Not an aviation navigation tool.**
