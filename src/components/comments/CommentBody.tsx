import { renderMarkdown } from "@/lib/markdown";
import type { CommentFile } from "@/lib/comment-attachments";
import { ExpandableContent } from "./ExpandableContent";
import "./comments.css";

export function CommentBody({ body, files = [], collapse = false }: { body: string; files?: CommentFile[]; collapse?: boolean }) {
  const text = body ? <div className="md oc-markdown" dangerouslySetInnerHTML={{ __html: renderMarkdown(body, true) }} /> : null;
  return <div className="oc-body">
    {text && (collapse ? <ExpandableContent label="comment">{text}</ExpandableContent> : text)}
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
