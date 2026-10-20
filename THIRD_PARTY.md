# Third-party fonts in `src/styles/fonts/`

**Статус: прототип / демо.** Provenance of the two typefaces that the web demo serves. Written for FE-P02 (20.10.2026). The files are not edited.

| | Onest | JetBrains Mono |
|---|---|---|
| Files | `Onest-latin.woff2`, `Onest-cyrillic.woff2`, `Onest-cyrillic-ext.woff2` | `JetBrainsMono-latin.woff2`, `JetBrainsMono-cyrillic.woff2`, `JetBrainsMono-cyrillic-ext.woff2` |
| Version (font `name` table) | 2.001 | 2.211 |
| Format | WOFF2, variable font (`wght` axis), Google Fonts subsets | same |
| Upstream project | <https://github.com/googlefonts/onest> (the copyright line of the licence text; the font files name <https://github.com/simpals/onest>) | <https://github.com/JetBrains/JetBrainsMono> |
| Distribution origin of the files | Google Fonts CDN, `https://fonts.gstatic.com/s/onest/v11/…` | Google Fonts CDN, `https://fonts.gstatic.com/s/jetbrainsmono/v24/…` |
| Licence | SIL Open Font License 1.1 — `OFL-Onest.txt` | SIL Open Font License 1.1 — `OFL-JetBrainsMono.txt` |
| Copyright line | Copyright 2021 The Onest Project Authors | Copyright 2020 The JetBrains Mono Project Authors |

## How the files got here

1. The deck folder `deck/assets/fonts/` holds the same faces, saved on 09.10.2026 together with `gf.css`, a Google Fonts stylesheet that lists the exact `fonts.gstatic.com` URLs (Onest v11, JetBrains Mono v24, subsets `latin`, `cyrillic`, `cyrillic-ext`).
2. On 20.10.2026 FE-P01 copied one file per face and subset into `prototipe/web/public/fonts/`, renamed without the weight (`Onest-400-cyrillic.woff2` → `Onest-cyrillic.woff2`). The files are variable fonts, so one file covers every weight the prototype uses; `src/styles/fonts.css` declares the weight range and the `unicode-range` of each subset.
3. The two licence texts were added next to the fonts in the same step.
4. On 20.10.2026 FE-P04 moved the six files and the two licence texts, unchanged, to `src/styles/fonts/`, so the CSS bundler resolves them and adds the base path of the GitHub Pages build.

## Verification done on 20.10.2026

- SHA-256 of the six `.woff2` files equals the SHA-256 of the matching files in `deck/assets/fonts/`.
- The six files were downloaded again from the `fonts.gstatic.com` URLs listed in `deck/assets/fonts/gf.css` (400-weight entry of each subset): all six are byte-identical to the files in `src/styles/fonts/`.
- `OFL-Onest.txt` and `OFL-JetBrainsMono.txt` are byte-identical to `ofl/onest/OFL.txt` and `ofl/jetbrainsmono/OFL.txt` in the `google/fonts` repository (`raw.githubusercontent.com/google/fonts/main/ofl/…`).
- The `name` table of each file (read with `fontkit`) gives the family, the version and the copyright line in the table above and the licence URL (`https://openfontlicense.org` for Onest, `https://scripts.sil.org/OFL` for JetBrains Mono).

## Not recorded

- Who downloaded the deck copies on 09.10.2026 and with what command: **origin of that step unverified**. The result is verified (identical to the CDN files); the person and tool are not written down anywhere in the project. The person who saved `deck/assets/fonts/` can settle it.
- Whether the `google/fonts` copy of the licence text is the one the upstream authors intend: it is the text Google Fonts distributes with the families, which is what the CDN files come from.
- The OFL requires the copyright notice and licence text to travel with the fonts; both are in this folder. The fonts are not sold on their own and are not renamed.

# Third-party photos in `public/landing/`

Added for the landing redesign (20.10.2026). Copied from the deck (`deck/assets/photos/`), resized to 1800 px on the long side and re-encoded as WebP with metadata (EXIF) removed. Credits as on the deck's «Источники» slide.

| File | Deck source | Author | Licence | Shows |
|---|---|---|---|---|
| `before.webp` | `before.jpg` | @ariungoo, Unsplash | Unsplash License | A roadside dump, no people, no plates |
| `after.webp` | `after.jpg` | Aleksandra Boguslawska, Unsplash | Unsplash License | A clean footpath in grass, no people |
| `vola.webp` | `volA.jpg` | Vitaly Gariev, Unsplash | Unsplash License | Volunteers' gloved hands and bags, no faces |

The two photos used as «до» and «после» show **different places**; the landing says so in the caption. Photos with people's faces (`p1.jpg`) or readable licence plates (`p3.jpg`, `p4.jpg`) and the city hall photo (`hall1.jpg`, which could read as a partnership, HR-2) are deliberately not used.

# Screenshots in `public/landing/screen-*.webp`

Captured from this prototype itself (demo data, «Прототип» banner visible) with headless Chromium. No third-party content except the OpenStreetMap tiles on the map screens (© OpenStreetMap contributors, ODbL), credited on those screens.
