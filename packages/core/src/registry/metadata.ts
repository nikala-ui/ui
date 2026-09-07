export interface ComponentMeta {
  title: string;
  description: string;
  dependencies?: string[];
  registryDependencies?: string[];
}

/**
 * Static metadata configuration for all registered Nikala UI components.
 * Extend this record when adding new TSX components.
 */
export const COMPONENT_METADATA: Record<string, ComponentMeta> = {
  button: {
    title: "Button",
    description: "An interactive button component with variant and size options.",
    dependencies: ["clsx", "tailwind-merge", "class-variance-authority"],
    registryDependencies: ["spinner"],
  },
  "button-group": {
    title: "Button Group",
    description: "Groups related buttons into a connected horizontal or vertical control.",
    dependencies: ["clsx", "tailwind-merge"],
    registryDependencies: ["button"],
  },
  input: {
    title: "Input",
    description: "A standard text input field with styling variants.",
    dependencies: ["clsx", "tailwind-merge"],
  },
  spinner: {
    title: "Spinner",
    description: "An accessible animated loading indicator for asynchronous UI states.",
    dependencies: ["clsx", "tailwind-merge", "class-variance-authority"],
  },
  empty: {
    title: "Empty",
    description: "A compound empty-state layout for collections, search results, and initial application states.",
    dependencies: ["clsx", "tailwind-merge"],
  },
  status: {
    title: "Status",
    description: "A compact semantic status indicator with a color dot and label.",
    dependencies: ["clsx", "tailwind-merge", "class-variance-authority"],
  },
  "icon-button": {
    title: "Icon Button",
    description: "An accessible square button intended for a single icon action.",
    dependencies: ["clsx", "tailwind-merge"],
    registryDependencies: ["button"],
  },
  form: {
    title: "Form",
    description: "A semantic form layout wrapper designed to work with the createForm hook.",
    dependencies: ["clsx", "tailwind-merge"],
  },
  "form-message": {
    title: "Form Message",
    description: "Validation message helper connected to createForm errors and touched state.",
    registryDependencies: ["field", "create-form"],
  },
  field: {
    title: "Field",
    description: "A consistent form field layout for labels, descriptions, and validation errors.",
    dependencies: ["clsx", "tailwind-merge"],
    registryDependencies: ["label"],
  },
  card: {
    title: "Card",
    description: "A versatile container component with header, content, and footer sections.",
    dependencies: ["clsx", "tailwind-merge"],
  },
  container: {
    title: "Container",
    description: "A responsive layout container constraining maximum width with semantic padding tokens.",
    dependencies: ["clsx", "tailwind-merge", "class-variance-authority"],
  },
  badge: {
    title: "Badge",
    description: "A small badge component for status indicators and tags.",
    dependencies: ["clsx", "tailwind-merge", "class-variance-authority"],
  },
  avatar: {
    title: "Avatar",
    description: "An image element with fallback representation for representing users.",
    dependencies: ["clsx", "tailwind-merge"],
  },
  separator: {
    title: "Separator",
    description: "Visually or semantically separates content horizontally or vertically.",
    dependencies: ["clsx", "tailwind-merge"],
  },
  textarea: {
    title: "Textarea",
    description: "A multi-line text input field with responsive focus styles.",
    dependencies: ["clsx", "tailwind-merge"],
  },
  label: {
    title: "Label",
    description: "Accessible caption label for form controls and inputs.",
    dependencies: ["clsx", "tailwind-merge", "class-variance-authority"],
  },
  skeleton: {
    title: "Skeleton",
    description: "Renders an animated pulse loading placeholder for content loading states.",
    dependencies: ["clsx", "tailwind-merge"],
  },
  switch: {
    title: "Switch",
    description: "A control that allows the user to toggle between checked and unchecked states.",
    dependencies: ["clsx", "tailwind-merge"],
    registryDependencies: ["create-controllable-signal"],
  },
  checkbox: {
    title: "Checkbox",
    description: "A control that allows the user to toggle between checked and unchecked options.",
    dependencies: ["clsx", "tailwind-merge"],
    registryDependencies: ["create-controllable-signal"],
  },
  "radio-group": {
    title: "Radio Group",
    description: "A set of checkable buttons built on Kobalte primitives where only one button can be checked at a time.",
    dependencies: ["clsx", "tailwind-merge", "@kobalte/core"],
  },
  select: {
    title: "Select",
    description: "Displays a list of options for the user to pick from, built on Kobalte primitives.",
    dependencies: ["clsx", "tailwind-merge", "@kobalte/core"],
    registryDependencies: ["scroll-area", "create-click-outside"],
  },
  combobox: {
    title: "Combobox",
    description: "Searchable autocomplete dropdown with single/multi-selection tags, avatars, group headers, and customizable clear controls.",
    dependencies: ["clsx", "tailwind-merge", "@kobalte/core"],
    registryDependencies: ["scroll-area"],
  },
  tabs: {
    title: "Tabs",
    description: "A set of layered sections of content displayed one at a time.",
    dependencies: ["clsx", "tailwind-merge"],
    registryDependencies: ["create-controllable-signal"],
  },
  accordion: {
    title: "Accordion",
    description: "A vertically stacked set of interactive headings built on Kobalte primitives.",
    dependencies: ["clsx", "tailwind-merge", "@kobalte/core"],
  },
  breadcrumb: {
    title: "Breadcrumb",
    description: "Displays the path to the current resource using a hierarchy of links.",
    dependencies: ["clsx", "tailwind-merge"],
  },
  alert: {
    title: "Alert",
    description: "Displays a callout banner for user feedback with variants, dismiss button, and timer.",
    dependencies: ["clsx", "tailwind-merge", "class-variance-authority"],
  },
  dialog: {
    title: "Dialog",
    description: "A modal window overlaying the main content, built on Kobalte primitives with blur and outside-click options.",
    dependencies: ["clsx", "tailwind-merge", "@kobalte/core"],
    registryDependencies: ["scroll-area"],
  },
  sheet: {
    title: "Sheet / Drawer",
    description: "Extends the dialog component to display content that slides in from screen edges.",
    dependencies: ["clsx", "tailwind-merge", "class-variance-authority", "@kobalte/core"],
    registryDependencies: ["scroll-area"],
  },
  "dropdown-menu": {
    title: "Dropdown Menu",
    description: "Displays a menu to the user—such as a set of actions or functions—triggered by a button or avatar.",
    dependencies: ["clsx", "tailwind-merge", "@kobalte/core"],
    registryDependencies: ["scroll-area", "create-click-outside"],
  },
  "theme-manager": {
    title: "Theme Manager",
    description: "Zero-dependency ThemeProvider and ThemeToggle component for switching light, dark, and system themes.",
    dependencies: ["clsx", "tailwind-merge", "@kobalte/core", "lucide-solid"],
    registryDependencies: ["button", "dropdown-menu", "create-color-mode"],
  },
  banner: {
    title: "Banner",
    description: "An announcement banner with sticky positioning, dismissal persistence, auto-hide timer, Lucide icons, and variant styles.",
    dependencies: ["clsx", "tailwind-merge", "class-variance-authority", "lucide-solid"],
  },
  list: {
    title: "List / List Item",
    description: "Compound list components supporting icons, avatars, titles, subtitles, hotkey badges, chevron indicators, and interactive links.",
    dependencies: ["clsx", "tailwind-merge", "class-variance-authority", "lucide-solid", "@kobalte/core"],
  },
  kbd: {
    title: "Kbd (Keyboard Key)",
    description: "Keyboard key and shortcut group indicators for displaying hotkeys.",
    dependencies: ["clsx", "tailwind-merge", "class-variance-authority"],
  },
  "input-group": {
    title: "Input Group",
    description: "Compound input wrapper for combining text inputs with prefix and suffix addons.",
    dependencies: ["clsx", "tailwind-merge", "class-variance-authority"],
    registryDependencies: ["kbd"],
  },
  command: {
    title: "Command / Command Palette",
    description: "Fast, accessible command palette and search modal built on Kobalte Dialog primitives with auto-filtering.",
    dependencies: [
      "clsx",
      "tailwind-merge",
      "class-variance-authority",
      "lucide-solid",
      "@kobalte/core",
    ],
    registryDependencies: ["kbd", "input-group", "list", "scroll-area", "create-keybindings"],
  },
  toast: {
    title: "Toast / Sonner",
    description: "A succinct message displayed temporarily in a toast region, built on Kobalte primitives.",
    dependencies: ["clsx", "tailwind-merge", "class-variance-authority", "lucide-solid", "@kobalte/core"],
  },
  tooltip: {
    title: "Tooltip",
    description: "A popup that displays information related to an element when the element receives keyboard focus or the mouse hovers over it, built on Kobalte primitives.",
    dependencies: ["clsx", "tailwind-merge", "@kobalte/core"],
  },
  popover: {
    title: "Popover",
    description: "Displays rich content in a portal layer triggered by a button, built on Kobalte primitives.",
    dependencies: ["clsx", "tailwind-merge", "@kobalte/core", "lucide-solid"],
    registryDependencies: ["create-click-outside"],
  },
  progress: {
    title: "Progress",
    description: "Displays an indicator showing the completion progress of a task or media playback, built on Kobalte primitives.",
    dependencies: ["clsx", "tailwind-merge", "@kobalte/core"],
  },
  slider: {
    title: "Slider",
    description: "Numeric range selection slider supporting single/dual thumbs, custom steps, vertical orientation, and formatted value labels, built on Kobalte primitives.",
    dependencies: ["clsx", "tailwind-merge", "@kobalte/core"],
  },
  collapsible: {
    title: "Collapsible",
    description: "An interactive component that expands and collapses content panels with smooth height animations, built on Kobalte primitives.",
    dependencies: ["clsx", "tailwind-merge", "@kobalte/core"],
  },
  "aspect-ratio": {
    title: "Aspect Ratio",
    description: "Displays content within a specific aspect ratio using CSS aspect-ratio while preventing layout shifts.",
    dependencies: ["clsx", "tailwind-merge"],
  },
  toggle: {
    title: "Toggle",
    description: "A two-state interactive button component built on Kobalte primitives.",
    dependencies: ["clsx", "tailwind-merge", "@kobalte/core"],
  },
  "number-input": {
    title: "Number Input",
    description: "A numeric stepper input component supporting min, max, step, negative values, and long-press auto-repeat, built on Kobalte primitives.",
    dependencies: ["clsx", "tailwind-merge", "@kobalte/core", "lucide-solid"],
    registryDependencies: ["input", "button", "create-long-press"],
  },
  "context-menu": {
    title: "Context Menu",
    description: "Displays a contextual popup menu triggered by right-clicking target areas, built on Kobalte primitives.",
    dependencies: ["clsx", "tailwind-merge", "@kobalte/core"],
    registryDependencies: ["separator", "kbd", "create-click-outside", "scroll-area"],
  },
  resizable: {
    title: "Resizable",
    description: "Accessible resizable panel layout component supporting drag-to-resize handles.",
    dependencies: ["clsx", "tailwind-merge", "lucide-solid"],
    registryDependencies: ["create-resize-observer"],
  },
  "scroll-area": {
    title: "Scroll Area",
    description: "Augments native scroll functionality with custom styled scrollbars and reactive scroll tracking.",
    dependencies: ["clsx", "tailwind-merge"],
    registryDependencies: ["create-scroll-position", "create-resize-observer"],
  },
  "pin-input": {
    title: "Pin Input",
    description: "Interactive multi-slot PIN/OTP input component for SMS and 2FA authentication verification codes.",
    dependencies: ["clsx", "tailwind-merge"],
  },
  "hover-card": {
    title: "Hover Card",
    description: "Profile and link preview popover triggered on hover, built on Kobalte primitives.",
    dependencies: ["clsx", "tailwind-merge", "@kobalte/core"],
  },
  table: {
    title: "Table",
    description: "A responsive and accessible data table component with headers, rows, cells, and footer summaries.",
    dependencies: ["clsx", "tailwind-merge"],
  },
  dropzone: {
    title: "Dropzone",
    description: "A compound drag-and-drop file upload container with file list previews and validation feedback.",
    dependencies: ["clsx", "tailwind-merge", "lucide-solid"],
    registryDependencies: ["create-drop-zone"],
  },
  "toggle-group": {
    title: "Toggle Group",
    description: "A set of two-state buttons that can be toggled on or off with single or multiple selection modes.",
    dependencies: ["clsx", "tailwind-merge", "class-variance-authority"],
    registryDependencies: ["create-controllable-signal"],
  },
  timeline: {
    title: "Timeline",
    description: "A responsive chronological display for event streams, activity logs, order tracking, and multi-step workflows.",
    dependencies: ["clsx", "tailwind-merge", "class-variance-authority"],
  },
  "navigation-menu": {
    title: "Navigation Menu",
    description: "A responsive and accessible top header navigation menu with mega-menu dropdowns and link previews.",
    dependencies: ["clsx", "tailwind-merge", "class-variance-authority", "lucide-solid"],
    registryDependencies: ["create-click-outside"],
  },
  navbar: {
    title: "Navbar",
    description: "A responsive, accessible, and composable top navigation header suite supporting nested dropdown flyouts, floating card containers, and mobile navigation drawers.",
    dependencies: ["clsx", "tailwind-merge", "class-variance-authority", "lucide-solid"],
  },
  footer: {
    title: "Footer",
    description: "A responsive, accessible, and structured bottom navigation layout suite supporting multi-column link directories, brand sections, and newsletter inputs.",
    dependencies: ["clsx", "tailwind-merge", "class-variance-authority"],
  },
  stat: {
    title: "Stat",
    description: "Display key performance indicators, statistics, financial data, and metrics with trends and icons.",
    dependencies: ["clsx", "tailwind-merge", "class-variance-authority", "lucide-solid"],
  },
  marquee: {
    title: "Marquee",
    description: "A smooth, GPU-accelerated infinite scrolling ticker component for logo clouds, testimonials, and live ribbons.",
    dependencies: ["clsx", "tailwind-merge"],
  },
  "review-card": {
    title: "Review Card",
    description: "A versatile, structured card component for customer testimonials, product ratings, verified buyer badges, and social proof.",
    dependencies: ["clsx", "tailwind-merge", "class-variance-authority", "lucide-solid"],
    registryDependencies: ["avatar", "rating"],
  },
  rating: {
    title: "Rating",
    description: "An accessible star rating component supporting interactive inputs, hover preview states, and read-only score badges.",
    dependencies: ["clsx", "tailwind-merge", "class-variance-authority", "lucide-solid"],
  },
  pagination: {
    title: "Pagination",
    description: "An accessible multi-page navigation bar with previous, next, page numbers, and ellipsis controls.",
    dependencies: ["clsx", "tailwind-merge", "class-variance-authority", "lucide-solid"],
    registryDependencies: ["create-pagination"],
  },
  pager: {
    title: "Pager",
    description: "Previous and next article navigation links with card previews for documentation and blog layouts.",
    dependencies: ["clsx", "tailwind-merge", "lucide-solid"],
    registryDependencies: ["card"],
  },
  message: {
    title: "Message",
    description: "A structured chat and conversation message layout with avatars, alignment, headers, footers, and actions.",
    dependencies: ["clsx", "tailwind-merge"],
  },
  bubble: {
    title: "Bubble",
    description: "Chat message bubble container supporting variants, grouped consecutive bubbles, and emoji reactions.",
    dependencies: ["clsx", "tailwind-merge", "class-variance-authority"],
  },
  marker: {
    title: "Marker",
    description: "System chat events, date dividers, and live typing indicator badges.",
    dependencies: ["clsx", "tailwind-merge"],
  },
  sidebar: {
    title: "Sidebar",
    description: "A composable, collapsible, and accessible application sidebar navigation suite with icon mode, mobile drawer, and keyboard shortcuts.",
    dependencies: ["clsx", "tailwind-merge", "class-variance-authority", "lucide-solid"],
    registryDependencies: ["tooltip", "skeleton", "separator"],
  },
  titlebar: {
    title: "Titlebar",
    description: "A native-feeling custom titlebar for frameless desktop windows supporting macOS Traffic Lights and Windows 11 controls.",
    dependencies: ["clsx", "tailwind-merge", "class-variance-authority", "lucide-solid"],
    registryDependencies: ["titlebar-tabs", "button", "tooltip", "create-tauri-window", "create-document-tabs"],
  },
  "titlebar-tabs": {
    title: "Titlebar Tabs",
    description: "Native draggable tab bar integrated directly inside desktop titlebars for multi-document applications.",
    dependencies: ["clsx", "tailwind-merge", "class-variance-authority", "lucide-solid"],
    registryDependencies: ["button", "tooltip", "create-document-tabs"],
  },
  "updater-modal": {
    title: "Updater Modal",
    description: "An automated application auto-updater dialog for Tauri v2 with release notes preview, download progress bar, and relaunch actions.",
    dependencies: ["clsx", "tailwind-merge", "lucide-solid"],
    registryDependencies: ["dialog", "button", "badge", "progress", "alert", "create-app-updater"],
  },
  "rich-text-editor": {
    title: "Rich Text Editor",
    description: "A full-featured WYSIWYG rich text editor with toolbar, bubble formatting, tables, task lists, and image uploads built on Tiptap.",
    dependencies: [
      "@tiptap/core",
      "@tiptap/starter-kit",
      "@tiptap/extension-link",
      "@tiptap/extension-image",
      "@tiptap/extension-placeholder",
      "@tiptap/extension-task-list",
      "@tiptap/extension-task-item",
      "@tiptap/extension-table",
      "@tiptap/extension-table-row",
      "@tiptap/extension-table-cell",
      "@tiptap/extension-table-header",
      "@tiptap/extension-underline",
      "@tiptap/extension-text-align",
      "@tiptap/extension-highlight",
      "@tiptap/extension-character-count",
      "@tiptap/extension-subscript",
      "@tiptap/extension-superscript",
      "@tiptap/extension-typography",
      "tiptap-markdown",
      "clsx",
      "tailwind-merge",
      "lucide-solid",
    ],
    registryDependencies: ["create-tiptap-editor"],
  },
  callout: {
    title: "Callout",
    description: "A semantic callout and alert block with status variants, icons, and titles for documentation and notices.",
    dependencies: ["clsx", "tailwind-merge", "class-variance-authority", "lucide-solid"],
  },
  "code-block": {
    title: "Code Block",
    description: "A code block container with filename header, language indicator, and interactive copy to clipboard button.",
    dependencies: ["clsx", "tailwind-merge", "lucide-solid", "shiki", "@shikijs/langs", "@shikijs/themes"],
    registryDependencies: ["button", "badge", "tooltip", "tabs", "create-clipboard"],
  },
  "package-manager-tabs": {
    title: "Package Manager Tabs",
    description: "An interactive command tab bar supporting customizable package managers (bun, pnpm, npm, yarn, deno, bunx, npx) with copy functionality.",
    dependencies: ["clsx", "tailwind-merge", "lucide-solid"],
    registryDependencies: ["button", "tooltip", "tabs", "create-clipboard"],
  },
  "code-group": {
    title: "Code Group",
    description: "A compound tabbed code container for organizing multiple files, languages, and snippets built on Tabs.",
    dependencies: ["clsx", "tailwind-merge"],
    registryDependencies: ["tabs"],
  },
  steps: {
    title: "Steps",
    description: "A vertical multi-step instruction container with connecting progress line and numbered step indicators.",
    dependencies: ["clsx", "tailwind-merge"],
    registryDependencies: ["badge"],
  },
  "file-tree": {
    title: "File Tree",
    description: "An interactive hierarchical directory file tree component built on Collapsible.",
    dependencies: ["clsx", "tailwind-merge", "lucide-solid"],
    registryDependencies: ["collapsible"],
  },
  "section-heading": {
    title: "Section Heading",
    description: "A reusable heading block with title, optional badge, and description. Supports page and section variants.",
    dependencies: ["clsx", "tailwind-merge", "class-variance-authority"],
    registryDependencies: ["badge"],
  },
  "api-table": {
    title: "API Table",
    description: "A structured, clean API reference table component for documenting props, options, and events.",
    dependencies: ["clsx", "tailwind-merge"],
    registryDependencies: ["table", "section-heading"],
  },
  "component-viewer": {
    title: "Component Viewer",
    description: "An interactive preview canvas and code viewer container with responsive viewports, canvas grid, and AI prompts.",
    dependencies: ["clsx", "tailwind-merge", "lucide-solid"],
    registryDependencies: ["tabs", "button", "tooltip", "code-block", "create-clipboard"],
  },
  "table-of-contents": {
    title: "Table of Contents",
    description: "An accessible heading navigation tree with ScrollSpy tracking and smooth scrolling, composed of ScrollArea and List.",
    dependencies: ["clsx", "tailwind-merge", "class-variance-authority"],
    registryDependencies: ["scroll-area", "list", "create-scroll-position"],
  },
};

/**
 * Static metadata configuration for all registered Nikala UI primitives / hooks.
 */
export const HOOK_METADATA: Record<string, ComponentMeta> = {
  "create-controllable-signal": {
    title: "createControllableSignal",
    description: "SolidJS reactive primitive supporting both controlled and uncontrolled state management",
  },
  "create-click-outside": {
    title: "createClickOutside",
    description: "SolidJS reactive primitive for detecting click and pointer interactions outside target elements",
  },
  "create-clipboard": {
    title: "createClipboard",
    description: "SolidJS reactive primitive for copying text to clipboard with automatic status reset",
  },
  "create-keybindings": {
    title: "createKeybindings",
    description: "SolidJS reactive primitives for listening to keyboard shortcuts, key combinations, and Escape key presses",
  },
  "create-lock-scroll": {
    title: "createLockScroll",
    description: "SolidJS reactive primitive for locking body or container scrolling when overlays are active",
  },
  "create-disclosure": {
    title: "createDisclosure",
    description: "SolidJS reactive primitive for managing boolean open/close disclosure state with helper controls",
  },
  "create-media-query": {
    title: "createMediaQuery",
    description: "SolidJS reactive primitives for tracking CSS media queries and responsive Tailwind breakpoints",
  },
  "create-debounce": {
    title: "createDebounce",
    description: "SolidJS reactive primitives for debouncing and throttling rate-limited function execution",
  },
  "create-intersection-observer": {
    title: "createIntersectionObserver",
    description: "SolidJS reactive primitives for observing element visibility and viewport intersection status",
  },
  "create-timer": {
    title: "createTimer",
    description: "SolidJS reactive primitives for recurring interval ticks and formatted countdown timers",
  },
  "create-resize-observer": {
    title: "createResizeObserver",
    description: "SolidJS reactive primitives for tracking element width and height dimensions dynamically",
  },
  "create-window-size": {
    title: "createWindowSize",
    description: "SolidJS reactive primitive for tracking window viewport inner width and height",
  },
  "create-scroll-position": {
    title: "createScrollPosition",
    description: "SolidJS reactive primitive for tracking scroll position, scroll direction, and container bounds",
  },
  "create-focus-trap": {
    title: "createFocusTrap",
    description: "SolidJS reactive primitive for trapping keyboard focus inside target container element for accessibility",
  },
  "create-mouse-position": {
    title: "createMousePosition",
    description: "SolidJS reactive primitive for tracking global and element-relative mouse pointer coordinates",
  },
  "create-long-press": {
    title: "createLongPress",
    description: "SolidJS reactive primitive for detecting long press / hold touch and pointer interactions",
  },
  "create-hover": {
    title: "createHover",
    description: "SolidJS reactive primitive for tracking element hover state with entrance and exit delays",
  },
  "create-storage": {
    title: "createLocalStorage",
    description: "SolidJS reactive primitives for Web Storage state synchronization across components and browser tabs",
  },
  "create-previous": {
    title: "createPrevious",
    description: "SolidJS reactive primitive for tracking previous value of a signal accessor",
  },
  "create-network-status": {
    title: "createNetworkStatus",
    description: "SolidJS reactive primitives for tracking browser network connectivity and connection quality metrics",
  },
  "create-color-mode": {
    title: "createColorMode",
    description: "SolidJS reactive primitive for managing dark/light themes and system preferences",
  },
  "create-form": {
    title: "createForm",
    description: "SolidJS reactive primitive for form state management, field validation, errors, and submission",
  },
  "create-input-mask": {
    title: "createInputMask",
    description: "SolidJS reactive primitive for input value masking (phone numbers, credit cards, dates)",
  },
  "create-idle": {
    title: "createIdle",
    description: "SolidJS reactive primitive for detecting user inactivity with customizable timeout",
  },
  "create-active-element": {
    title: "createActiveElement",
    description: "SolidJS reactive primitive for tracking the currently focused DOM element",
  },
  "create-infinite-scroll": {
    title: "createInfiniteScroll",
    description: "SolidJS reactive primitive for dynamic infinite scrolling, auto-fetching pages, and scroll pagination",
  },
  "create-fullscreen": {
    title: "createFullscreen",
    description: "SolidJS reactive primitive for requesting and monitoring element or document fullscreen status",
  },
  "create-audio": {
    title: "createAudio & createVideo",
    description: "SolidJS reactive primitives for controlling HTML audio and video playback, duration, volume, and seeking",
  },
  "create-orientation": {
    title: "createOrientation",
    description: "SolidJS reactive primitive for observing mobile and desktop screen orientation changes and rotation angles",
  },
  "create-undo-redo": {
    title: "createUndoRedo",
    description: "SolidJS reactive primitive for undo/redo state history management, history stack tracking, and reverting actions",
  },
  "create-fetch": {
    title: "createFetch",
    description: "SolidJS reactive primitive for HTTP REST API fetching, request loading states, error handling, and refetching",
  },
  "create-geolocation": {
    title: "createGeolocation",
    description: "SolidJS reactive primitive for tracking browser Geolocation position, coordinates, speed, and GPS accuracy",
  },
  "create-permission": {
    title: "createPermission",
    description: "SolidJS reactive primitive for querying and observing browser permission status changes",
  },
  "create-battery": {
    title: "createBattery",
    description: "SolidJS reactive primitive for observing device battery status, charge level, and charging metrics",
  },
  "create-web-notification": {
    title: "createWebNotification",
    description: "SolidJS reactive primitive for sending browser desktop notifications and managing notification permissions",
  },
  "create-websocket": {
    title: "createWebSocket",
    description: "SolidJS reactive primitive for WebSocket client connections, auto-reconnection, and message passing",
  },
  "create-document-title": {
    title: "createDocumentTitle",
    description: "SolidJS reactive primitive for managing document title dynamically",
  },
  "create-favicon": {
    title: "createFavicon",
    description: "SolidJS reactive primitive for dynamically updating browser favicon element",
  },
  "create-event-source": {
    title: "createEventSource",
    description: "SolidJS reactive primitive for subscribing to Server-Sent Events (SSE) streams",
  },
  "create-scroll-into-view": {
    title: "createScrollIntoView",
    description: "SolidJS reactive primitive for scrolling a target element into view smooth or auto behavior",
  },
  "create-drop-zone": {
    title: "createDropZone",
    description: "SolidJS reactive primitive for file drag & drop operations, validation, and file chooser dialogs",
  },
  "create-pagination": {
    title: "createPagination",
    description: "SolidJS reactive primitive for computing pagination state, dynamic page ranges with ellipses, and navigation controls",
  },
  "create-chat-scroll": {
    title: "createChatScroll",
    description: "SolidJS reactive primitive for automated chat container scrolling with manual scroll-up detection",
  },
  "create-tauri-window": {
    title: "createTauriWindow",
    description: "SolidJS reactive primitive for interacting with and controlling Tauri v2 application window states",
  },
  "create-global-shortcut": {
    title: "createGlobalShortcut",
    description: "SolidJS reactive primitive for registering OS-level global keyboard shortcuts via Tauri v2 plugin",
  },
  "create-app-updater": {
    title: "createAppUpdater",
    description: "SolidJS reactive primitive for controlling and observing Tauri v2 application updates",
  },
  "create-document-tabs": {
    title: "createDocumentTabs",
    description: "SolidJS reactive primitive for managing multi-document tabs, editor buffers, and browser tab stacks with adjacent activation and pinned state",
  },
  "create-tiptap-editor": {
    title: "createTiptapEditor",
    description: "Fine-grained reactive SolidJS primitive for managing Tiptap rich text editor instances, signals, and formatting commands.",
    dependencies: [
      "@tiptap/core",
      "@tiptap/starter-kit",
      "@tiptap/extension-link",
      "@tiptap/extension-image",
      "@tiptap/extension-placeholder",
      "@tiptap/extension-task-list",
      "@tiptap/extension-task-item",
      "@tiptap/extension-table",
      "@tiptap/extension-table-row",
      "@tiptap/extension-table-cell",
      "@tiptap/extension-table-header",
      "@tiptap/extension-underline",
      "@tiptap/extension-text-align",
      "@tiptap/extension-highlight",
      "@tiptap/extension-character-count",
      "@tiptap/extension-subscript",
      "@tiptap/extension-superscript",
      "@tiptap/extension-typography",
      "tiptap-markdown",
    ],
  },
};

/**
 * Static metadata configuration for ready-to-use application and marketing blocks.
 */
export const BLOCK_METADATA: Record<string, ComponentMeta> = {
  "hero-01": {
    title: "Hero 01 — Simple Centered with Actions",
    description: "A clean centered hero section with badge pill, high-contrast headline, and dual CTA buttons.",
    dependencies: ["clsx", "tailwind-merge", "lucide-solid"],
    registryDependencies: ["button", "badge"],
  },
  "login-01": {
    title: "Login 01 — Split Screen with Social Auth & Testimonial",
    description: "A modern split-screen authentication page block with OAuth providers, email sign-in form, and brand testimonial visual.",
    dependencies: ["clsx", "tailwind-merge", "lucide-solid"],
    registryDependencies: ["button", "input", "label", "checkbox", "separator", "form", "field", "form-message"],
  },
  "register-01": {
    title: "Register 01 — Sign-Up Card with Password Strength",
    description: "A comprehensive sign-up card featuring social logins, live password strength meter with validation checklist, and terms agreement.",
    dependencies: ["clsx", "tailwind-merge", "lucide-solid"],
    registryDependencies: ["card", "input", "label", "button", "checkbox", "progress", "badge", "separator", "form", "field", "form-message"],
  },
  "otp-verification-01": {
    title: "OTP Verification 01 — Two-Factor Security Code",
    description: "A clean 2-Factor Authentication block with a 6-digit PIN input, countdown resend timer, and security notifications.",
    dependencies: ["clsx", "tailwind-merge", "lucide-solid"],
    registryDependencies: ["card", "pin-input", "button", "alert", "badge", "form"],
  },
  "forgot-password-01": {
    title: "Forgot Password 01 — Account Recovery Flow",
    description: "A sleek password recovery block with email instructions submission and success confirmation states.",
    dependencies: ["clsx", "tailwind-merge", "lucide-solid"],
    registryDependencies: ["card", "input", "label", "button", "alert", "form", "field", "form-message"],
  },
};
