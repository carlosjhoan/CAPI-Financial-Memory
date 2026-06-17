import React from 'react';
import { cn } from '../../core/utils/format';

export interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  striped?: boolean;
  hover?: boolean;
  compact?: boolean;
}

const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ className, striped = true, hover = true, compact = false, ...props }, ref) => {
    return (
      <div className="overflow-x-auto rounded-lg border border-secondary-200 dark:border-secondary-700">
        <table
          ref={ref}
          className={cn(
            'w-full text-sm',
            compact ? 'text-xs' : 'text-sm',
            className
          )}
          {...props}
        />
      </div>
    );
  }
);

Table.displayName = 'Table';

export interface TableHeaderProps extends React.HTMLAttributes<HTMLTableSectionElement> {}

export const TableHeader = React.forwardRef<HTMLTableSectionElement, TableHeaderProps>(
  ({ className, ...props }, ref) => {
    return (
      <thead
        ref={ref}
        className={cn(
          'bg-secondary-50 dark:bg-secondary-800/50 border-b border-secondary-200 dark:border-secondary-700',
          className
        )}
        {...props}
      />
    );
  }
);

TableHeader.displayName = 'TableHeader';

export interface TableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  striped?: boolean;
  hover?: boolean;
}

export const TableBody = React.forwardRef<HTMLTableSectionElement, TableBodyProps>(
  ({ className, striped = true, hover = true, ...props }, ref) => {
    return (
      <tbody
        ref={ref}
        className={cn(
          'divide-y divide-secondary-200 dark:divide-secondary-700',
          striped && 'even:bg-secondary-50/50 dark:even:bg-secondary-800/30',
          hover && 'hover:bg-secondary-50 dark:hover:bg-secondary-800/50',
          className
        )}
        {...props}
      />
    );
  }
);

TableBody.displayName = 'TableBody';

export interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  clickable?: boolean;
}

export const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ className, clickable = false, ...props }, ref) => {
    return (
      <tr
        ref={ref}
        className={cn(
          clickable && 'cursor-pointer hover:bg-secondary-50 dark:hover:bg-secondary-800/50',
          className
        )}
        {...props}
      />
    );
  }
);

TableRow.displayName = 'TableRow';

export interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  align?: 'left' | 'center' | 'right';
}

export const TableHead = React.forwardRef<HTMLTableCellElement, TableHeadProps>(
  ({ className, align = 'left', ...props }, ref) => {
    const alignments = {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
    };

    return (
      <th
        ref={ref}
        className={cn(
          'px-4 py-3 font-semibold text-secondary-700 dark:text-secondary-300 uppercase tracking-wider',
          alignments[align],
          className
        )}
        {...props}
      />
    );
  }
);

TableHead.displayName = 'TableHead';

export interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  align?: 'left' | 'center' | 'right';
}

export const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ className, align = 'left', ...props }, ref) => {
    const alignments = {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
    };

    return (
      <td
        ref={ref}
        className={cn(
          'px-4 py-3 text-secondary-900 dark:text-white',
          alignments[align],
          className
        )}
        {...props}
      />
    );
  }
);

TableCell.displayName = 'TableCell';

export interface TableFooterProps extends React.HTMLAttributes<HTMLTableSectionElement> {}

export const TableFooter = React.forwardRef<HTMLTableSectionElement, TableFooterProps>(
  ({ className, ...props }, ref) => {
    return (
      <tfoot
        ref={ref}
        className={cn(
          'bg-secondary-50 dark:bg-secondary-800/50 border-t border-secondary-200 dark:border-secondary-700',
          className
        )}
        {...props}
      />
    );
  }
);

TableFooter.displayName = 'TableFooter';

export default Table;