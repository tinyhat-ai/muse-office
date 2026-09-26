import { CommentForm } from "@/components/task/CommentForm";

export function NoteCommentForm({ note }: { note: string }) {
  return <CommentForm note={note} placeholder="Add a comment for your note keeper…" buttonLabel="Comment" />;
}
