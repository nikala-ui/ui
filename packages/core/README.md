# @nikala-ui/core

`@nikala-ui/core` is the internal source registry for Nikala UI. It contains the SolidJS component sources, reactive primitive manifests, application blocks, providers, metadata, and generated registry JSON used to build and publish the Nikala registry.

Nikala UI is a copy-paste component system built for SolidJS and Tailwind CSS v4. The package honors the work of Georgian painter Niko Pirosmani (Nikala).

Documentation and interactive examples: [nikala.dev](https://nikala.dev)

## Role of the package

The core package is not a standalone application dependency. It is the canonical registry source used inside the Nikala UI monorepo, by registry generation, by the official documentation site, and by release tooling.

End users should not install or import `@nikala-ui/core` directly. The public entry point for adding Nikala UI to an application is `@nikala-ui/cli`.

The normal consumer workflow is:

```bash
bunx @nikala-ui/cli init
bunx @nikala-ui/cli add button dialog
```

This copies editable files into the local project, usually under:

```text
src/components/ui/
src/hooks/
```

Applications own the copied source files. They do not import `@nikala-ui/core` at runtime to use the generated components.

## Registry contents

The registry contains three item types:

- `registry:ui` for SolidJS UI components.
- `registry:hook` for reactive SolidJS primitives.
- `registry:block` for ready-to-use application and marketing sections.

Each registry item is represented by a JSON manifest in `registry/`. A manifest contains the item metadata, source files, internal registry dependencies, and required npm dependencies.

The package also includes the source snapshot used to generate those manifests:

```text
packages/core/
├── registry/
│   ├── index.json
│   └── *.json
├── src/
│   ├── index.ts
│   ├── index.css
│   ├── lib/
│   └── registry/
│       ├── components/ui/
│       ├── blocks/
│       ├── providers/
│       ├── index.ts
│       └── metadata.ts
└── scripts/
    └── build-registry.ts
```

## Registry manifests

The central registry index is available at:

```text
registry/index.json
```

Individual items can be inspected directly:

```text
registry/button.json
registry/create-clipboard.json
registry/hero-01.json
```

The manifest format allows the CLI to install only the requested item and its transitive registry dependencies. For example, a component can declare another component or hook in `registryDependencies`, while external packages are listed separately as npm dependencies.

## Source ownership

Source files are written for local ownership rather than as an opaque runtime UI library. After installation, developers can customize component behavior, markup, accessibility details, and styles directly in their project.

Generated sources follow Nikala UI conventions:

- SolidJS props are handled with `splitProps` to preserve reactivity.
- Components use semantic Tailwind CSS v4 design tokens.
- Browser-only behavior is guarded for SSR environments.
- Kobalte and Corvu are used where headless behavior and accessibility primitives are required.
- Components use local aliases such as `@/components/ui/*`, `@/hooks/*`, and `@/lib/*`.

## Registry generation

When component, hook, block, or metadata sources change, regenerate the manifests from the monorepo root:

```bash
bun run build:registry
```

This runs:

```bash
cd packages/core
bun run build:registry
```

The generator scans the source directories, creates item manifests, writes `registry/index.json`, and synchronizes the official web application's copied sources when that workspace is present.

The registry must be regenerated before publishing changes to the core package. CI verifies that generated registry files are synchronized with the source tree.

## Related packages

- `@nikala-ui/cli` installs and updates registry items in a consuming project.
- `@nikala-ui/hooks` publishes the standalone reactive primitives package.

## License

[MIT](https://github.com/nikala-ui/ui/blob/main/LICENSE)
