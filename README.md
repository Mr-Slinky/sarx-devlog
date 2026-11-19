# Sarx Devlog

[![HTML](https://img.shields.io/badge/HTML-5-orange.svg)](https://html.spec.whatwg.org/)
[![CSS](https://img.shields.io/badge/CSS-3-orange.svg)](https://www.w3.org/Style/CSS/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES2020-orange.svg)](https://developer.mozilla.org/docs/Web/JavaScript)

The development log of Sarx, a god game for Windows written in Rust, as a static website. Each entry
covers one stretch of the work, with screenshots and recordings of the game as it stood at the time.

The site is plain HTML, CSS and JavaScript. It has no build step, so the files in the repository are
the files that a host serves.

## Viewing the site

A browser opens `index.html` straight from disk. The fonts come from Google Fonts, so the page needs
an internet connection to show its own typefaces.

## Layout

| Path                       | Contents                                                        |
|----------------------------|-----------------------------------------------------------------|
| `index.html`               | The front page                                                  |
| `log/prelude.html`         | The diary's undated sections, which come before the first month |
| `log/<YYYY-MM>.html`       | One month of the log, with one entry per day                    |
| `data/months.js`           | The list of months, which the sidebar and the front page read   |
| `data/commits/<YYYY-MM>.js`| Each day's commits for one month, written by the export script  |
| `css/style.css`            | Every style on the site, with the palette at the top            |
| `js/site.js`               | Builds the sidebar and the front page's list of months          |
| `js/logbook.js`            | Turns a month's entries into a logbook of two-page spreads      |
| `js/hand-shadow.js`        | Moves the hand's shadow across the front page's ground          |
| `tools/export_commits.py`  | Exports one month of commits from the Sarx repository           |
| `images/`                  | Screenshots and recordings that the entries show                |

## Writing an entry

Each entry is an `<article>` in its month's page, with the day as its `id` and the full date in
`data-date`. The logbook shows the entry's text on the left page. The right page shows the entry's
`<figure>`, if it has one, and that day's commits otherwise.

```html
<article class="entry" id="18" data-date="2026-11-18">
    <h3>Rendering</h3>
    <p>The text of the entry, one paragraph per element.</p>
    <figure>
        <img src="../images/2026-11/hand.png" alt="The hand above the checkered ground">
        <figcaption>The hand above the checkered ground</figcaption>
    </figure>
</article>
```

An entry with a `data-title` in place of a `data-date`, as in the prelude, has no day to show commits
for. Its text runs down the left page and on to the right instead.

A new month takes three steps:

1. Copy an existing month's page to `log/<YYYY-MM>.html`, and change its month throughout.
2. Add the month's id to the top of the list in `data/months.js`.
3. Run `python tools/export_commits.py <YYYY-MM>` to write that month's commits. The script reads
   the Sarx repository beside this one, and runs again whenever the month gains commits.

## Palette

The colours come from the first frame that Sarx draws. The sky is the renderer's clear colour, the
ground takes its two checker greens, and the wordmark takes the colour of the hand. The top of
`css/style.css` lists each one.
