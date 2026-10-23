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

- Broader manual cross-browser and assistive-technology coverage
- Automated tests for searching, bookmarks and article rendering
- Improvements to code readability and component organization
- Future backend and content management integration

## Accessibility checks

The frontend still runs without Node. Only the optional development checks need
Node.js 22+, npm and Python 3 (available as `python3`). From the repository root:

```bash
npm ci
npx playwright install --with-deps chromium firefox webkit
npm run test:a11y
```

Playwright starts and stops a local static server on port 8080 automatically.
For a shorter Chromium-only run:

```bash
npx playwright install chromium
npm run test:a11y:chromium
```

To inspect a failure interactively or open its retained trace:

```bash
npm run test:a11y -- --project=chromium --headed
npx playwright show-trace test-results/<failed-test-directory>/trace.zip
```

The same suite runs on pushes to main and pull requests in GitHub Actions.

### Scope and small fixes

- **Keyboard:** a first-tab skip link targets the existing main landmark. Search
  keeps its focus outline; blue navigation uses a white inset ring. Category
  updates reuse buttons; bookmarks restore focus after rendering; load-more
  moves focus to the first added story.
- **Reader:** the existing native dialog is named by the article heading. Opening
  focuses that heading; Escape/close restores the opener. Tests exercise Tab
  containment and font-size controls without replacing native dialog behavior.
- **Names and labels:** existing search, sort and newsletter names are retained.
  Comment fields now have visible labels, and the saved-news button keeps its
  name when its text is hidden on small screens.
- **Themes and contrast:** the dark-mode button exposes its persisted state with
  `aria-pressed`. Darker muted text and theme-aware ranking/placeholder colors
  reduce light-mode contrast risks. Axe checks homepage and reader in both themes
  against WCAG 2 A/AA and 2.1 A/AA rules, including color contrast.
- **Speech:** start/stop, completion and errors update the pressed state. Closing
  or changing articles cancels speech; old article callbacks cannot reset the new
  control. Status messages move inside the modal so they remain available while
  the background is inert. Tests stub the speech API and cover unsupported
  browsers; they do not claim to validate audible Vietnamese output.

Automated checks are a regression safety net, not accessibility certification.
Before release, also check:

1. Keyboard-only at desktop and 390px width in both themes: focus stays visible,
   horizontally scrolling categories are reachable, and no controls are obscured.
2. At 200%/400% zoom, check reflow, text clipping, outlines and form errors.
3. With NVDA/Firefox or VoiceOver/Safari, check landmarks, dialog title, labels,
   results/status announcements and focus return, including a direct article URL.
4. Try real Vietnamese speech: start, stop, natural finish, article change and
   close; voice availability depends on the browser/OS.
5. Inspect contrast and focus against gradients/images, hover/pressed states and
   forced-colors mode. Axe may mark complex contrast cases as incomplete; review
   those manually rather than disabling contrast rules.
