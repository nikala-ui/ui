// packages/docs/tests/route-tree.test.ts
import { describe, expect, test } from "bun:test";
import {
  buildBreadcrumbs,
  buildPagination,
  buildSidebarTree,
  flattenSidebarItems,
  formatGroupName,
} from "../src/core/route-tree.js";
import type { PageData } from "../src/types.js";

const mockPages: PageData[] = [
  {
    slug: "index",
    url: "/",
    filePath: "content/index.mdx",
    title: "Introduction",
    toc: [],
    frontmatter: { order: 1 },
  },
  {
    slug: "getting-started-installation",
    url: "/getting-started/installation",
    filePath: "content/getting-started/installation.mdx",
    title: "Installation",
    toc: [],
    frontmatter: { order: 1, categoryOrder: 1 },
  },
  {
    slug: "getting-started-configuration",
    url: "/getting-started/configuration",
    filePath: "content/getting-started/configuration.mdx",
    title: "Configuration",
    toc: [],
    frontmatter: { order: 2, categoryOrder: 1 },
  },
  {
    slug: "components",
    url: "/components",
    filePath: "content/components/index.mdx",
    title: "Components",
    toc: [],
    frontmatter: { order: 1, categoryOrder: 2 },
  },
  {
    slug: "components-button",
    url: "/components/button",
    filePath: "content/components/button.mdx",
    title: "Button",
    toc: [],
    frontmatter: { order: 1, categoryOrder: 2 },
  },
  {
    slug: "components-dialog",
    url: "/components/dialog",
    filePath: "content/components/dialog.mdx",
    title: "Dialog",
    toc: [],
    frontmatter: { order: 2, categoryOrder: 2 },
  },
];

describe("route-tree", () => {
  describe("formatGroupName", () => {
    test("converts slug segment to capitalized title", () => {
      expect(formatGroupName("getting-started")).toBe("Getting Started");
      expect(formatGroupName("components")).toBe("Components");
    });
  });

  describe("buildSidebarTree", () => {
    test("structures pages into root items and categories", () => {
      const tree = buildSidebarTree(mockPages);

      expect(tree).toHaveLength(2);

      expect(tree[0].title).toBe("Getting Started");
      expect(tree[0].items).toHaveLength(2);
      expect(tree[0].items?.[0].title).toBe("Installation");
      expect(tree[0].items?.[1].title).toBe("Configuration");

      expect(tree[1].title).toBe("Components");
      expect(tree[1].href).toBe("/components");
      expect(tree[1].items).toHaveLength(2);
      expect(tree[1].items?.[0].title).toBe("Button");
      expect(tree[1].items?.[1].title).toBe("Dialog");
    });
  });

  describe("flattenSidebarItems", () => {
    test("flattens nested items to a linear reading sequence", () => {
      const tree = buildSidebarTree(mockPages);
      const flat = flattenSidebarItems(tree);

      expect(flat).toHaveLength(5);
      expect(flat.map((i) => i.href)).toEqual([
        "/getting-started/installation",
        "/getting-started/configuration",
        "/components",
        "/components/button",
        "/components/dialog",
      ]);
    });
  });

  describe("buildPagination", () => {
    test("computes previous and next links for middle item", () => {
      const pagination = buildPagination(mockPages, "/getting-started/installation");

      expect(pagination.prev).toBeUndefined();
      expect(pagination.next).toEqual({
        title: "Configuration",
        href: "/getting-started/configuration",
      });
    });

    test("handles first and last items without overflow", () => {
      const firstPage = buildPagination(mockPages, "/");
      expect(firstPage.prev).toBeUndefined();
      expect(firstPage.next).toBeUndefined();

      const lastPage = buildPagination(mockPages, "/components/dialog");
      expect(lastPage.prev).toEqual({ title: "Button", href: "/components/button" });
      expect(lastPage.next).toBeUndefined();
    });
  });

  describe("buildBreadcrumbs", () => {
    test("generates breadcrumb trail for nested url", () => {
      const breadcrumbs = buildBreadcrumbs("/components/button", mockPages);

      expect(breadcrumbs).toHaveLength(3);
      expect(breadcrumbs[0]).toEqual({ title: "Docs", href: "/" });
      expect(breadcrumbs[1]).toEqual({ title: "Components", href: "/components" });
      expect(breadcrumbs[2]).toEqual({ title: "Button", href: undefined });
    });
  });
});
