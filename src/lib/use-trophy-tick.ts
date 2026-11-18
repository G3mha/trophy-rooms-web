"use client";

import { useMutation, type ApolloCache } from "@apollo/client";
import { toast } from "sonner";
import { MARK_ACHIEVEMENT_COMPLETE, UNMARK_ACHIEVEMENT_COMPLETE } from "@/graphql/mutations";

// What the tick mutations select, see MARK_ACHIEVEMENT_COMPLETE and
// UNMARK_ACHIEVEMENT_COMPLETE
interface TickResult {
  __typename?: string;
  success: boolean;
  error: { code: string; message: string; field: string | null } | null;
}

interface MarkCompleteData {
  markAchievementComplete: TickResult & {
    userAchievement: {
      id: string;
      createdAt: string;
      achievement: { id: string; title: string; isCompleted: boolean; earnedPercent: number | null };
    } | null;
  };
}

interface UnmarkCompleteData {
  unmarkAchievementComplete: TickResult;
}

// A tick shows at once: the cache flips isCompleted ahead of the server and
// rolls back if the server refuses it. onSaved runs once the server agrees.
export function useTrophyTick() {
  const [markComplete] = useMutation<MarkCompleteData>(MARK_ACHIEVEMENT_COMPLETE);
  const [unmarkComplete] = useMutation<UnmarkCompleteData>(UNMARK_ACHIEVEMENT_COMPLETE);

  return (achievement: { id: string; isCompleted?: boolean }, onSaved?: () => void) => {
    const achievementId = achievement.id;
    const earned = !achievement.isCompleted;
    const writeTick = (cache: ApolloCache<unknown>, succeeded = false) => {
      if (!succeeded) return;
      cache.modify({
        id: cache.identify({ __typename: "Achievement", id: achievementId }),
        fields: { isCompleted: () => earned },
      });
    };
    const settle = (result: TickResult) => {
      if (!result.success) toast.error(result.error?.message || "Couldn’t update the trophy.");
      else onSaved?.();
    };
    const onError = (error: Error) => toast.error(error.message || "Couldn’t update the trophy.");

    if (earned) {
      markComplete({
        variables: { achievementId },
        optimisticResponse: {
          markAchievementComplete: {
            __typename: "UserAchievementMutationResult",
            success: true,
            error: null,
            userAchievement: null,
          },
        },
        update: (cache, { data }) => writeTick(cache, data?.markAchievementComplete.success),
        onCompleted: (data) => settle(data.markAchievementComplete),
        onError,
      });
    } else {
      unmarkComplete({
        variables: { achievementId },
        optimisticResponse: {
          unmarkAchievementComplete: { __typename: "DeleteResult", success: true, error: null },
        },
        update: (cache, { data }) => writeTick(cache, data?.unmarkAchievementComplete.success),
        onCompleted: (data) => settle(data.unmarkAchievementComplete),
        onError,
      });
    }
  };
}
