// Thin fetch wrapper around the TaskForge REST API. Holds the JWT in memory
// (mirrored to localStorage so a refresh keeps you signed in) and throws an
// ApiError carrying the HTTP status so the UI can react per-status.

let token = localStorage.getItem("tf_token") || null;

export function setToken(t) {
  token = t;
  if (t) localStorage.setItem("tf_token", t);
  else localStorage.removeItem("tf_token");
}
export const getToken = () => token;

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

async function request(method, path, body) {
  const res = await fetch(path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch {}
  if (!res.ok) {
    throw new ApiError(res.status, data?.error || `Request failed (${res.status})`);
  }
  return data;
}

const get = (p) => request("GET", p);
const post = (p, b) => request("POST", p, b);
const patch = (p, b) => request("PATCH", p, b);
const del = (p, b) => request("DELETE", p, b);

export const api = {
  // auth
  register: (body) => post("/auth/register", body),
  login: (body) => post("/auth/login", body),
  me: () => get("/auth/me"),
  deleteAccount: () => del("/auth/me"),

  // org + members
  // Note: the API still exposes POST /orgs, but the UI no longer creates
  // organizations — new accounts auto-join the default workspace.
  orgs: () => get("/orgs"),
  getOrg: (orgId) => get(`/orgs/${orgId}`),
  members: (orgId) => get(`/orgs/${orgId}/members`),
  addMember: (orgId, email, role) => post(`/orgs/${orgId}/members`, { email, role }),
  setRole: (orgId, memberId, role) => patch(`/orgs/${orgId}/members/${memberId}`, { role }),
  removeMember: (orgId, memberId) => del(`/orgs/${orgId}/members/${memberId}`),

  // projects
  projects: (orgId) => get(`/orgs/${orgId}/projects`),
  createProject: (orgId, body) => post(`/orgs/${orgId}/projects`, body),
  columns: (orgId, projectId) => get(`/orgs/${orgId}/projects/${projectId}/columns`),
  analytics: (orgId) => get(`/orgs/${orgId}/projects/analytics`),
  search: (orgId, q) => get(`/orgs/${orgId}/projects/search?q=${encodeURIComponent(q)}`),

  // tasks
  tasks: (orgId, projectId, params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v && v !== "all")
    ).toString();
    return get(`/orgs/${orgId}/projects/${projectId}/tasks${qs ? "?" + qs : ""}`);
  },
  createTask: (orgId, projectId, body) => post(`/orgs/${orgId}/projects/${projectId}/tasks`, body),
  updateTask: (orgId, projectId, taskId, body) => patch(`/orgs/${orgId}/projects/${projectId}/tasks/${taskId}`, body),
  moveTask: (orgId, projectId, taskId, body) => post(`/orgs/${orgId}/projects/${projectId}/tasks/${taskId}/move`, body),
  deleteTask: (orgId, projectId, taskId) => del(`/orgs/${orgId}/projects/${projectId}/tasks/${taskId}`),

  // comments + attachments
  comments: (orgId, projectId, taskId) => get(`/orgs/${orgId}/projects/${projectId}/tasks/${taskId}/comments`),
  addComment: (orgId, projectId, taskId, body) => post(`/orgs/${orgId}/projects/${projectId}/tasks/${taskId}/comments`, { body }),
  attachments: (orgId, projectId, taskId) => get(`/orgs/${orgId}/projects/${projectId}/tasks/${taskId}/attachments`),
  addAttachment: (orgId, projectId, taskId, body) => post(`/orgs/${orgId}/projects/${projectId}/tasks/${taskId}/attachments`, body),
  deleteAttachment: (orgId, projectId, taskId, attId) => del(`/orgs/${orgId}/projects/${projectId}/tasks/${taskId}/attachments/${attId}`),

  // notifications
  notifications: () => get("/notifications"),
  readNotif: (id) => patch(`/notifications/${id}/read`),
  readAllNotifs: () => patch("/notifications/read-all"),
};
