import type { Component, JSX, ParentComponent } from "solid-js";
import type { DocsConfig, PageData, TocItem, SidebarItem } from "../types.js";

export type BreadcrumbItemData = { title: string; href?: string };

export interface DocsNavbarProps {
  config: DocsConfig;
  onOpenSearch?: () => void;
  showBrand?: boolean;
  showSidebarTrigger?: boolean;
  mobileSidebarTrigger?: boolean;
  class?: string;
}

export interface DocsSidebarProps {
  tree: SidebarItem[];
  nav?: DocsConfig["nav"];
  currentUrl?: string;
  title?: string;
  logo?: DocsConfig["logo"];
  headerSubtitle?: string;
  footerText?: string;
  showHeader?: boolean;
  showFooter?: boolean;
  class?: string;
}

export interface DocsTableOfContentsProps {
  items: TocItem[];
  title?: string;
  class?: string;
  onActiveChange?: (id: string) => void;
}

export interface DocsBreadcrumbsProps {
  items: BreadcrumbItemData[];
  class?: string;
}

export interface DocsPaginationProps {
  prev?: { title: string; href: string };
  next?: { title: string; href: string };
  class?: string;
}

export type DocsPagerProps = DocsPaginationProps;

export interface DocsSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pages?: PageData[];
  onSelectPage?: (url: string) => void;
}

export interface DocsLayoutProps {
  config: DocsConfig;
  tree: SidebarItem[];
  currentPage?: PageData;
  breadcrumbs?: BreadcrumbItemData[];
  toc?: TocItem[];
  prev?: { title: string; href: string };
  next?: { title: string; href: string };
  children?: JSX.Element;
  class?: string;
}

export interface DocsThemeContract {
  name: string;
  Provider?: ParentComponent<{ defaultTheme?: "light" | "dark" | "system"; storageKey?: string }>;
  Layout: Component<DocsLayoutProps>;
  Navbar?: Component<DocsNavbarProps>;
  Sidebar?: Component<DocsSidebarProps>;
  TableOfContents?: Component<DocsTableOfContentsProps>;
  Breadcrumbs?: Component<DocsBreadcrumbsProps>;
  Pagination?: Component<DocsPaginationProps>;
  Pager?: Component<DocsPagerProps>;
  SearchDialog?: Component<DocsSearchDialogProps>;
}
