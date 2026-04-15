"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { toast } from "sonner";
import { Copy } from "lucide-react";
import { GET_PLATFORMS } from "@/graphql/admin_queries";
import { ADD_PLATFORM_TO_GAME_FAMILY, CLONE_GAME_TO_PLATFORM } from "@/graphql/admin_mutations";
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
import { FormField } from "@/components/ui/form-field";
import { PlatformPicker } from "@/components/ui/platform-picker";
import { Checkbox } from "@/components/ui/checkbox";

interface GameCloneModalProps {
  gameFamilyId: string;
  gameTitle: string;
  /** Source game ID for clone with achievements (required if copyAchievements is used) */
  gameId?: string;
  /** Current platform ID to exclude from selection */
  currentPlatformId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after successful clone, useful for refetching lists */
  onSuccess?: () => void;
}

export function GameCloneModal({
  gameFamilyId,
  gameTitle,
  gameId,
  currentPlatformId,
  open,
  onOpenChange,
  onSuccess,
}: GameCloneModalProps) {
  const [targetPlatformIds, setTargetPlatformIds] = useState<Set<string>>(new Set());
  const [copyAchievements, setCopyAchievements] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: platformsData } = useQuery(GET_PLATFORMS);
  const platforms = useMemo(() => platformsData?.platforms || [], [platformsData]);

  const [addPlatform, { loading: adding }] = useMutation(ADD_PLATFORM_TO_GAME_FAMILY);
  const [cloneGame, { loading: cloning }] = useMutation(CLONE_GAME_TO_PLATFORM);

  const handleAddPlatforms = async () => {
    if (targetPlatformIds.size === 0) {
      setError("Select at least one target platform.");
      return;
    }

    if (currentPlatformId && targetPlatformIds.has(currentPlatformId)) {
      setError("Cannot add the current platform.");
      return;
    }

    // Clone with achievements requires gameId and single platform selection
    if (copyAchievements) {
      if (!gameId) {
        setError("Cannot copy achievements without source game ID.");
        return;
      }
      if (targetPlatformIds.size > 1) {
        setError("Select only one platform when copying achievements.");
        return;
      }
    }

    setError(null);

    try {
      let successCount = 0;

      for (const platformId of targetPlatformIds) {
        if (copyAchievements && gameId) {
          // Use cloneGameToPlatform for achievement copying
          const { data } = await cloneGame({
            variables: {
              gameId,
              targetPlatformId: platformId,
              copyAchievementSets: true,
            },
          });

          if (data?.cloneGameToPlatform?.success) {
            successCount++;
          }
        } else {
          // Use addPlatformToGameFamily for simple platform addition
          const { data } = await addPlatform({
            variables: {
              gameFamilyId,
              platformId,
            },
          });

          if (data?.addPlatformToGameFamily?.success) {
            successCount++;
          }
        }
      }

      onOpenChange(false);
      resetForm();

      if (successCount === 0) {
        toast.error("Failed to add platforms.");
      } else if (copyAchievements) {
        toast.success(`Cloned ${gameTitle} with achievement sets.`);
      } else if (successCount === 1) {
        toast.success(`Added ${gameTitle} to 1 platform.`);
      } else {
        toast.success(`Added ${gameTitle} to ${successCount} platforms.`);
      }

      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to add platforms.");
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
          <DialogTitle>Add to Platforms</DialogTitle>
          <DialogDescription>
            Add &quot;{gameTitle}&quot; to additional platforms.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="flex flex-col gap-5 py-2">
          <FormField
            label="Target Platform"
            required
            hint={copyAchievements
              ? "Select one platform to clone this game to."
              : "Select platforms to add this game to."
            }
            error={error ?? undefined}
          >
            <PlatformPicker
              platforms={platforms}
              selectedIds={targetPlatformIds}
              onToggle={togglePlatform}
              excludeIds={currentPlatformId ? [currentPlatformId] : []}
              grouped
              maxHeight="200px"
            />
          </FormField>

          {gameId && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)]">
              <Checkbox
                id="copyAchievements"
                checked={copyAchievements}
                onCheckedChange={(checked) => {
                  setCopyAchievements(checked === true);
                  // Clear extra selections when enabling copy mode
                  if (checked && targetPlatformIds.size > 1) {
                    const first = Array.from(targetPlatformIds)[0];
                    setTargetPlatformIds(new Set(first ? [first] : []));
                  }
                }}
              />
              <div className="flex flex-col gap-0.5">
                <label
                  htmlFor="copyAchievements"
                  className="text-sm font-medium text-[var(--text-primary)] cursor-pointer"
                >
                  Copy achievement sets
                </label>
                <span className="text-xs text-[var(--text-muted)]">
                  Clone all achievement sets and achievements to the new platform
                </span>
              </div>
            </div>
          )}
        </DialogBody>

        <DialogFooter>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleAddPlatforms} loading={adding || cloning}>
            {copyAchievements ? (
              <>
                <Copy size={14} />
                Clone with Achievements
              </>
            ) : targetPlatformIds.size > 0 ? (
              `Add to ${targetPlatformIds.size} Platform${targetPlatformIds.size > 1 ? "s" : ""}`
            ) : (
              "Add Platform"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
