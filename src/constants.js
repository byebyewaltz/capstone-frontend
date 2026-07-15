export const T = {
  paper: "#F4EFE6", paperDeep: "#EBE3D5", ink: "#2A2520", inkSoft: "#6B6255",
  terra: "#C4623D", terraDeep: "#A54A2A", terraSoft: "#E8C4B4",
  sage: "#7A8B6F", sand: "#D9CBB3", line: "#D8CEBD", white: "#FCFAF5",
  blue: "#5B7B9A", amber: "#D89B4A", rose: "#B5566B", green: "#6B8E5A",
};

export const ROLES = { owner: "Owner", admin: "Admin", member: "Member", viewer: "Viewer" };
export const ROLE_RANK = { viewer: 0, member: 1, admin: 2, owner: 3 };

export const PRIORITY = {
  low: { label: "Low", color: T.sage },
  medium: { label: "Medium", color: T.blue },
  high: { label: "High", color: T.amber },
  urgent: { label: "Urgent", color: T.rose },
};

export const initials = (n) =>
  (n || "?").split(" ").filter(Boolean).map((x) => x[0]).slice(0, 2).join("").toUpperCase();
export const fmtSize = (b) =>
  b >= 1e6 ? (b / 1e6).toFixed(1) + " MB"
  : b >= 1e3 ? (b / 1e3).toFixed(0) + " KB"
  : (b || 0) + " B";
export const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "";
// "YYYY-MM-DD" from the LOCAL calendar day. The API serializes DATE columns
// as local-midnight timestamps, so slicing the ISO string would shift the day
// in timezones east of UTC.
export const ymd = (d) => {
  if (!d) return "";
  const x = new Date(d);
  return [
    x.getFullYear(),
    String(x.getMonth() + 1).padStart(2, "0"),
    String(x.getDate()).padStart(2, "0"),
  ].join("-");
};
export const overdue = (d) => d && new Date(d) < new Date(new Date().toDateString());
export const timeAgo = (t) => {
  const s = Math.floor((Date.now() - new Date(t).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return Math.floor(s / 60) + "m ago";
  if (s < 86400) return Math.floor(s / 3600) + "h ago";
  return Math.floor(s / 86400) + "d ago";
};
