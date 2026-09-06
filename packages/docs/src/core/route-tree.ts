// packages/docs/src/core/route-tree.ts
import type { PageData, SidebarItem } from "../types.js";
import { formatTitleFromFilename } from "./content-scanner.js";
import { flattenSidebarItems } from "../navigation/sidebar-tree.js";

export { flattenSidebarItems } from "../navigation/sidebar-tree.js";

export function formatGroupName(segment: string): string {
  return segment
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function buildSidebarTree(pages: PageData[], directories: string[] = []): SidebarItem[] {
  const rootPages: PageData[] = [];
  const categoryMap = new Map<string, PageData[]>();

  for (const directory of directories) {
    const category = directory.split("/")[0];
    if (category && !categoryMap.has(category)) categoryMap.set(category, []);
  }

  // Derive categories from pages as well. Tests and programmatic consumers
  // may provide pages without a separately scanned directory list.
  for (const page of pages) {
    const segments = page.url.slice(1).split("/");
    if (segments.length > 1 && !categoryMap.has(segments[0])) {
      categoryMap.set(segments[0], []);
    }
  }

  for (const page of pages) {
    if (page.url === "/") {
      // The home page is the site entry point, not a documentation item.
      // Keep it out of the sidebar so it is not duplicated as "Introduction".
      continue;
    }

    const segments = page.url.slice(1).split("/");
    const isCategoryIndex = segments.length === 1 && categoryMap.has(segments[0]);

    // A directory index is the overview page for its category. Keep it in
    // the category instead of rendering it as a second root-level item.
    if (isCategoryIndex) {
      const cat = segments[0];
      if (!categoryMap.has(cat)) categoryMap.set(cat, []);
      categoryMap.get(cat)!.push(page);
      continue;
    }

    if (segments.length === 1) {
      rootPages.push(page);
    } else {
      const cat = segments[0];
      if (!categoryMap.has(cat)) {
        categoryMap.set(cat, []);
      }
      categoryMap.get(cat)!.push(page);
    }
  }

  // Sort root pages by order, then title.
  rootPages.sort((a, b) => {
    const orderA = a.frontmatter.order ?? 9999;
    const orderB = b.frontmatter.order ?? 9999;
    if (orderA !== orderB) return orderA - orderB;
    return a.title.localeCompare(b.title);
  });

  const rootItems: SidebarItem[] = rootPages.map((page) => ({
    title: page.title || "Overview",
    href: page.url,
    badge: page.frontmatter.badge,
    addedAt: page.frontmatter.addedAt,
    icon: page.frontmatter.icon,
  }));

  // Determine order of categories
  const categories = Array.from(categoryMap.entries()).map(([cat, catPages]) => {
    const minCategoryOrder = Math.min(
      ...catPages.map((p) => {
        const catOrder = typeof p.frontmatter.categoryOrder === "number" ? p.frontmatter.categoryOrder : undefined;
        return catOrder ?? 9999;
      })
    );
    const minPageOrder = Math.min(...catPages.map((p) => p.frontmatter.order ?? 9999));
    return { cat, catPages, minCategoryOrder, minPageOrder };
  });

  categories.sort((a, b) => {
    if (a.minCategoryOrder !== b.minCategoryOrder) {
      return a.minCategoryOrder - b.minCategoryOrder;
    }
    if (a.minPageOrder !== b.minPageOrder) {
      return a.minPageOrder - b.minPageOrder;
    }
    return a.cat.localeCompare(b.cat);
  });

  for (const { cat, catPages } of categories) {
    const categoryIndex = catPages.find((page) => page.url === `/${cat}`);
    const group: SidebarItem = {
      title: formatGroupName(cat),
      href: categoryIndex?.url,
      items: [],
    };

    // Sort pages in this category by order, then title. The category index
    // owns the category URL but is not rendered as a duplicate sidebar item.
    catPages.sort((a, b) => {
      const orderA = a.frontmatter.order ?? 9999;
      const orderB = b.frontmatter.order ?? 9999;
      if (orderA !== orderB) return orderA - orderB;
      return a.title.localeCompare(b.title);
    });

    for (const page of catPages) {
      const segments = page.url.slice(1).split("/");
      const isCategoryIndex = segments.length === 1;

      if (isCategoryIndex) {
        continue;
      } else if (segments.length === 2) {
        group.items?.push({
          title: page.title,
          href: page.url,
          badge: page.frontmatter.badge,
          addedAt: page.frontmatter.addedAt,
          icon: page.frontmatter.icon,
        });
      } else {
        const subCategory = segments[1];
        let subGroup = group.items?.find(
          (item) => item.title === formatGroupName(subCategory) && item.items
        );

        if (!subGroup) {
          subGroup = {
            title: formatGroupName(subCategory),
            items: [],
          };
          group.items?.push(subGroup);
        }

        subGroup.items?.push({
          title: page.title,
          href: page.url,
          badge: page.frontmatter.badge,
          addedAt: page.frontmatter.addedAt,
          icon: page.frontmatter.icon,
        });
      }
    }

    rootItems.push(group);
  }

  return rootItems;
}

export function buildPagination(
  pages: PageData[],
  currentUrl: string
): { prev?: { title: string; href: string }; next?: { title: string; href: string } } {
  const currentPage = pages.find((p) => p.url === currentUrl);

  const navigationPages = pages.filter((page) => page.url !== "/");
  const sidebar = buildSidebarTree(navigationPages);
  const flattened = flattenSidebarItems(sidebar);
  const currentIndex = flattened.findIndex((item) => item.href === currentUrl);

  if (currentIndex === -1) {
    return {};
  }

  let prev = currentIndex > 0 ? flattened[currentIndex - 1] : undefined;
  let next = currentIndex < flattened.length - 1 ? flattened[currentIndex + 1] : undefined;

  // Custom frontmatter overrides
  if (currentPage?.frontmatter.prev === false || currentPage?.frontmatter.prev === null) {
    prev = undefined;
  } else if (typeof currentPage?.frontmatter.prev === "string") {
    const target = pages.find((p) => p.url === currentPage.frontmatter.prev);
    if (target) prev = { title: target.title, href: target.url };
  } else if (typeof currentPage?.frontmatter.prev === "object" && currentPage.frontmatter.prev !== null) {
    prev = currentPage.frontmatter.prev as { title: string; href: string };
  }

  if (currentPage?.frontmatter.next === false || currentPage?.frontmatter.next === null) {
    next = undefined;
  } else if (typeof currentPage?.frontmatter.next === "string") {
    const target = pages.find((p) => p.url === currentPage.frontmatter.next);
    if (target) next = { title: target.title, href: target.url };
  } else if (typeof currentPage?.frontmatter.next === "object" && currentPage.frontmatter.next !== null) {
    next = currentPage.frontmatter.next as { title: string; href: string };
  }

  return { prev, next };
}

export function buildBreadcrumbs(
  url: string,
  pages: PageData[]
): Array<{ title: string; href?: string }> {
  const breadcrumbs: Array<{ title: string; href?: string }> = [
    { title: "Docs", href: "/" },
  ];

  if (url === "/") {
    return breadcrumbs;
  }

  const segments = url.slice(1).split("/");
  let accumulatedPath = "";

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    accumulatedPath += `/${seg}`;
    const isLast = i === segments.length - 1;

    const matchingPage = pages.find((p) => p.url === accumulatedPath);
    const title = matchingPage?.title || formatTitleFromFilename(seg);

    breadcrumbs.push({
      title,
      href: isLast ? undefined : accumulatedPath,
    });
  }

  return breadcrumbs;
}
