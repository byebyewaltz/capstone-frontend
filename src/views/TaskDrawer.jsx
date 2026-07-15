import { useState, useEffect, useRef, useCallback } from "react";
import { X, Trash2, Paperclip, MessageSquare, Send, FileText, Plus } from "lucide-react";
import { api } from "../api.js";
import { useApp } from "../context.js";
import { PRIORITY, initials, fmtSize, timeAgo, ymd, T } from "../constants.js";

export default function TaskDrawer({ projectId, taskId, onClose }) {
  const { me, can, refresh, orgId } = useApp();
  const fileRef = useRef(null);
  const [pid, setPid] = useState(projectId);
  const [task, setTask] = useState(null);
  const [members, setMembers] = useState([]);
  const [comments, setComments] = useState([]);
  const [files, setFiles] = useState([]);
  const [comment, setComment] = useState("");
  const [confirmDel, setConfirmDel] = useState(false);
  const editable = can("member");

  // Resolve the project if we only got a task_id (e.g. from a notification).
  const resolveProject = useCallback(async () => {
    if (projectId) return projectId;
    const projs = await api.projects(orgId);
    for (const p of projs) {
      const tks = await api.tasks(orgId, p.id);
      if (tks.some((t) => t.id === taskId)) return p.id;
    }
    return null;
  }, [orgId, projectId, taskId]);

  const load = useCallback(async () => {
    const resolved = await resolveProject();
    if (!resolved) return onClose();
    setPid(resolved);
    const [tks, mem, cms, atts] = await Promise.all([
      api.tasks(orgId, resolved),
      api.members(orgId),
      api.comments(orgId, resolved, taskId),
      api.attachments(orgId, resolved, taskId),
    ]);
    setTask(tks.find((t) => t.id === taskId) || null);
    setMembers(mem);
    setComments(cms);
    setFiles(atts);
  }, [orgId, resolveProject, taskId, onClose]);

  // If the task can't be loaded at all (deleted, or its project lives in a
  // different workspace than the active one), close rather than hanging open
  // invisibly with `task` stuck at null.
  useEffect(() => { load().catch(onClose); }, [load, onClose]);

  if (!task) return null;

  const patch = async (body) => {
    try {
      const updated = await api.updateTask(orgId, pid, taskId, body);
      setTask(updated);
      refresh();
    } catch {
      load(); // e.g. an emptied title is refused server-side — resync
    }
  };
  const addComment = async () => {
    if (!comment.trim()) return;
    await api.addComment(orgId, pid, taskId, comment.trim());
    setComment("");
    setComments(await api.comments(orgId, pid, taskId));
    refresh();
  };
  const onFiles = async (e) => {
    for (const f of e.target.files) {
      await api.addAttachment(orgId, pid, taskId, { filename: f.name, sizeBytes: f.size });
    }
    e.target.value = "";
    setFiles(await api.attachments(orgId, pid, taskId));
  };
  const removeFile = async (id) => {
    await api.deleteAttachment(orgId, pid, taskId, id);
    setFiles(await api.attachments(orgId, pid, taskId));
  };
  const deleteTask = async () => {
    await api.deleteTask(orgId, pid, taskId);
    refresh();
    onClose();
  };

  return (
    <div className="tf-drawer-scrim" onClick={onClose}>
      <div className="tf-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="tf-drawer-top">
          <span className="tf-drawer-id">TASK-{task.id}</span>
          <div className="tf-drawer-top-actions">
            {editable && (confirmDel ? (
              <span className="tf-inline-confirm">Delete task?
                <button className="tf-btn tf-btn-sm tf-btn-danger" onClick={deleteTask}>Yes</button>
                <button className="tf-btn tf-btn-sm" onClick={() => setConfirmDel(false)}>No</button>
              </span>
            ) : (
              <button className="tf-icon-btn danger" onClick={() => setConfirmDel(true)}><Trash2 size={16} /></button>
            ))}
            <button className="tf-icon-btn" onClick={onClose}><X size={18} /></button>
          </div>
        </div>

        <div className="tf-drawer-body">
          {editable ? (
            <input className="tf-drawer-title" value={task.title}
              onChange={(e) => setTask({ ...task, title: e.target.value })}
              onBlur={(e) => patch({ title: e.target.value })} />
          ) : <h3 className="tf-drawer-title ro">{task.title}</h3>}

          <div className="tf-drawer-props">
            <Prop label="Assignee">
              <select disabled={!editable} value={task.assignee_id || ""}
                onChange={(e) => patch({ assigneeId: e.target.value ? Number(e.target.value) : "" })}>
                <option value="">Unassigned</option>
                {members.map((m) => <option key={m.user_id} value={m.user_id}>{m.name}</option>)}
              </select>
            </Prop>
            <Prop label="Priority">
              <select disabled={!editable} value={task.priority} onChange={(e) => patch({ priority: e.target.value })}>
                {Object.keys(PRIORITY).map((k) => <option key={k} value={k}>{PRIORITY[k].label}</option>)}
              </select>
            </Prop>
            <Prop label="Due date">
              <input type="date" disabled={!editable} value={ymd(task.due_date)}
                onChange={(e) => patch({ dueDate: e.target.value })} />
            </Prop>
          </div>

          <div className="tf-drawer-sec">
            <label className="tf-sec-label">Description</label>
            {editable ? (
              <textarea className="tf-desc" value={task.description || ""} placeholder="Add more detail…"
                onChange={(e) => setTask({ ...task, description: e.target.value })}
                onBlur={(e) => patch({ description: e.target.value })} />
            ) : <p className="tf-desc ro">{task.description || "No description."}</p>}
          </div>

          <div className="tf-drawer-sec">
            <label className="tf-sec-label"><Paperclip size={13} /> Attachments ({files.length})</label>
            <div className="tf-files">
              {files.map((f) => (
                <div key={f.id} className="tf-file">
                  <FileText size={16} />
                  <div className="tf-file-meta"><div className="tf-file-name">{f.filename}</div>
                    <div className="tf-file-sub">{fmtSize(f.size_bytes)} · {timeAgo(f.created_at)}</div></div>
                  {editable && <button className="tf-icon-btn danger sm" onClick={() => removeFile(f.id)}><X size={13} /></button>}
                </div>
              ))}
              {editable && (
                <button className="tf-file-add" onClick={() => fileRef.current?.click()}>
                  <Plus size={14} /> Upload file
                  <input ref={fileRef} type="file" multiple hidden onChange={onFiles} />
                </button>
              )}
            </div>
          </div>

          <div className="tf-drawer-sec">
            <label className="tf-sec-label"><MessageSquare size={13} /> Comments ({comments.length})</label>
            <div className="tf-comments">
              {comments.map((c) => (
                <div key={c.id} className="tf-comment">
                  <span className="tf-ava sm" style={{ background: c.color || T.sand }}>{c.name ? initials(c.name) : "?"}</span>
                  <div className="tf-comment-body">
                    <div className="tf-comment-head"><b>{c.name || "Removed user"}</b><span>{timeAgo(c.created_at)}</span></div>
                    <div className="tf-comment-text">{c.body}</div>
                  </div>
                </div>
              ))}
              {comments.length === 0 && <div className="tf-empty-sm">No comments yet.</div>}
            </div>
            {editable && (
              <div className="tf-comment-compose">
                <span className="tf-ava sm" style={{ background: me.color }}>{initials(me.name)}</span>
                <input value={comment} placeholder="Write a comment…" onChange={(e) => setComment(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addComment()} />
                <button className="tf-icon-btn primary" onClick={addComment}><Send size={15} /></button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Prop({ label, children }) {
  return <div className="tf-prop"><span className="tf-prop-label">{label}</span>{children}</div>;
}
