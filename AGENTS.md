# Repository guidance

- Use plain HTML, CSS, and JavaScript. No framework or build step is needed.
- Run locally with `python3 -m http.server 8080`.
- Production deploys automatically from `main` through the Vercel GitHub integration.
- Feature branches receive preview deployments. Use the `codex/` prefix for new agent branches.
- Keep the starter accessible, responsive, and respectful of reduced-motion preferences.
- Never commit credentials, `.env` files, or `.vercel/`.
