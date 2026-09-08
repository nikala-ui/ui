import { splitProps, type Component, type JSX } from "solid-js";
import { cn } from "@/lib/cn";

export interface TableProps extends JSX.HTMLAttributes<HTMLTableElement> {
  class?: string;
}

/**
 * Root Table container component wrapped in a responsive scroll container.
 */
export const Table: Component<TableProps> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);

  return (
    <div class="relative w-full overflow-auto">
      <table
        class={cn("w-full caption-bottom text-sm", local.class)}
        {...rest}
      />
    </div>
  );
};

export interface TableHeaderProps extends JSX.HTMLAttributes<HTMLTableSectionElement> {
  class?: string;
}

/**
 * Header section wrapper for the Table component.
 */
export const TableHeader: Component<TableHeaderProps> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);

  return (
    <thead
      class={cn("[&_tr]:border-b border-border", local.class)}
      {...rest}
    />
  );
};

export interface TableBodyProps extends JSX.HTMLAttributes<HTMLTableSectionElement> {
  class?: string;
}

/**
 * Main body section wrapper for the Table component.
 */
export const TableBody: Component<TableBodyProps> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);

  return (
    <tbody
      class={cn("[&_tr:last-child]:border-0", local.class)}
      {...rest}
    />
  );
};

export interface TableFooterProps extends JSX.HTMLAttributes<HTMLTableSectionElement> {
  class?: string;
}

/**
 * Footer section wrapper for the Table component.
 */
export const TableFooter: Component<TableFooterProps> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);

  return (
    <tfoot
      class={cn(
        "border-t border-border bg-muted/50 font-medium [&>tr]:last:border-b-0",
        local.class
      )}
      {...rest}
    />
  );
};

export interface TableRowProps extends JSX.HTMLAttributes<HTMLTableRowElement> {
  class?: string;
}

/**
 * Table row component with hover highlight states.
 */
export const TableRow: Component<TableRowProps> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);

  return (
    <tr
      class={cn(
        "border-b border-border transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
        local.class
      )}
      {...rest}
    />
  );
};

export interface TableHeadProps extends JSX.ThHTMLAttributes<HTMLTableCellElement> {
  class?: string;
}

/**
 * Header cell component for table columns.
 */
export const TableHead: Component<TableHeadProps> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);

  return (
    <th
      class={cn(
        "h-10 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        local.class
      )}
      {...rest}
    />
  );
};

export interface TableCellProps extends JSX.TdHTMLAttributes<HTMLTableCellElement> {
  class?: string;
}

/**
 * Standard data cell component for table rows.
 */
export const TableCell: Component<TableCellProps> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);

  return (
    <td
      class={cn(
        "p-4 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        local.class
      )}
      {...rest}
    />
  );
};

export interface TableCaptionProps extends JSX.HTMLAttributes<HTMLTableCaptionElement> {
  class?: string;
}

/**
 * Accessible table caption for describing table contents.
 */
export const TableCaption: Component<TableCaptionProps> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);

  return (
    <caption
      class={cn("mt-4 text-xs text-muted-foreground pb-2", local.class)}
      {...rest}
    />
  );
};
