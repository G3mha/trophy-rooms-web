"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { toast } from "sonner";
import { GET_PLATFORMS } from "@/graphql/admin_queries";
import { ADD_PLATFORM_TO_GAME_FAMILY } from "@/graphql/admin_mutations";
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
  gameFamilyId: string;
  gameTitle: string;
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
  currentPlatformId,
  open,
  onOpenChange,
  onSuccess,
}: GameCloneModalProps) {
  const [targetPlatformIds, setTargetPlatformIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const { data: platformsData } = useQuery(GET_PLATFORMS);
  const platforms = useMemo(() => platformsData?.platforms || [], [platformsData]);

  const [addPlatform, { loading: adding }] = useMutation(ADD_PLATFORM_TO_GAME_FAMILY);

  const handleAddPlatforms = async () => {
    if (targetPlatformIds.size === 0) {
      setError("Select at least one target platform.");
      return;
    }

    if (currentPlatformId && targetPlatformIds.has(currentPlatformId)) {
      setError("Cannot add the current platform.");
      return;
    }

    setError(null);

    try {
      let successCount = 0;

      for (const platformId of targetPlatformIds) {
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

      onOpenChange(false);
      resetForm();

      if (successCount === 0) {
        toast.error("Failed to add platforms.");
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
            label="Target Platforms"
            required
            hint="Select platforms to add this game to."
            error={error ?? undefined}
          >
            <div className="flex flex-col gap-1.5 max-h-[200px] overflow-y-auto">
              {platforms
                .filter((p: Platform) => p.id !== currentPlatformId)
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
        </DialogBody>

        <DialogFooter>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleAddPlatforms} loading={adding}>
            {targetPlatformIds.size > 0
              ? `Add to ${targetPlatformIds.size} Platform${targetPlatformIds.size > 1 ? "s" : ""}`
              : "Add Platform"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
