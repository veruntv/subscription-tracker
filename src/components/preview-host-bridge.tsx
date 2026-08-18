"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { installPreviewHostBridge } from "~/lib/preview-host-bridge";

export function PreviewHostBridge() {
  const router = useRouter();

  useEffect(() => {
    return installPreviewHostBridge({
      navigate: (path) => {
        router.push(path);
      },
      getRoutePaths: () => ["/"],
    });
  }, [router]);

  return null;
}
