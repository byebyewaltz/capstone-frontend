import { useState, useEffect, useRef } from "react";
import { LayoutDashboard, Kanban, Users, Settings, Plus, Building2, ChevronsUpDown, Check } from "lucide-react";
import { api, ApiError } from "../api.js";
import { useApp } from "../context.js";
import { initials, ROLES, T } from "../constants.js";

export default function Sidebar() {
  const { view, setView, activeProject, setActiveProject, me, can, refresh, dataVersion,
          orgs, orgId, selectOrg, membership } = useApp();
  const [projects, setProjects] = useState([]);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [err, setErr] = useState("");
  const [orgOpen, setOrgOpen] = useState(false);
  const popRef = useRef(null);

  const org = orgs.find((o) => o.id === orgId);
  // With a single workspace there is nothing to switch between, so the header
  // is static rather than a dropdown.
  const canSwitch = orgs.length > 1;

  useEffect(() => {
    if (!orgId) return;
    api.projects(orgId)
      .then((rows) => {
        setProjects(rows);
        setActiveProject((cur) => (rows.some((p) => p.id === cur) ? cur : rows[0]?.id ?? null));
      })
      .catch(() => setProjects([]));
  }, [dataVersion, orgId, setActiveProject]);

  useEffect(() => {
    const onDoc = (e) => { if (popRef.current && !popRef.current.contains(e.target)) setOrgOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const nav = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "board", label: "Board", icon: Kanban },
    { id: "team", label: "Team", icon: Users },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const addProject = async () => {
    if (!name.trim()) return;
    setErr("");
    // Keys are unique per org and render as chips, so no spaces or symbols.
    const key = (name.replace(/[^a-zA-Z0-9]/g, "").slice(0, 3) || "PRJ").toUpperCase();
    try {
      const p = await api.createProject(orgId, { name: name.trim(), key, color: T.blue });
      setName(""); setAdding(false); setActiveProject(p.id); refresh();
    } catch (e) {
      setErr(e instanceof ApiError
        ? (e.status === 409 ? `Key “${key}” is already used by another project.` : e.message)
        : "Could not create project.");
    }
  };

  const orgHeader = (
    <>
      <div className="tf-org-mark"><Building2 size={16} /></div>
      <div className="tf-org-text">
        <div className="tf-org-name">{org?.name || "…"}</div>
        <div className="tf-org-sub">{membership ? ROLES[membership.role] : "Workspace"}</div>
      </div>
      {canSwitch && <ChevronsUpDown size={14} className="tf-org-chev" />}
    </>
  );

  return (
    <aside className="tf-side">
      <div className="tf-org-wrap" ref={popRef}>
        {canSwitch ? (
          <button className="tf-org" onClick={() => setOrgOpen((v) => !v)}>{orgHeader}</button>
        ) : (
          <div className="tf-org static">{orgHeader}</div>
        )}
        {canSwitch && orgOpen && (
          <div className="tf-org-pop">
            <div className="tf-org-pop-head">Your workspaces</div>
            {orgs.map((o) => (
              <button key={o.id} className={`tf-org-row ${o.id === orgId ? "on" : ""}`}
                onClick={() => { selectOrg(o.id); setOrgOpen(false); }}>
                <span className="tf-org-dot">{initials(o.name)}</span>
                <span className="tf-org-row-name">{o.name}</span>
                <span className="tf-role-chip" data-role={o.role}>{ROLES[o.role]}</span>
                {o.id === orgId && <Check size={13} className="tf-org-check" />}
              </button>
            ))}
          </div>
        )}
      </div>

      <nav className="tf-nav">
        {nav.map((n) => (
          <button key={n.id} className={`tf-nav-item ${view === n.id ? "on" : ""}`} onClick={() => setView(n.id)}>
            <n.icon size={17} /><span>{n.label}</span>
          </button>
        ))}
      </nav>

      <div className="tf-side-sec">
        <div className="tf-side-head"><span>Projects</span>
          {can("admin") && <button className="tf-icon-btn" onClick={() => setAdding((v) => !v)}><Plus size={14} /></button>}
        </div>
        {projects.length === 0 && <div className="tf-side-empty">No projects yet.</div>}
        {projects.map((p) => (
          <button key={p.id} className={`tf-proj ${activeProject === p.id && view === "board" ? "on" : ""}`}
            onClick={() => { setActiveProject(p.id); setView("board"); }}>
            <span className="tf-proj-key" style={{ background: p.color }}>{p.key}</span>
            <span className="tf-proj-name">{p.name}</span>
          </button>
        ))}
        {adding && (
          <div className="tf-proj-add">
            <input autoFocus value={name} onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addProject()} placeholder="Project name" />
            <button className="tf-btn tf-btn-sm tf-btn-primary" onClick={addProject}>Add</button>
          </div>
        )}
        {err && <div className="tf-side-err">{err}</div>}
      </div>

      <div className="tf-side-foot">
        <span className="tf-ava" style={{ background: me.color }}>{initials(me.name)}</span>
        <div className="tf-side-me"><div>{me.name}</div><div>{me.email}</div></div>
      </div>
    </aside>
  );
}
