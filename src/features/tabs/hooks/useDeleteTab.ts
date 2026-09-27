"use client";

import { useFeedback } from "@/shared/components/Feedback";
import { RECYCLE_RETENTION_DAYS } from "../services/tabStore";
import { deleteTab } from "./tabUseCases";

/** Confirm, then move a tab to the recycle bin. */
export function useDeleteTab() {
  const { confirm, toast } = useFeedback();
  return async (tabId: string, label: string) => {
    const ok = await confirm({
      title: "Move to recycle bin?",
      message: `Move all notes and expenses for ${label} to the recycle bin for ${RECYCLE_RETENTION_DAYS} days?`,
      confirmLabel: "Move",
      cancelLabel: "No",
      destructive: true,
    });
    if (!ok) return false;
    deleteTab(tabId);
    toast("Moved to recycle bin");
    return true;
  };
}
