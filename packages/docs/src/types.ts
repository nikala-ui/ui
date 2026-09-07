// packages/docs/src/types.ts

export interface Frontmatter {
  title?: string;
  description?: string;
  order?: number;
  categoryOrder?: number;
  icon?: string;
  badge?: string;
  addedAt?: string;
  prev?: string | { title: string; href: string } | boolean;
  next?: string | { title: string; href: string } | boolean;
  toc?: boolean;
  [key: string]: unknown;
}

export interface TocItem {
  id: string;
  text: string;
  depth: number;
}

export interface PageData {
  slug: string;
  url: string;
  filePath: string;
  frontmatter: Frontmatter;
  toc: TocItem[];
  title: string;
  description?: string;
}

export interface SidebarItem {
  title: string;
  href?: string;
  badge?: string;
  addedAt?: string;
  icon?: string;
  items?: SidebarItem[];
  collapsed?: boolean;
}

export interface NavItem {
  title: string;
  href: string;
  external?: boolean;
}

export interface DocsThemeConfig {
  accentColor?: string;
  grayColor?: string;
  defaultMode?: "light" | "dark" | "system";
  path?: string;
}

export type DocsNavigationLayout = "sidebar" | "top";

export interface DocsNavigationConfig {
  /** Keep the navbar beside the sidebar or place it above the full layout. */
  layout?: DocsNavigationLayout;
  sidebar?: {
    header?: boolean;
    footer?: boolean;
    headerSubtitle?: string;
    footerText?: string;
  };
}

export interface DocsHomeConfig {
  /** Render the root content page as a standalone landing page. */
  layout?: "docs" | "landing";
  showSidebar?: boolean;
  showNavbar?: boolean;
  showBreadcrumbs?: boolean;
  showToc?: boolean;
  showPager?: boolean;
}

export interface ShikiConfig {
  themes?: {
    light?: string;
    dark?: string;
  };
  langs?: string[];
}

export interface DocsConfig {
  title?: string;
  description?: string;
  siteUrl?: string;
  /** Favicon URL or path served by the consuming documentation site. */
  favicon?: string;
  contentDir?: string;
  /** CSS entrypoint owned by the consuming documentation project. */
  css?: string;
  home?: DocsHomeConfig;
  logo?: {
    text?: string;
    image?: string;
    href?: string;
  };
  repository?: {
    url: string;
    branch?: string;
    rootDir?: string;
  };
  nav?: NavItem[];
  sidebar?: SidebarItem[] | "auto";
  navigation?: DocsNavigationConfig;
  theme?: DocsThemeConfig;
  shiki?: ShikiConfig;
  search?: {
    enabled?: boolean;
    provider?: "local" | "pagefind" | "orama" | "algolia";
  };
}
