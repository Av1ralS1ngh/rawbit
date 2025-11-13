declare module 'react-window' {
  import * as React from 'react';

  export interface ListChildComponentProps<TData = unknown> {
    index: number;
    style: React.CSSProperties;
    data?: TData;
    isScrolling?: boolean;
  }

  export interface FixedSizeListProps<TData = unknown> {
    children: (props: ListChildComponentProps<TData>) => React.ReactNode;
    height: number;
    itemCount: number;
    itemSize: number;
    width: number | string;
    overscanCount?: number;
    className?: string;
    style?: React.CSSProperties;
  }

  export class FixedSizeList<TData = unknown> extends React.Component<FixedSizeListProps<TData>> {}

  export { FixedSizeList as FixedSizeListAutoExport };
}
