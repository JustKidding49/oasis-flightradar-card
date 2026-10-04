# Sources and attribution

- Original card code is licensed under GNU GPL version 3 only (`GPL-3.0-only`). Maintainer/GitHub owner: `JustKidding49`. The complete license is in `LICENSE`.
- The bundled airport catalog comes from [OurAirports](https://ourairports.com/data/), published as public-domain data without accuracy guarantees. Snapshot: October 3, 2026; large airports with scheduled service plus retained European entries, Tours and Paris Le Bourget. Some names are adapted into French. This is neither exhaustive nor suitable for aviation navigation.
- City labels in `src/airport-locales.json` are Wikidata structured data ([CC0](https://www.wikidata.org/wiki/Wikidata:Licensing)), snapshot October 4, 2026. Each entry retains its Wikidata identifier and original catalog city. Missing or ambiguous matches are not guessed; translation availability varies by language. `scripts/fetch-airport-locales.cjs` is an optional maintenance importer, not a runtime or build network dependency.
- Localized country names use the browser's `Intl.DisplayNames` implementation. The bundled English fallback was obtained from Node.js/ICU's Unicode CLDR region names; the Unicode permission notice is retained in `src/airport-localization.js` and the distributed module. Country/territory labels and codes are informational, not a statement about political status.
- Time-zone data comes from [mwgg/Airports](https://github.com/mwgg/Airports), MIT license, copyright (c) 2014 mwgg. Its MIT notice is retained in `src/clock.js` and the distributed module.
- Dynamic photos come from Wikidata/Wikimedia Commons. No photos are redistributed in this repository. Author, license and source links remain available in the banner; individual photo licenses apply.
- Local photos are supplied by the user, who is responsible for obtaining the necessary rights. Do not publish private photo libraries without checking those rights.
- No code from `flightradar-flight-card`, `card-mod` or the Flightradar24 integration is included.
- The card is not affiliated with Flightradar24, HACS or Home Assistant.
- Third-party licenses and credits remain applicable: the project's GPL license does not replace the MIT time-zone notice or photo licenses. Release source archives include the sources and build script.
