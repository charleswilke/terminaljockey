# Terminal Jockey

A small, dependency-free website at [terminaljockey.com](https://terminaljockey.com).

## Local development

```sh
python3 -m http.server 8080
```

Open http://localhost:8080. No installation or build step is required.

## Files

- `index.html` — page content and metadata
- `styles.css` — responsive styles
- `main.js` — animated Canvas space flight and browser enhancements
- `assets/terminal-jockey-lime.png` — transparent electric-lime logo
- `favicon.svg` — site icon
- `vercel.json` — static hosting configuration

## Deployment

Vercel project: `terminaljockey` in the `haus-of-toots` team.

The GitHub repository is connected to Vercel. Pushes to `main` deploy to production; other branches receive preview deployments.

Production domain: https://terminaljockey.com. The `www` hostname redirects to the apex domain.

Keep credentials out of the repository. Local Vercel linkage and environment files are ignored by Git.

The star field respects reduced-motion preferences and pauses in background tabs. The transparent logo was prepared from the supplied artwork using the built-in image-generation tool.

Space flight uses perspective star trails and pre-rendered procedural nebula and spiral-galaxy textures. Scenery moves through several depths, with a Pause flight control and a static reduced-motion view. No new image dependencies or external libraries are required.
