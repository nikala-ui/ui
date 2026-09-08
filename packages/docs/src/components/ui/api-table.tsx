import {
  splitProps,
  For,
  Show,
  type JSX,
  type Component,
} from "solid-js";
import { SectionHeading } from "@/components/ui/section-heading";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { cn } from "@/lib/cn";

export interface ApiTableItem {
  /** Property, attribute, or method name */
  prop: string;
  /** TypeScript type definition string */
  type: string;
  /** Default value if optional */
  default?: string;
  /** Detailed description of purpose and usage */
  description: string;
  /** Whether the property is strictly required */
  required?: boolean;
}

export interface ApiTableProps extends JSX.HTMLAttributes<HTMLDivElement> {
  /** Title header for this API section (e.g. component or interface name) */
  title?: string;
  /** Subtitle or explanatory note */
  description?: string;
  /** Badge label next to the title (defaults to "Props") */
  badge?: string;
  /** List of API properties to render in the table */
  items: ApiTableItem[];
  class?: string;
}

/**
 * Clean, structured API reference table component composed from Table and Badge primitives.
 */
export const ApiTable: Component<ApiTableProps> = (props) => {
  const [local, rest] = splitProps(props, [
    "title",
    "description",
    "badge",
    "items",
    "class",
  ]);

  return (
    <div class={cn("my-6 space-y-3", local.class)} {...rest}>
      {/* Header */}
      <Show when={local.title}>
        <SectionHeading
          variant="compact"
          title={local.title!}
          badge={local.badge || "Props"}
          description={local.description}
        />
      </Show>

      {/* Responsive Table Container Composed from Nikala Table Primitives */}
      <div class="rounded-lg border border-border bg-card/50 shadow-2xs overflow-hidden">
        <Table class="text-xs">
          <TableHeader class="bg-muted/40 font-mono text-[11px] uppercase tracking-wider text-muted-foreground select-none">
            <TableRow class="hover:bg-transparent">
              <TableHead class="h-9 px-4 font-semibold">Prop</TableHead>
              <TableHead class="h-9 px-4 font-semibold">Type</TableHead>
              <TableHead class="h-9 px-4 font-semibold">Default</TableHead>
              <TableHead class="h-9 px-4 font-semibold">Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody class="font-mono text-xs">
            <For each={local.items}>
              {(item) => (
                <TableRow class="transition-colors hover:bg-muted/20">
                  <TableCell class="px-4 py-3 font-semibold text-primary">
                    <span class="inline-flex items-center gap-1">
                      {item.prop}
                      <Show when={item.required}>
                        <span class="text-rose-500 font-bold" title="Required">*</span>
                      </Show>
                    </span>
                  </TableCell>
                  <TableCell class="px-4 py-3 text-muted-foreground">
                    <code class="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[11px] text-foreground">
                      {item.type}
                    </code>
                  </TableCell>
                  <TableCell class="px-4 py-3 text-muted-foreground">
                    <Show
                      when={item.default}
                      fallback={<span class="text-muted-foreground/40 font-mono">-</span>}
                    >
                      <code class="rounded-md bg-muted/60 px-1 py-0.5 font-mono text-[11px]">
                        {item.default}
                      </code>
                    </Show>
                  </TableCell>
                  <TableCell class="px-4 py-3 font-sans font-normal leading-relaxed text-muted-foreground">
                    {item.description}
                  </TableCell>
                </TableRow>
              )}
            </For>
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
