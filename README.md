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
- `main.js` — small browser enhancements
- `favicon.svg` — site icon
- `vercel.json` — static hosting configuration

## Deployment

Vercel project: `terminaljockey` in the `haus-of-toots` team.

The GitHub repository is connected to Vercel. Pushes to `main` deploy to production; other branches receive preview deployments.

Production domain: https://terminaljockey.com. The `www` hostname redirects to the apex domain.

Keep credentials out of the repository. Local Vercel linkage and environment files are ignored by Git.
