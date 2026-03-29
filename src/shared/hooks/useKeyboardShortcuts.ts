import { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

interface ShortcutConfig {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  action: () => void;
  description: string;
}

export function useKeyboardShortcuts() {
  const navigate = useNavigate();

  const shortcuts: ShortcutConfig[] = [
    {
      key: "d",
      ctrlKey: true,
      action: () => navigate("/admin"),
      description: "Go to Dashboard",
    },
    {
      key: "r",
      ctrlKey: true,
      shiftKey: true,
      action: () => navigate("/admin/referrers"),
      description: "Go to Referrers",
    },
    {
      key: "p",
      ctrlKey: true,
      shiftKey: true,
      action: () => navigate("/admin/payouts"),
      description: "Go to Payouts",
    },
    {
      key: "c",
      ctrlKey: true,
      shiftKey: true,
      action: () => navigate("/admin/commissions"),
      description: "Go to Commissions",
    },
  ];

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        (event.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      for (const shortcut of shortcuts) {
        const ctrlOrMeta = shortcut.ctrlKey || shortcut.metaKey;
        const isCtrlPressed = event.ctrlKey || event.metaKey;

        if (
          event.key.toLowerCase() === shortcut.key.toLowerCase() &&
          (ctrlOrMeta ? isCtrlPressed : !isCtrlPressed) &&
          (shortcut.shiftKey ? event.shiftKey : !event.shiftKey)
        ) {
          event.preventDefault();
          shortcut.action();
          break;
        }
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return { shortcuts };
}
