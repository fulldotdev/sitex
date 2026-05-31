# Changesets

SiteX uses Changesets to version and publish the npm package.

Add a changeset for user-facing framework, install, documentation, or public API changes:

```bash
pnpm changeset
```

Use `@fulldotdev/sitex` as the changed package.

Merging a feature or release-prep PR into `main` lets the release workflow open the Changesets release PR once the workflow exists. Merging that release PR versions the package, refreshes the lockfile, publishes to npm, and creates the GitHub Release.
