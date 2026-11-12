# Asset Provenance and Licensing

All astronomical cutouts bundled in `public/assets/galaxies/` are open-licensed scientific survey images stored locally so the Milestone 1 prototype runs completely offline without live Zooniverse or survey API calls.

## Bundled Galaxy Cutouts

| File | Object / Demo Label | Survey & Data Release | Coordinates in App | License & Attribution |
| --- | --- | --- | --- | --- |
| `public/assets/galaxies/ngc-1300.jpg` | NGC 1300 | DESI Legacy Imaging Surveys DR10 | Verified ICRS J2000 (`03h 19m 41.1s`, `−19° 24′ 41″`, Eridanus) | CC BY 4.0 — Legacy Surveys / D. Lang (Perimeter Institute) |
| `public/assets/galaxies/ngc-1365.jpg` | NGC 1365 | DESI Legacy Imaging Surveys DR10 | Verified ICRS J2000 (`03h 33m 36.4s`, `−36° 08′ 26″`, Fornax) | CC BY 4.0 — Legacy Surveys / D. Lang (Perimeter Institute) |
| `public/assets/galaxies/ngc-4565.jpg` | NGC 4565 | DESI Legacy Imaging Surveys DR10 | Verified ICRS J2000 (`12h 36m 20.8s`, `+25° 59′ 16″`, Coma Berenices) | CC BY 4.0 — Legacy Surveys / D. Lang (Perimeter Institute) |
| `public/assets/galaxies/arp-87.jpg` | Arp 87 (NGC 3808A/B) | DESI Legacy Imaging Surveys DR10 | Verified ICRS J2000 (`11h 40m 43.9s`, `+22° 25′ 59″`, Leo) | CC BY 4.0 — Legacy Surveys / D. Lang (Perimeter Institute) |
| `public/assets/galaxies/ngc-474.jpg` | NGC 474 | DESI Legacy Imaging Surveys DR10 | Verified ICRS J2000 (`01h 20m 06.7s`, `+03° 24′ 55″`, Pisces) | CC BY 4.0 — Legacy Surveys / D. Lang (Perimeter Institute) |
| `public/assets/galaxies/hoags-object.jpg` | PGC 54559 (Hoag's Object) | Sloan Digital Sky Survey DR18 | Verified ICRS J2000 (`15h 17m 14.3s`, `+21° 35′ 09″`, Serpens) | CC BY 4.0 — SDSS Collaboration (`https://www.sdss.org`) |
| `public/assets/galaxies/field-subject-alpha.jpg` | Demo Subject GZ-88412 | Sloan Digital Sky Survey DR18 cutout (field centered near `224.2527°, +24.6115°`, VV 340) | Intentionally configured as `unavailable` to test missing workflow metadata handling | CC BY 4.0 — SDSS Collaboration (`https://www.sdss.org`) |
| `public/assets/galaxies/field-subject-beta.jpg` | Demo Subject GZ-90347 | DESI Legacy Imaging Surveys DR9 cutout (field centered near `165.9721°, +40.8497°`, Arp 148) | Intentionally configured as `unverified` to test withheld candidate coordinate handling | CC BY 4.0 — Legacy Surveys / D. Lang (Perimeter Institute) |

## Survey Acknowledgments

- **DESI Legacy Imaging Surveys:** Licensed under [Creative Commons Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/). Credit: Legacy Surveys / D. Lang (Perimeter Institute); see `https://www.legacysurvey.org/acknowledgment/`.
- **Sloan Digital Sky Survey (SDSS-V / DR18):** SDSS image cutouts are licensed under [Creative Commons Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/). Funding for the Sloan Digital Sky Survey has been provided by the Alfred P. Sloan Foundation, the Heising-Simons Foundation, the National Science Foundation, and the Participating Institutions; see `https://www.sdss.org/collaboration/citing-sdss/`.

## Decorative Scenery Assets

All observatory frames, starfields, nebula layers, and celestial accents (`src/components/CelestialGlyphs.tsx`) are original inline SVG elements authored for this repository and explicitly labeled as fictional decorative scenery rather than astronomical subjects.
