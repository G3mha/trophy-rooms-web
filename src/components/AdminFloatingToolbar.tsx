"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client";
import { toast } from "sonner";
import {
  ChevronDown,
  Copy,
  ExternalLink,
  Pencil,
  Settings,
  Trash2,
  Trophy,
} from "lucide-react";
import { useAdminMode, type EntityType } from "@/contexts/AdminModeContext";
import { AdminConfirmDialog } from "@/components/admin";
import { DELETE_GAME } from "@/graphql/admin_mutations";
import { GameEditModal } from "@/components/admin/GameEditModal";
import { GameCloneModal } from "@/components/admin/GameCloneModal";
import styles from "./AdminFloatingToolbar.module.css";

interface ActionButton {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}

function getEntityLabel(type: EntityType): string {
  switch (type) {
    case "game":
      return "Game";
    case "bundle":
      return "Bundle";
    case "achievementSet":
      return "Achievement Set";
  }
}

export function AdminFloatingToolbar() {
  const router = useRouter();
  const { isAdmin, currentEntity, isCollapsed, setIsCollapsed } = useAdminMode();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const [deleteGame, { loading: deleting }] = useMutation(DELETE_GAME, {
    onCompleted: (data) => {
      if (data?.deleteGame?.success) {
        toast.success("Game deleted successfully.");
        setIsDeleteConfirmOpen(false);
        router.push("/games");
      } else {
        toast.error(data?.deleteGame?.error?.message || "Failed to delete game.");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete game.");
    },
  });

  if (!isAdmin || !currentEntity) {
    return null;
  }

  const handleDelete = async () => {
    if (currentEntity.type === "game") {
      await deleteGame({ variables: { id: currentEntity.id } });
    }
  };

  const handleViewInAdmin = () => {
    switch (currentEntity.type) {
      case "game":
        router.push(`/admin/games?search=${encodeURIComponent(currentEntity.title)}`);
        break;
      case "bundle":
        router.push(`/admin/bundles?search=${encodeURIComponent(currentEntity.title)}`);
        break;
      case "achievementSet":
        router.push(`/admin/achievement-sets?search=${encodeURIComponent(currentEntity.title)}`);
        break;
    }
  };

  const handleManageAchievements = () => {
    router.push(`/admin/achievement-sets?gameId=${currentEntity.id}`);
  };

  const getActions = (): ActionButton[] => {
    switch (currentEntity.type) {
      case "game":
        return [
          {
            icon: <Pencil size={16} />,
            label: "Edit Game",
            onClick: () => setIsEditModalOpen(true),
          },
          {
            icon: <Copy size={16} />,
            label: "Clone to Platforms",
            onClick: () => setIsCloneModalOpen(true),
          },
          {
            icon: <Trophy size={16} />,
            label: "Manage Achievements",
            onClick: handleManageAchievements,
          },
          {
            icon: <ExternalLink size={16} />,
            label: "View in Admin",
            onClick: handleViewInAdmin,
          },
          {
            icon: <Trash2 size={16} />,
            label: "Delete",
            onClick: () => setIsDeleteConfirmOpen(true),
            danger: true,
          },
        ];
      case "bundle":
        return [
          {
            icon: <Pencil size={16} />,
            label: "Edit Bundle",
            onClick: handleViewInAdmin,
          },
          {
            icon: <ExternalLink size={16} />,
            label: "View in Admin",
            onClick: handleViewInAdmin,
          },
        ];
      case "achievementSet":
        return [
          {
            icon: <Pencil size={16} />,
            label: "Edit Set",
            onClick: handleViewInAdmin,
          },
          {
            icon: <ExternalLink size={16} />,
            label: "View in Admin",
            onClick: handleViewInAdmin,
          },
        ];
      default:
        return [];
    }
  };

  const actions = getActions();

  if (isCollapsed) {
    return (
      <button
        className={styles.collapsedButton}
        onClick={() => setIsCollapsed(false)}
        title="Expand admin toolbar"
      >
        <Settings size={20} />
      </button>
    );
  }

  return (
    <>
      <div className={styles.toolbar}>
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <span className={styles.entityType}>{getEntityLabel(currentEntity.type)}</span>
            <span className={styles.entityTitle}>{currentEntity.title}</span>
          </div>
          <button
            className={styles.collapseButton}
            onClick={() => setIsCollapsed(true)}
            title="Collapse toolbar"
          >
            <ChevronDown size={18} />
          </button>
        </div>

        <div className={styles.divider} />

        <div className={styles.actions}>
          {actions.map((action, index) => (
            <button
              key={index}
              className={`${styles.actionButton} ${action.danger ? styles.danger : ""}`}
              onClick={action.onClick}
            >
              {action.icon}
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {currentEntity.type === "game" && (
        <>
          <GameEditModal
            gameId={currentEntity.id}
            open={isEditModalOpen}
            onOpenChange={setIsEditModalOpen}
            onSuccess={() => router.refresh()}
            enableMultiPlatformCreation
          />
          <GameCloneModal
            gameId={currentEntity.id}
            gameTitle={currentEntity.title}
            platformId={currentEntity.platformId}
            open={isCloneModalOpen}
            onOpenChange={setIsCloneModalOpen}
            onSuccess={() => router.refresh()}
          />
          <AdminConfirmDialog
            open={isDeleteConfirmOpen}
            onOpenChange={setIsDeleteConfirmOpen}
            title={`Delete ${currentEntity.title}?`}
            description="This will permanently remove the game and all associated data. This action cannot be undone."
            confirmLabel="Delete Game"
            loading={deleting}
            onConfirm={handleDelete}
          />
        </>
      )}
    </>
  );
}
