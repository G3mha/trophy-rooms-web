"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { toast } from "sonner";
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
import { FormField } from "@/components/ui/form-field";
import { SelectableButton } from "@/components/ui/selectable-button";

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
  /** Called after successful clone, useful for refetching lists */
  onSuccess?: () => void;
}

export function GameCloneModal({
  gameId,
  gameTitle,
  platformId,
  open,
  onOpenChange,
  onSuccess,
}: GameCloneModalProps) {
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

      onSuccess?.();
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

        <DialogBody className="flex flex-col gap-5 py-2">
          <FormField
            label="Target Platforms"
            required
            hint="Select platforms to clone this game to."
            error={error ?? undefined}
          >
            <div className="flex flex-col gap-1.5 max-h-[200px] overflow-y-auto">
              {platforms
                .filter((p: Platform) => p.id !== platformId)
                .map((platform: Platform) => (
                  <SelectableButton
                    key={platform.id}
                    selected={targetPlatformIds.has(platform.id)}
                    onClick={() => togglePlatform(platform.id)}
                  >
                    {platform.name}
                  </SelectableButton>
                ))}
            </div>
          </FormField>

          <FormField
            label=""
            hint="Copy the related achievement sets and achievements into each cloned game."
          >
            <label className="flex items-center gap-2 text-sm text-[var(--text-primary)] cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 cursor-pointer"
                checked={copyAchievements}
                onChange={(e) => setCopyAchievements(e.target.checked)}
              />
              <span>Copy achievement sets</span>
            </label>
          </FormField>
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
