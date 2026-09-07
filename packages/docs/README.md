# @nikala-ui/docs

`@nikala-ui/docs` is a file-based documentation engine for SolidJS projects. It uses MDX, Vite, and Tailwind CSS v4 to build customizable documentation sites with local, copy-paste-owned components and hooks.

## What it provides

- MDX documentation with file-based routes.
- Automatic sidebar categories from directories inside `docs/`.
- Static production builds with server-rendered page content.
- Development server with configuration and content hot reload.
- Customizable SolidJS themes and layouts.
- Syntax highlighting, table of contents, breadcrumbs, pagination, search, and dark mode.
- Local Nikala UI component and reactive hook sources generated inside the consuming project.
- Tailwind CSS v4 theme tokens generated as part of the project setup.

The generated project does not import `@nikala-ui/core` or `@nikala-ui/hooks` at runtime. Components are copied into `src/components/ui`, and hooks are copied into `src/hooks`, so the consuming project owns and can modify the source code.

## Create a documentation project

Install the package in an existing SolidJS project or use the initializer to create the documentation structure:

```bash
bun add @nikala-ui/docs
bunx @nikala-ui/docs init .
```

The initializer creates the following project files and directories:

```text
.
├── docs/
│   └── index.mdx
├── docs.config.ts
├── nikala.config.json
└── src/
    ├── components/ui/
    ├── hooks/
    ├── index.css
    ├── lib/
    ├── providers/
    └── themes/default/
```

The initializer also runs the Nikala UI project setup and installs the dependencies required by the generated local sources.

## Development and production commands

From the documentation project root:

```bash
# Start the development server
bunx @nikala-ui/docs dev

# Build the production site into dist/
bunx @nikala-ui/docs build

# Preview the production build
bunx @nikala-ui/docs preview
```

Generated projects contain the same commands in `package.json`:

```json
{
  "scripts": {
    "dev": "bunx @nikala-ui/docs dev",
    "build": "bunx @nikala-ui/docs build",
    "preview": "bunx @nikala-ui/docs preview"
  }
}
```

## Content structure

The default content directory is `docs/`. Every MDX file becomes a route, and directories become automatic sidebar categories.

```text
docs/
├── index.mdx
├── getting-started.mdx
├── components/
│   ├── button.mdx
│   └── dialog.mdx
└── guides/
    └── theming.mdx
```

This produces routes such as:

```text
/
/getting-started
/components/button
/components/dialog
/guides/theming
```

Page metadata can be defined with frontmatter:

```mdx
---
title: Button
description: A flexible action button for SolidJS applications.
order: 1
toc: true
---

# Button

Button documentation goes here.
```

Supported metadata includes `title`, `description`, `order`, `categoryOrder`, `icon`, `badge`, `addedAt`, `prev`, `next`, and `toc`.

## Configuration

Create or edit `docs.config.ts` in the project root:

```ts
export default {
  title: "Project Documentation",
  description: "Documentation for my SolidJS project",
  siteUrl: "https://example.com",
  contentDir: "docs",
  css: "src/index.css",
  navigation: {
    layout: "sidebar",
    sidebar: {
      header: true,
      footer: false,
      headerSubtitle: "Developer Documentation",
      footerText: "Documentation",
    },
  },
  search: {
    enabled: true,
    provider: "local",
  },
  theme: {
    path: "./src/themes/default",
    defaultMode: "system",
  },
};
```

Available configuration areas include:

- `title`, `description`, `siteUrl`, and `favicon` for document metadata and browser branding.
- `contentDir` for the MDX content root.
- `css` for the local Tailwind CSS entrypoint and semantic design tokens.
- `logo` for text, image, and logo link configuration.
- `repository` for source repository links.
- `nav` for top-level navigation items.
- `sidebar` for explicit sidebar entries or automatic directory discovery.
- `navigation` for sidebar or top navigation layout settings.
- `theme` for the selected local theme path and color mode.
- `shiki` for code themes and supported languages.
- `search` for search enablement and provider selection.

## Custom themes

The generated project includes the starter theme under `src/themes/default`. Modify it directly or rename the directory to any name you prefer, then update `theme.path` in `docs.config.ts`.

The generated `src/index.css` contains the Tailwind CSS v4 imports and semantic design tokens. Update those tokens to customize the light and dark color schemes without replacing the documentation engine.

## Local components and hooks

The initializer copies the component and hook sources needed by the generated documentation theme into the project:

```ts
import { Button } from "@/components/ui/button";
import { createClipboard } from "@/hooks/create-clipboard";
```

The sources are ordinary project files. They can be inspected, customized, and extended without depending on a runtime UI registry package.

## Package development

Build this package from the Nikala UI monorepo with:

```bash
bun run build:docs
```

The build bundles the documentation engine, registry manifests, and local source snapshots required by `@nikala-ui/docs init`.
