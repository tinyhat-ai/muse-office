import { renderMarkdown } from "@/lib/markdown";
import type { CommentFile } from "@/lib/comment-attachments";
import "./comments.css";

export function CommentBody({ body, files = [] }: { body: string; files?: CommentFile[] }) {
  return <div className="oc-body">
    {body && <div dangerouslySetInnerHTML={{ __html: renderMarkdown(body, true) }} />}
    {files.map((file, i) => {
      const local = /^\/api\/attachments\/[0-9a-f-]{36}$/.test(file.url);
      return <div className="oc-attachment" key={`${file.url}-${i}`}>
        {local && file.type?.startsWith("image/") ? <a href={file.url}><img src={file.url} alt={file.name} loading="lazy" /></a>
        : local && file.type?.startsWith("audio/") ? <audio controls preload="metadata" src={file.url} aria-label={file.name} /> : null}
        <a href={file.url}>{file.name}</a>
      </div>;
    })}
  </div>;
}
