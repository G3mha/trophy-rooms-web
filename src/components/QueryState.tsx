"use client";

import * as React from "react";

import { ErrorState } from "./ErrorState";
import { PageSkeleton } from "./PageSkeleton";

type QueryLikeError = {
  message?: string;
} | null | undefined;

type QueryStateProps = {
  isLoading?: boolean;
  // What to show while loading; defaults to plain rows
  skeleton?: React.ReactNode;
  error?: QueryLikeError;
  errorTitle?: string;
  errorDescription?: string;
  errorAction?: React.ReactNode;
  isEmpty?: boolean;
  emptyState?: React.ReactNode;
  children: React.ReactNode;
};

function QueryState({
  isLoading = false,
  skeleton = <PageSkeleton variant="rows" />,
  error,
  errorTitle = "Couldn’t load this page",
  errorDescription,
  errorAction,
  isEmpty = false,
  emptyState = null,
  children,
}: QueryStateProps) {
  if (isLoading) {
    return <>{skeleton}</>;
  }

  if (error) {
    return (
      <ErrorState
        title={errorTitle}
        description={errorDescription ?? error.message}
        action={errorAction}
      />
    );
  }

  if (isEmpty) {
    return <>{emptyState}</>;
  }

  return <>{children}</>;
}

export { QueryState };
