# WellB

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.3.3.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

# WellB — Wellness Tracker (Angular)

WellB is a small single-page wellness tracker built with Angular. It combines a calendar for daily wellness entries (water & steps), a summary dashboard, and a curated list of meditation videos.

This README summarizes the project structure, how to run and develop locally, and a few maintenance tips (especially for the meditation videos list).

## Key features

- Calendar UI for adding daily wellness data (water intake, steps) with per-day persistence (localStorage).
- Month navigation and summary cards showing monthly & all-time stats (days entered, avg water, avg steps, % goals met).
- Modal editor that uses Angular Material form fields for inputs and preserves existing ngModel bindings.
- Meditation Videos carousel (click thumbnails to open YouTube) — video metadata is stored in `src/app/meditation-videos.ts`.
- Tailwind utility classes are used throughout for styling; Angular Material is used for form-fields and icons.

## Quick start (development)

Requirements:

- Node.js (v18+ recommended)
- npm (or a compatible package manager)

Install dependencies:

```powershell
npm install
```

Run the dev server:

```powershell
npm start
# or `ng serve` if you prefer the cli directly
```

Open http://localhost:4200/ in your browser. The app reloads on file changes.

If you see template or TypeScript errors while developing, run the build to surface them:

```powershell
npm run build --if-present
```

## Files of interest

- `src/app/app.ts` — root component logic: calendar generation, persistence (localStorage), summary computations, and UI handlers.
- `src/app/app.html` — main template: welcome, calendar, summary cards, meditation videos section, and modal editor.
- `src/app/app.css` — application CSS (in addition to Tailwind utilities). Some custom rules (scrollbar hiding, tint overlay) live here or inline in the template.
- `src/app/meditation-videos.ts` — the curated list of meditation videos. Each entry is an object with: `{ id, title, url, thumb }`. The app reads this and renders thumbnails.

## Updating the meditation videos list

The video list is intentionally stored in `src/app/meditation-videos.ts` so it's easy to maintain. When you add a video:

1. Prefer validating the ID with YouTube oEmbed (https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=VIDEO_ID&format=json) — if the endpoint returns metadata the video is accessible.
2. Add a new object with `id`, `title`, `url`, and `thumb` (use `https://i.ytimg.com/vi/VIDEO_ID/hqdefault.jpg` for the thumbnail). Example:

```ts
{ id: 'inpok4MKVLM', title: '5-Minute Meditation You Can Do Anywhere', url: 'https://www.youtube.com/watch?v=inpok4MKVLM', thumb: 'https://i.ytimg.com/vi/inpok4MKVLM/hqdefault.jpg' }
```

3. Save and reload the app. Thumbnails will appear in the Meditation Videos row.

Notes:

- The app expects real, public YouTube resources. Private or region-blocked videos may cause broken thumbnails or oEmbed failures.
- You can optionally use `sddefault.jpg`/`maxresdefault.jpg` for higher-res thumbnails where available.

## Styling notes

- Tailwind CSS utilities are used across templates. If the project doesn't show Tailwind styles, ensure your build pipeline includes the Tailwind setup in `postcss` or the Angular build configuration.
- Angular Material is used for input UI in the modal. Ensure `MatFormFieldModule`, `MatInputModule`, and Material icons are imported in the root component or app module.
- The project contains small inline CSS utilities to hide scrollbars for the meditation row and (optionally) a site tint overlay.

## Accessibility & interactions

- The calendar renders blank (non-interactive) placeholder cells for days outside the displayed month; those cells are `aria-disabled` and have pointer-events disabled so keyboard and screen reader users aren't confused.
- The meditation row is keyboard & touch scrollable. Thumbnails open YouTube in a new tab by default.

## Troubleshooting

- If interactive Material components show errors in the browser console, make sure you added the Material modules to the component imports or the app module and that `BrowserAnimationsModule` is configured (some Material features rely on it).
- If Tailwind classes have no effect, verify Tailwind is configured in the project (check `tailwind.config.js` and `postcss.config.js`) and restart the dev server after any config changes.

## Tests

This project uses Angular's default testing setup. Run unit tests with:

```powershell
npm test
```

Or run e2e tests (if configured):

```powershell
npm run e2e
```

## Next improvements (ideas)

- Add inline video modal playback so videos play inside the app instead of opening YouTube tabs.
- Allow users to favorite videos or save a watch-later list (persisted in localStorage).
- Add import/export for daily data so users can back up or migrate their journal.

---

If you'd like, I can also:

- run a dev build and surface any template/type errors,
- add a README badge for the dev server/start command,
- or add a small
