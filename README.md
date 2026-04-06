# Celestial Analytics

Team Banana — CSC316 final project. An interactive visual tour of the solar system: scale, orbits, gravity, eccentricity, and discovery timelines.

Entry point: [`index.html`](index.html) (redirects to [`opening/`](opening/)). Each section lives in its own directory and is navigable via the shared nav bar at the top of every page.

A demo video: https://www.youtube.com/watch?v=788yj-AfzbE
Github page: https://anubhajoshi01.github.io/csc316/opening/

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

## Data

Our shared dataset is stored in [`data/sol_data.csv`](data/sol_data.csv). It is the main cleaned dataset used across the project and supports multiple visualizations throughout the experience. The original data came from the *Solar System Major Bodies Data* dataset on Kaggle, and we cleaned and processed it so the values, labels, and structure would work better for our project.

### Main attributes used in the project

| Attribute / Type | What it is used for |
|---|---|
| Body name | Identifying planets, moons, and other celestial bodies across all pages |
| Body type | Distinguishing whether an object is a planet, moon, dwarf planet, or another type of body |
| Mass | Used in comparisons of planetary scale and relative size or weight |
| Gravity | Used in the gravity-based visualizations to compare surface conditions on different planets |
| Orbital information | Used to show how planets and other bodies move and relate to each other in orbit-based views |
| Eccentricity | Used to explain and compare orbit shape |
| Discovery-related details | Used in the discovery timeline and relationship-based views |

## Style

The overall look of our project is managed through the shared stylesheet at [`css/style.css`](css/style.css). This is the main file that keeps the project visually consistent across all pages. It defines the common visual language of the website, while each section can still add its own smaller styling choices when needed.

### Shared style system

| Shared style element | What it does |
|---|---|
| Color palette | Keeps the project visually consistent and supports the space theme |
| Background styling | Creates the dark space-like feeling used across the experience |
| Typography | Keeps headings, labels, and text consistent across pages |
| Glowing text effects | Helps strengthen the sci-fi / celestial feel of the project |
| Navigation bar | Gives users a consistent way to move between sections |
| Buttons and controls | Makes interactions feel uniform across different visualizations |
| Panels, labels, and dropdowns | Reuses the same interface style in multiple sections |
