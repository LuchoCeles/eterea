"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const inactiveTitles = ["No te lo pierdas...", "¡Volvé!"];
const titleIntervalMs = 2000;

export function StorefrontTabTitle() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === "/auth" || pathname.startsWith("/auth/")) return;

    let pageTitle = document.title;
    let messageIndex = 0;
    let interval: number | undefined;

    const isInactive = () => document.visibilityState !== "visible";
    const stopMessages = () => {
      if (interval !== undefined) {
        window.clearInterval(interval);
        interval = undefined;
      }
    };
    const showPageTitle = () => {
      stopMessages();
      if (!inactiveTitles.includes(document.title)) pageTitle = document.title;
      document.title = pageTitle;
    };
    const showInactiveTitle = () => {
      if (!isInactive() || interval !== undefined) return;

      messageIndex = 0;
      document.title = inactiveTitles[messageIndex];
      interval = window.setInterval(() => {
        messageIndex = (messageIndex + 1) % inactiveTitles.length;
        document.title = inactiveTitles[messageIndex];
      }, titleIntervalMs);
    };
    const syncTitle = () => {
      if (isInactive()) showInactiveTitle();
      else showPageTitle();
    };
    const titleObserver = new MutationObserver(() => {
      if (!inactiveTitles.includes(document.title)) pageTitle = document.title;
    });

    titleObserver.observe(document.head, { childList: true, subtree: true, characterData: true });
    document.addEventListener("visibilitychange", syncTitle);
    syncTitle();

    return () => {
      stopMessages();
      if (inactiveTitles.includes(document.title)) document.title = pageTitle;
      titleObserver.disconnect();
      document.removeEventListener("visibilitychange", syncTitle);
    };
  }, [pathname]);

  return null;
}
