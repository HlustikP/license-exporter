# License Exporter

This project is a fork of the original [ODIT.Services - License Exporter](https://git.odit.services/odit/license-exporter) created with the intention of expanding it
with additional features that were missing in the original. While the core functionality remains the same,
this fork aims to enhance the project by addressing specific needs and requirements such as selection which kind of
dependencies are to be included (production, dev, etc.).

A simple license exporter that crawls your package.json and provides you with information about your dependencies' licenses.
You can export this information into json(even prettyfied) and markdown.

## Install
Via your favorite package manager (npm, yarn, pnpm, whatever):
```bash
pnpm i -g @hlustikp/license-exporter
```
Or as a local dev dependency:
```bash
pnpm i -D @hlustikp/license-exporter
```

## Build
The project is written in typescript and `bun` was used to build it.
To build the project, run:
```bash
bun build ./src/index.ts --outdir ./bin --target node --external yargs
mv ./bin/index.js ./bin/exporter.mjs
```

## CLI Usage

Export only your direct dependencies to json: `license-exporter --json`
Export all dependencies to json: `license-exporter --json --recursive`

Export only your direct dependencies to markdown: `license-exporter -m`
Export all dependencies to markdown: `license-exporter -m --recursive`

Note: Use `npx license-exporter` if you install it as a local dev dependency.

## Options
| Arg                   | Description                                                                     | Type           | Default        |
|-----------------------|---------------------------------------------------------------------------------|----------------|----------------|
| \-j, --json           | Exports the license information into ./licenses.json as json.                   | flag/[boolean] | N/A            |
| \-p, --pretty         | Prettify the json output.                                                       | flag/[boolean] | N/A            |
| \-m, --markdown       | Exports the license information into ./licenses.md as markdown.                 | flag/[boolean] | N/A            |
| \-r, --recursive      | Include all of the dependencies' sub-dependencies.                              | flag/[boolean] | N/A            |
| \--prod, --production | Crawl production dependencies (`dependencies` section in `package.json`).       | flag/[boolean] | true           |
| \-d, --dev            | Crawl dev dependencies (`devDependencies` section in `package.json`).           | flag/[boolean] | false          |
| \--opt, --optional    | Crawl optional dependencies (`optionalDependencies` section in `package.json`). | flag/[boolean] | false          |
| \-o, --output         | Output folder for the exports.                                                  | [string]       | Current folder |
| \-i, --input          | Path to the input folder containing your package.json and node_modules          | [string]       | Current folder |
| \-h, --help           | Show help                                                                       | flag/[boolean] | N/A            |
| \-v, --version        | Show version number                                                             | flag/[boolean] | N/A            |