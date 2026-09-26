import { get } from "@/lib/db";

export function CommentFollowUp({ owner }: { owner: string }) {
  const minutes = get<{ value: string }>("SELECT value FROM settings WHERE key = 'comment_check_minutes'")?.value;
  const chat = get<{ value: string }>("SELECT value FROM settings WHERE key = 'office_chat_url'")?.value;
  return <p className="comment-follow-up">Comments give {owner} direction. Replies appear here.
    {minutes ? ` Muse checks for new comments every ${minutes} ${minutes === "1" ? "minute" : "minutes"}; a reply may take longer.` : " Ask Muse to enable regular comment checks."}
    {" For help now, "}{chat ? <a href={chat}>open the Office chat</a> : "tell Muse in chat"}.</p>;
}
