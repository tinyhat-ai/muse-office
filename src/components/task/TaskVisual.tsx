"use client";

import { useEffect, useRef, useState } from "react";
import { taskVisualDocument, taskVisualHeight } from "@/lib/task-visual";

export function TaskVisual({ html }: { html: string }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(240);
  useEffect(() => {
    const resize = (event: MessageEvent) => {
      if (event.source !== frame.current?.contentWindow || event.data?.type !== "office-overview-height") return;
      const next = taskVisualHeight(event.data.height);
      if (next !== null) setHeight(next);
    };
    window.addEventListener("message", resize);
    frame.current?.contentWindow?.postMessage({ type: "office-overview-measure" }, "*");
    return () => window.removeEventListener("message", resize);
  }, [html]);
  return <iframe ref={frame} title="Task overview visualization" className="tk-visual" sandbox="allow-scripts"
    srcDoc={taskVisualDocument(html)} style={{ height }} />;
}
