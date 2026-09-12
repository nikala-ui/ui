# @nikala-ui/hooks

Reactive SolidJS primitives for browser state, events, media APIs, storage, forms, and application behavior.

Nikala UI follows a pure copy-paste ownership model. This package is the source distribution used by the registry and documentation tooling. Application developers add hooks with `@nikala-ui/cli`, which copies the source into their own project.

Documentation and interactive examples: [nikala.dev](https://nikala.dev)

## Add a hook to an application

Initialize Nikala UI if the project has not been configured yet, then add the required hook:

```bash
bunx @nikala-ui/cli init
bunx @nikala-ui/cli add --hook create-clipboard
```

The CLI copies the selected source into `src/hooks/` and rewrites its local imports. The application owns the copied file and does not add `@nikala-ui/hooks` as a runtime dependency.

## Usage

Import the copied source from the project's local hooks directory:

```tsx
import { createControllableSignal } from "@/hooks/create-controllable-signal";

const [value, setValue] = createControllableSignal({
  defaultValue: "initial value",
});
```

The copied primitive uses SolidJS accessors and setters so updates remain fine-grained and reactive.

## Available primitives

The package currently exports the following source modules:

### State and interaction

- `createControllableSignal`
- `createDisclosure`
- `createPrevious`
- `createUndoRedo`
- `createPagination`
- `createForm`
- `createInputMask`
- `createDebounce`
- `createHover`
- `createLongPress`
- `createKeybindings`
- `createGlobalShortcut`
- `createClickOutside`
- `createFocusTrap`
- `createLockScroll`

### Browser and viewport APIs

- `createActiveElement`
- `createWindowSize`
- `createMousePosition`
- `createMediaQuery`
- `createResizeObserver`
- `createIntersectionObserver`
- `createScrollPosition`
- `createScrollIntoView`
- `createInfiniteScroll`
- `createOrientation`
- `createFullscreen`
- `createNetworkStatus`
- `createPermission`
- `createGeolocation`
- `createBattery`

### Storage, media, and communication

- `createStorage`, including local and session storage helpers
- `createClipboard`
- `createColorMode`
- `createDocumentTitle`
- `createFavicon`
- `createWebNotification`
- `createWebSocket`
- `createEventSource`
- `createAudioVideo`, which provides audio and video helpers
- `createTauriWindow`
- `createAppUpdater`
- `createChatScroll`
- `createDocumentTabs`
- `createTimer`
- `createIdle`
- `createFetch`
- `createDropZone`

### Editor integration

- `createTiptapEditor`

The public exports are defined in [`src/index.ts`](./src/index.ts). The source filenames use kebab-case and can also be copied individually by the CLI.

## Examples

### Controllable and uncontrolled state

```tsx
import { createControllableSignal } from "@/hooks/create-controllable-signal";

const [value, setValue] = createControllableSignal({
  defaultValue: 0,
  onChange: (nextValue) => console.log(nextValue),
});

setValue((previousValue) => (previousValue ?? 0) + 1);
```

### Clipboard state

```tsx
import { createClipboard } from "@/hooks/create-clipboard";

const clipboard = createClipboard();

await clipboard.copy("Copied text");
```

### Form state

```tsx
import { createForm } from "@/hooks/create-form";

const form = createForm({
  initialValues: { email: "" },
  validateOn: "blur",
  validate: (values) =>
    values.email.includes("@") ? {} : { email: "Enter a valid email." },
  onSubmit: async (values) => saveProfile(values),
});
```

`createForm` exposes accessors for values, errors, touched state, submission state, and validity, together with field update and event-handler helpers.

## SSR and browser APIs

Primitives that access `window`, `document`, browser events, or browser-only APIs are designed for SolidJS applications and guard browser operations for server-rendered environments. Browser-dependent behavior should still be used from the appropriate client lifecycle in an SSR application.

## Related packages

- `@nikala-ui/cli` copies selected hook sources into an application.
- `@nikala-ui/core` contains the internal registry manifests and source metadata.

## Package development

Typecheck the package from the monorepo root or from this directory:

```bash
cd packages/hooks
bunx tsc --noEmit
```

## License

[MIT](https://github.com/nikala-ui/ui/blob/main/LICENSE)
