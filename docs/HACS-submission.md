# Official HACS catalog inclusion

**Accepted and merged on October 20, 2026.** Verified on October 24, 2026.

Approved submission: https://github.com/hacs/default/pull/11540
Merge commit: https://github.com/hacs/default/commit/164b0f29599d9deefbd66dbae1cc85f3cb468269

Search for **Oasis Flightradar Card** directly in HACS, category **Dashboard**. A custom repository is no longer required. Existing custom-repository installations do not need to uninstall or add a duplicate resource; that route remains a fallback if HACS search has not refreshed.

Latest release verified October 24, 2026: [v0.1.7](https://github.com/JustKidding49/oasis-flightradar-card/releases/tag/v0.1.7). Version 0.1.7 passed 39 local automated tests on October 4, 2026. [Successful pre-release HACS validation](https://github.com/JustKidding49/oasis-flightradar-card/actions/runs/37234047127).

The card supports 13 interface languages with English fallback. The required Flightradar24 integration is separate from this dashboard card. Read-only mode is enabled by default.

## Archived submission preparation (October 3, 2026)

The historical checklist below describes preparation before approval, not outstanding work. References to pending releases and a primarily French interface reflect that earlier stage and are superseded by the status above.

Repository: https://github.com/JustKidding49/oasis-flightradar-card
Category: Dashboard (`plugin` in the HACS backend).
Maintainer/owner: JustKidding49. License: GPL-3.0-only.

## Before submitting

1. Publish the English README, embedded public previews and `.github/workflows/validate.yml`.
2. Verify the HACS action succeeds with `category: plugin`, without `ignore` or disabled checks. Record the successful run URL.
3. Publish a NEW complete release after that successful action, attaching `oasis-flightradar-card.js` built from the corresponding source tag. Existing v0.1.1 predates the validation workflow and does not satisfy this chronology.
4. Confirm the repository is public, active, has issues enabled, a description/topics, root `hacs.json`, and a matching JS filename in `dist` and release assets.
5. Fork `hacs/default` under the owner's personal account, create a new branch from `master`, and add `JustKidding49/oasis-flightradar-card` to the `plugin` JSON list in alphabetical order. Preserve valid JSON.
6. Complete the CURRENT upstream PR template truthfully, link the successful run and new release, and allow maintainer edits. Do not request reviews.

Hassfest and integration brand assets do not apply to a dashboard card. This card is not country-restricted. The interface is currently primarily French; English README text does not imply an English UI.

## Draft PR description

Suggested title: `Add JustKidding49/oasis-flightradar-card`

Oasis Flightradar Card is a standalone Home Assistant dashboard card for the Flightradar24 integration. It combines a city banner, browser-local/airport-local clocks, ICAO search, departures/arrivals and followed-flight controls. It is already installable through a custom HACS repository. Public previews use synthetic data; the default configuration is read-only. The original code is licensed GPL-3.0-only.

### Checklist (leave pending items unchecked)

- [x] Publishing documentation reviewed.
- [x] HACS action published and passing without ignored checks.
- [x] Successful HACS action URL supplied.
- [ ] New full release published AFTER successful validation.
- [ ] Release URL supplied.
- [ ] `hacs/default` plugin entry sorted and JSON validated.
- [ ] Current upstream PR template completed; maintainer edits enabled.

Successful HACS run: https://github.com/JustKidding49/oasis-flightradar-card/actions/runs/37135056942 (success, October 3, 2026; no ignored checks).
Post-validation release: **pending**.
Hassfest: not applicable (Dashboard/plugin).

## References

- https://www.hacs.xyz/docs/publish/start/
- https://www.hacs.xyz/docs/publish/plugin/
- https://www.hacs.xyz/docs/publish/action/
- https://www.hacs.xyz/docs/publish/include/
- https://github.com/hacs/default/blob/master/.github/PULL_REQUEST_TEMPLATE.md

Requirements reviewed October 3, 2026. Recheck the current template when submitting. Acceptance is decided by HACS maintainers; custom-repository installation does not guarantee inclusion.
