"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@apollo/client";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { GET_PLATFORMS } from "@/graphql/admin_queries";
import { CLONE_GAME_TO_PLATFORM } from "@/graphql/admin_mutations";
import { Button } from "@/components";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import styles from "@/app/admin/page.module.css";

interface Platform {
  id: string;
  name: string;
}

interface GameCloneModalProps {
  gameId: string;
  gameTitle: string;
  platformId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GameCloneModal({
  gameId,
  gameTitle,
  platformId,
  open,
  onOpenChange,
}: GameCloneModalProps) {
  const router = useRouter();
  const [targetPlatformIds, setTargetPlatformIds] = useState<Set<string>>(new Set());
  const [copyAchievements, setCopyAchievements] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: platformsData } = useQuery(GET_PLATFORMS);
  const platforms = useMemo(() => platformsData?.platforms || [], [platformsData]);

  const [cloneGame, { loading: cloning }] = useMutation(CLONE_GAME_TO_PLATFORM);

  const handleClone = async () => {
    if (targetPlatformIds.size === 0) {
      setError("Select at least one target platform.");
      return;
    }

    if (platformId && targetPlatformIds.has(platformId)) {
      setError("Cannot clone to the source platform.");
      return;
    }

    setError(null);

    try {
      let successCount = 0;

      for (const targetId of targetPlatformIds) {
        const { data } = await cloneGame({
          variables: {
            gameId,
            targetPlatformId: targetId,
            copyAchievementSets: copyAchievements,
          },
        });

        if (data?.cloneGameToPlatform?.success) {
          successCount++;
        }
      }

      onOpenChange(false);
      resetForm();

      if (successCount === 0) {
        toast.error("Failed to clone game.");
      } else if (successCount === 1) {
        toast.success(`Cloned ${gameTitle} to 1 platform.`);
      } else {
        toast.success(`Cloned ${gameTitle} to ${successCount} platforms.`);
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to clone game.");
    }
  };

  const resetForm = () => {
    setTargetPlatformIds(new Set());
    setCopyAchievements(false);
    setError(null);
  };

  const handleClose = () => {
    onOpenChange(false);
    resetForm();
  };

  const togglePlatform = (id: string) => {
    setTargetPlatformIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
    setError(null);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>Clone to Platforms</DialogTitle>
          <DialogDescription>
            Create copies of &quot;{gameTitle}&quot; on other platforms.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className={styles.modalForm}>
          <div className={styles.formField}>
            <label className={styles.formLabel}>Target Platforms *</label>
            <span className={styles.formHint} style={{ marginBottom: 8, display: "block" }}>
              Select platforms to clone this game to.
            </span>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                maxHeight: 200,
                overflowY: "auto",
              }}
            >
              {platforms
                .filter((p: Platform) => p.id !== platformId)
                .map((platform: Platform) => (
                  <button
                    key={platform.id}
                    type="button"
                    onClick={() => togglePlatform(platform.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "8px 12px",
                      background: targetPlatformIds.has(platform.id)
                        ? "rgba(230, 0, 18, 0.15)"
                        : "var(--bg-secondary)",
                      border: targetPlatformIds.has(platform.id)
                        ? "1px solid var(--nintendo-red)"
                        : "1px solid var(--border-color)",
                      borderRadius: "var(--border-radius)",
                      cursor: "pointer",
                      color: "var(--text-primary)",
                      fontSize: 14,
                      textAlign: "left",
                    }}
                  >
                    <span style={{ flex: 1 }}>{platform.name}</span>
                    {targetPlatformIds.has(platform.id) && (
                      <Check size={16} style={{ color: "var(--nintendo-red)" }} />
                    )}
                  </button>
                ))}
            </div>
            {error && <span className="text-sm text-red-300">{error}</span>}
          </div>

          <div className={styles.formField}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={copyAchievements}
                onChange={(e) => setCopyAchievements(e.target.checked)}
              />
              <span>Copy achievement sets</span>
            </label>
            <span className={styles.formHint}>
              Copy the related achievement sets and achievements into each cloned game.
            </span>
          </div>
        </DialogBody>

        <DialogFooter>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleClone} loading={cloning}>
            {targetPlatformIds.size > 0
              ? `Clone to ${targetPlatformIds.size} Platform${targetPlatformIds.size > 1 ? "s" : ""}`
              : "Clone Game"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
