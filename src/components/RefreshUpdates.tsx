"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Refreshes visible results without clearing a comment being composed. */
export function RefreshUpdates() {
  const router = useRouter();
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible" && !document.activeElement?.matches("input, textarea, [contenteditable]")) router.refresh();
    };
    const timer = setInterval(refresh, 15000);
    return () => clearInterval(timer);
  }, [router]);
  return null;
}
