"use client";

import * as React from "react";

import { ErrorState } from "./ErrorState";
import { LoadingSpinner } from "./LoadingSpinner";

type QueryLikeError = {
  message?: string;
} | null | undefined;

type QueryStateProps = {
  isLoading?: boolean;
  loadingText?: string;
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
  loadingText = "Loading...",
  error,
  errorTitle = "Couldn’t load this page",
  errorDescription,
  errorAction,
  isEmpty = false,
  emptyState = null,
  children,
}: QueryStateProps) {
  if (isLoading) {
    return <LoadingSpinner text={loadingText} />;
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
