"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { toast } from "sonner";
import { GET_GAME } from "@/graphql/queries";
import { GET_PLATFORMS } from "@/graphql/admin_queries";
import { UPDATE_GAME } from "@/graphql/admin_mutations";
import { Button } from "@/components";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { CoverPreview } from "./cover-preview";
import styles from "@/app/admin/page.module.css";

const GAME_TYPE_LABELS: Record<string, string> = {
  BASE_GAME: "Base Game",
  FANGAME: "Fangame",
  ROM_HACK: "ROM Hack",
  DLC: "DLC",
  EXPANSION: "Expansion",
};

interface Platform {
  id: string;
  name: string;
}

interface GameFormErrors {
  title?: string;
  platformId?: string;
  coverUrl?: string;
}

function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function getFieldErrorClass(hasError: boolean) {
  return hasError
    ? "border-red-500 focus:border-red-500 focus:shadow-[inset_0_0_0_1px_rgb(239,68,68)]"
    : "";
}

function renderFieldError(message?: string) {
  if (!message) return null;
  return <span className="text-sm text-red-300">{message}</span>;
}

interface GameEditModalProps {
  gameId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GameEditModal({ gameId, open, onOpenChange }: GameEditModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [platformId, setPlatformId] = useState("");
  const [type, setType] = useState("BASE_GAME");
  const [errors, setErrors] = useState<GameFormErrors>({});

  const { data: gameData, loading: loadingGame, refetch: refetchGame } = useQuery(GET_GAME, {
    variables: { id: gameId },
    skip: !open,
  });

  const { data: platformsData } = useQuery(GET_PLATFORMS);
  const platforms = useMemo(() => platformsData?.platforms || [], [platformsData]);

  const [updateGame, { loading: updating }] = useMutation(UPDATE_GAME, {
    onCompleted: (data) => {
      if (data?.updateGame?.success) {
        toast.success("Game updated successfully.");
        onOpenChange(false);
        refetchGame();
      } else {
        const errorMessage = data?.updateGame?.error?.message || "Failed to update game.";
        toast.error(errorMessage);

        const field = data?.updateGame?.error?.field;
        if (field === "title") {
          setErrors({ title: errorMessage });
        } else if (field === "platformId") {
          setErrors({ platformId: errorMessage });
        } else if (field === "coverUrl") {
          setErrors({ coverUrl: errorMessage });
        }
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update game.");
    },
  });

  useEffect(() => {
    if (gameData?.game) {
      const game = gameData.game;
      setTitle(game.title || "");
      setDescription(game.description || "");
      setCoverUrl(game.coverUrl || "");
      setPlatformId(game.platform?.id || "");
      setType(game.type || "BASE_GAME");
      setErrors({});
    }
  }, [gameData]);

  const handleSave = async () => {
    const newErrors: GameFormErrors = {};

    if (!title.trim()) {
      newErrors.title = "Game title is required.";
    }

    if (!platformId) {
      newErrors.platformId = "Select a platform.";
    }

    if (coverUrl.trim() && !isValidHttpUrl(coverUrl.trim())) {
      newErrors.coverUrl = "Cover URL must start with http:// or https://.";
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    await updateGame({
      variables: {
        id: gameId,
        input: {
          title: title.trim(),
          description: description.trim() || null,
          coverUrl: coverUrl.trim() || null,
          platformId,
          type,
        },
      },
    });
  };

  const handleClose = () => {
    onOpenChange(false);
    setErrors({});
  };

  if (loadingGame && open) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Edit Game</DialogTitle>
            <DialogDescription>Loading game data...</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--nintendo-red)] border-t-transparent" />
            </div>
          </DialogBody>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Edit Game</DialogTitle>
          <DialogDescription>
            Update game details. Changes will be saved immediately.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className={styles.modalForm}>
          <div className="space-y-4">
            <div className={styles.formField}>
              <label className={styles.formLabel}>Game Title *</label>
              <Input
                placeholder="Enter game title"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setErrors((prev) => ({ ...prev, title: undefined }));
                }}
                className={getFieldErrorClass(Boolean(errors.title))}
                aria-invalid={Boolean(errors.title)}
              />
              {renderFieldError(errors.title)}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className={styles.formField}>
                <label className={styles.formLabel}>Platform *</label>
                <Select
                  value={platformId}
                  onValueChange={(value) => {
                    setPlatformId(value || "");
                    setErrors((prev) => ({ ...prev, platformId: undefined }));
                  }}
                >
                  <SelectTrigger className={getFieldErrorClass(Boolean(errors.platformId))}>
                    <span>
                      {platforms.find((p: Platform) => p.id === platformId)?.name ||
                        "Select a platform"}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    {platforms.map((platform: Platform) => (
                      <SelectItem key={platform.id} value={platform.id}>
                        {platform.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {renderFieldError(errors.platformId)}
              </div>

              <div className={styles.formField}>
                <label className={styles.formLabel}>Type</label>
                <Select value={type} onValueChange={(value) => setType(value || "BASE_GAME")}>
                  <SelectTrigger>
                    <span>{GAME_TYPE_LABELS[type]}</span>
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(GAME_TYPE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>Description</label>
              <Textarea
                placeholder="Enter game description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>Cover URL</label>
              <Input
                placeholder="https://example.com/cover.jpg"
                value={coverUrl}
                onChange={(e) => {
                  setCoverUrl(e.target.value);
                  setErrors((prev) => ({ ...prev, coverUrl: undefined }));
                }}
                className={getFieldErrorClass(Boolean(errors.coverUrl))}
                aria-invalid={Boolean(errors.coverUrl)}
              />
              <span className={styles.formHint}>
                Use a direct image URL starting with http:// or https://.
              </span>
              {renderFieldError(errors.coverUrl)}
            </div>

            {coverUrl.trim() && (
              <div className={styles.formField}>
                <label className={styles.formLabel}>Cover Preview</label>
                <CoverPreview url={coverUrl.trim()} alt="Game cover preview" />
              </div>
            )}
          </div>
        </DialogBody>

        <DialogFooter>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} loading={updating}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
