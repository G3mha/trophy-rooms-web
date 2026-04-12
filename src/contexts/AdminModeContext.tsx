"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@apollo/client";
import { GET_ME } from "@/graphql/queries";

export type EntityType = "game" | "bundle" | "achievementSet" | "dlc";

export interface CurrentEntity {
  type: EntityType;
  id: string;
  title: string;
  platformId?: string;
  platformName?: string;
  gameFamilyId?: string;
}

interface AdminModeContextValue {
  isAdmin: boolean;
  currentEntity: CurrentEntity | null;
  setCurrentEntity: (entity: CurrentEntity) => void;
  clearEntity: () => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

const AdminModeContext = createContext<AdminModeContextValue | null>(null);

export function AdminModeProvider({ children }: { children: ReactNode }) {
  const [currentEntity, setCurrentEntityState] = useState<CurrentEntity | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const { data } = useQuery(GET_ME);
  const role = data?.me?.role;
  const isAdmin = role === "ADMIN" || role === "TRUSTED";

  const setCurrentEntity = useCallback((entity: CurrentEntity) => {
    setCurrentEntityState(entity);
  }, []);

  const clearEntity = useCallback(() => {
    setCurrentEntityState(null);
  }, []);

  const value = useMemo(
    () => ({
      isAdmin,
      currentEntity,
      setCurrentEntity,
      clearEntity,
      isCollapsed,
      setIsCollapsed,
    }),
    [isAdmin, currentEntity, setCurrentEntity, clearEntity, isCollapsed]
  );

  return (
    <AdminModeContext.Provider value={value}>
      {children}
    </AdminModeContext.Provider>
  );
}

export function useAdminMode() {
  const context = useContext(AdminModeContext);
  if (!context) {
    throw new Error("useAdminMode must be used within an AdminModeProvider");
  }
  return context;
}
