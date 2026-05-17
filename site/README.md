# Groundwork site

The source for the Groundwork landing page at `https://igniticab.github.io/groundwork/`. Built with [Astro](https://astro.build), deployed via GitHub Actions to GitHub Pages on every push to `main` that touches `site/` or the workflow file.

## Local development

```bash
cd site
npm install
npm run dev      # http://localhost:4321/groundwork/
npm run build    # output to dist/
npm run preview  # preview the production build
```

## Deployment

Automated. The `.github/workflows/deploy-site.yml` workflow runs on push to `main` with changes under `site/`. To trigger manually: Actions tab on GitHub → "Deploy site to GitHub Pages" → "Run workflow".

## Custom domain

When ready to switch to `groundwork.dev`:

1. In `astro.config.mjs`, set `site: 'https://groundwork.dev'` and remove the `base` field.
2. Add `site/public/CNAME` containing the single line `groundwork.dev`.
3. Configure DNS for `groundwork.dev` to point at GitHub Pages (A records to GitHub's IPs, plus an AAAA record set, or a CNAME to `igniticab.github.io`).
4. In the repo's GitHub Settings → Pages, set the custom domain to `groundwork.dev` and tick "Enforce HTTPS" once the cert is issued.
