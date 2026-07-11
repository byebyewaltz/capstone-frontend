import { useState, useEffect, useCallback } from "react";
import { Filter, User, Plus, Calendar } from "lucide-react";
import { api } from "../api.js";
import { useApp } from "../context.js";
import { PRIORITY, initials, fmtDate, overdue } from "../constants.js";

export default function Board() {
  const { activeProject, can, setOpenTask, dataVersion, refresh, orgId } = useApp();
  const [project, setProject] = useState(null);
  const [columns, setColumns] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [fPriority, setFPriority] = useState("all");
  const [fAssignee, setFAssignee] = useState("all");
  const [drag, setDrag] = useState(null);
  const [overCol, setOverCol] = useState(null);
  const [composerCol, setComposerCol] = useState(null);

  const load = useCallback(async () => {
    if (!activeProject) return;
    const [projs, cols, tks, mem] = await Promise.all([
      api.projects(orgId),
      api.columns(orgId, activeProject),
      api.tasks(orgId, activeProject),
      api.members(orgId),
    ]);
    setProject(projs.find((p) => p.id === activeProject) || null);
    setColumns(cols.sort((a, b) => a.position - b.position));
    setTasks(tks);
    setMembers(mem);
  }, [orgId, activeProject]);

  useEffect(() => { load(); }, [load, dataVersion]);

  const visible = (t) =>
    (fPriority === "all" || t.priority === fPriority) &&
    (fAssignee === "all" || t.assignee_id === Number(fAssignee));

  const onDrop = async (colId, index) => {
    if (!drag) return;
    const moving = tasks.find((t) => t.id === drag);
    setDrag(null); setOverCol(null);
    if (!moving) return;
    // Optimistic: reflect the move locally, then persist. Reload on failure.
    setTasks((prev) => {
      const others = prev.filter((t) => t.id !== drag);
      const dest = others.filter((t) => t.column_id === colId).sort((a, b) => a.position - b.position);
      dest.splice(index, 0, { ...moving, column_id: colId });
      const renum = dest.map((t, i) => ({ ...t, position: i }));
      return [...others.filter((t) => t.column_id !== colId), ...renum];
    });
    try {
      await api.moveTask(orgId, activeProject, drag, { toColumnId: colId, toPosition: index });
    } catch {
      load(); // revert to server truth
    }
  };

  if (!activeProject) return <div className="tf-empty">Select a project to see its board.</div>;

  return (
    <div className="tf-board-wrap">
      <div className="tf-board-head">
        <div>
          {project && <span className="tf-proj-key lg" style={{ background: project.color }}>{project.key}</span>}
          <h2 className="tf-h3">{project?.name}</h2>
        </div>
        <div className="tf-filters">
          <div className="tf-filter"><Filter size={13} />
            <select value={fPriority} onChange={(e) => setFPriority(e.target.value)}>
              <option value="all">All priorities</option>
              {Object.keys(PRIORITY).map((k) => <option key={k} value={k}>{PRIORITY[k].label}</option>)}
            </select>
          </div>
          <div className="tf-filter"><User size={13} />
            <select value={fAssignee} onChange={(e) => setFAssignee(e.target.value)}>
              <option value="all">Anyone</option>
              {members.map((m) => <option key={m.user_id} value={m.user_id}>{m.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="tf-board">
        {columns.map((col) => {
          const items = tasks.filter((t) => t.column_id === col.id && visible(t)).sort((a, b) => a.position - b.position);
          return (
            <div key={col.id} className={`tf-col ${overCol === col.id ? "over" : ""}`}
              onDragOver={(e) => { e.preventDefault(); setOverCol(col.id); }}
              onDragLeave={() => setOverCol((c) => (c === col.id ? null : c))}
              onDrop={() => onDrop(col.id, items.length)}>
              <div className="tf-col-head">
                <span className="tf-col-name">{col.name}</span>
                <span className="tf-col-count">{items.length}</span>
              </div>
              <div className="tf-col-body">
                {items.map((t, i) => (
                  <div key={t.id}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDrop={(e) => { e.stopPropagation(); onDrop(col.id, i); }}>
                    <TaskCard task={t} members={members} draggable={can("member")}
                      columnName={col.name}
                      onDragStart={() => setDrag(t.id)}
                      onClick={() => setOpenTask({ projectId: activeProject, taskId: t.id })} />
                  </div>
                ))}
                {composerCol === col.id ? (
                  <QuickAdd columnId={col.id} onDone={() => setComposerCol(null)}
                    onCreated={() => { setComposerCol(null); load(); refresh(); }} />
                ) : can("member") ? (
                  <button className="tf-add-card" onClick={() => setComposerCol(col.id)}><Plus size={14} /> Add task</button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TaskCard({ task, members, columnName, draggable, onDragStart, onClick }) {
  const assignee = members.find((m) => m.user_id === task.assignee_id);
  const prio = PRIORITY[task.priority] || PRIORITY.medium;
  const isDone = /done/i.test(columnName || "");
  const isOver = !isDone && overdue(task.due_date);
  return (
    <article className="tf-card" draggable={draggable} onDragStart={onDragStart} onClick={onClick}>
      <div className="tf-card-prio" style={{ background: prio.color }} />
      <div className="tf-card-body">
        <div className="tf-card-title">{task.title}</div>
        <div className="tf-card-meta">
          {task.due_date && (
            <span className={`tf-chip ${isOver ? "over" : ""}`}><Calendar size={11} />{fmtDate(task.due_date)}</span>
          )}
          <span className="tf-chip"><span className="tf-prio-dot sm" style={{ background: prio.color }} />{prio.label}</span>
        </div>
        <div className="tf-card-foot">
          {assignee
            ? <span className="tf-ava sm" style={{ background: assignee.color }}>{initials(assignee.name)}</span>
            : <span className="tf-ava sm ghost"><User size={12} /></span>}
        </div>
      </div>
    </article>
  );
}

function QuickAdd({ columnId, onDone, onCreated }) {
  const { activeProject, orgId } = useApp();
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const save = async () => {
    if (!title.trim()) return onDone();
    setBusy(true);
    try {
      await api.createTask(orgId, activeProject, { title: title.trim(), columnId });
      onCreated();
    } catch {
      // keep the composer (and its text) open so the user can retry
    } finally { setBusy(false); }
  };
  return (
    <div className="tf-quickadd">
      <textarea autoFocus value={title} placeholder="What needs doing?"
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); save(); } if (e.key === "Escape") onDone(); }} />
      <div className="tf-quickadd-actions">
        <button className="tf-btn tf-btn-sm tf-btn-primary" onClick={save} disabled={busy}>Add task</button>
        <button className="tf-btn tf-btn-sm" onClick={onDone}>Cancel</button>
      </div>
    </div>
  );
}
