# Celestial Analytics

Team Banana — CSC316 final project. An interactive visual tour of the solar system: scale, orbits, gravity, eccentricity, and discovery timelines.

Entry point: [`index.html`](index.html) (redirects to [`opening/`](opening/)). Each section lives in its own directory and is navigable via the shared nav bar at the top of every page.

## Project structure

Each folder below is a section of the experience. All HTML, CSS, and JS inside them was written by us unless noted otherwise.

| Folder | Page |
|---|---|
| [`opening/`](opening/) | Introduction |
| [`scale/`](scale/) | Comparing planet masses to Earth |
| [`vis1/`](vis1/) | Comparing planet sizes |
| [`transition/`](transition/) | Transition, introducing gravity |
| [`vis3/`](vis3/) | Showcasing gravity on planet surfaces |
| [`transition2/`](transition2/) | Transition, explaining orbits |
| [`vis4/`](vis4/) | How gravity affects orbits |
| [`transition3/`](transition3/) | Transition to orbital map |
| [`vis2/`](vis2/) | Tree of discoveries and orbit dependencies |
| [`ending/`](ending/) | Closing slides |

The shared dataset lives in [`data/sol_data.csv`](data/sol_data.csv) at the repo root and is loaded by every visualization that needs it (via `../data/sol_data.csv`). It was sourced from a [Solar System Major Bodies Data](https://www.kaggle.com/datasets/jaredsavage/solar-system-major-bodies-data) by Jared Savage on Kaggle, then processed and cleaned by us.

### Third-party code

The only external dependencies are loaded from CDNs in the HTML files and are not ours:

- [D3.js v7](https://d3js.org/) — used by every visualization.
- [noUiSlider v15](https://refreshless.com/nouislider/) — used by [`vis2/`](vis2/) for orbit controls.

Everything else (all files under `js/` in every section, every `index.html`, the shared stylesheet) is our own code.

## Unified styling

All sections share a single stylesheet, [`css/styles.css`](css/styles.css), in the repo root. Every page links it via `../css/styles.css`, so global styles (colors, fonts, the shared nav bar, transition backgrounds, star fields) live in exactly one place.
