import type { MemberRow } from "@/lib/db";

type Size = "xs" | "sm" | "md" | "lg" | "xl";

/** A member's avatar: their image when they have one, otherwise initials on their colour. */
export function Avatar({ member, size = "sm" }: { member: Pick<MemberRow, "name" | "avatar_url" | "color"> | null | undefined; size?: Size }) {
  if (!member) return <span className={`av ${size} any`} aria-hidden="true" />;
  const initials = member.name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <span className={`av ${size}`} style={member.color ? { background: member.color } : undefined} title={member.name}>
      {member.avatar_url ? <img src={member.avatar_url} alt="" /> : initials}
    </span>
  );
}

/** The user's own marker on task pages. */
export function You({ size = "sm" }: { size?: Size }) {
  return <span className={`av ${size} you`}>you</span>;
}

/** Initials on a colour, for people on the Customers page. */
export function Initials({ name, size = 32 }: { name: string; size?: number }) {
  const initials = name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const palette = ["#c7925a", "#5b8a5a", "#5f8497", "#8a6fb5", "#b86e6e", "#6b8f9c", "#c9a23b", "#9a8a6a"];
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return (
    <span className="ini" style={{ width: size, height: size, background: palette[h % palette.length], fontSize: Math.round(size * 0.38) }}>
      {initials}
    </span>
  );
}
