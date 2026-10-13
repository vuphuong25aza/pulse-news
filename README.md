# PULSE — Nhịp sống số

**A Vietnamese news website frontend demo built with HTML, CSS and vanilla JavaScript.**

PULSE is a personal learning project exploring responsive news layouts, interactive filtering and browser-side state management. The website uses sample articles and does **not** provide live news.

## Features

- Responsive homepage, featured articles and seven news categories
- Accent-insensitive search in Vietnamese; category filters and sorting
- Load more, bookmarks, dark/light mode and article reader
- Article sharing with URL hashes, font size controls and speech synthesis
- Local-only comments and preferences stored in `localStorage`
- Keyboard shortcuts and mobile-friendly layout

## Tech stack

- HTML5 (`index.html`)
- CSS3 (`style.css`)
- Vanilla JavaScript (`app.js`, `data.js`)
- Browser APIs: `localStorage`, Web Speech API

## Run locally

Download or clone this repository, then open `index.html` or serve the folder locally:

```bash
python -m http.server 8080
```

Open `http://localhost:8080` in a browser.

## Project structure

```text
pulse-news/
├── index.html
├── style.css
├── app.js
├── data.js
├── images/
├── CREDITS.md
└── README.md
```

## Live demo

After enabling GitHub Pages, use:
`https://vuphuong25aza.github.io/pulse-news/`

(This address is a planned deployment target, not yet a verified live link.)

## Project notes and limitations

This is a **frontend-only learning/demo website**. Articles and statistics are illustrative, not live reporting. Comments, bookmarks and preferences are saved only in the visitor's browser and are not shared across devices. There is no backend, authentication, editorial system or news API integration.

**Development disclosure:** AI tools assisted in generating the initial code. I reviewed the implementation and use this project to understand, test, modify and extend HTML, CSS and JavaScript. The project is not presented as independently hand-coded from scratch.

Images are illustrative; attribution/source references appear in [CREDITS.md](CREDITS.md). Check the applicable image license before any commercial reuse.

## Next improvements

- Cross-browser and accessibility tests
- Automated tests for searching, bookmarks and article rendering
- Improvements to code readability and component organization
- Future backend and content management integration
