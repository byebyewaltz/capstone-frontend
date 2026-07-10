import React, { useState, useEffect, useMemo } from "react";
import { Search, Bell, ChevronDown, LogOut, Trash2 } from "lucide-react";
import { api } from "../api.js";
import { useApp } from "../App.jsx";
import { initials, timeAgo, PRIORITY } from "../constants.js";

export default function Topbar() {
  const { me, view, setOpenTask, signOut, refresh, dataVersion, orgId } = useApp();
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [notifs, setNotifs] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [acctOpen, setAcctOpen] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  const loadNotifs = () => api.notifications().then(setNotifs).catch(() => {});
  useEffect(() => { loadNotifs(); }, [dataVersion]);

  // Debounced org-wide search.
  useEffect(() => {
    if (!q.trim()) { setResults([]); return; }
    const id = setTimeout(() => {
      api.search(orgId, q).then(setResults).catch(() => setResults([]));
    }, 200);
    return () => clearTimeout(id);
  }, [q]);

  const unread = useMemo(() => notifs.filter((n) => !n.is_read).length, [notifs]);

  const openResult = (t) => {
    setOpenTask({ projectId: t.project_id, taskId: t.id });
    setQ(""); setResults([]);
  };
  const openNotif = async (n) => {
    await api.readNotif(n.id).catch(() => {});
    if (n.task_id) {
      // The notification carries project_id (joined server-side), so the
      // drawer can open the task without scanning every board.
      setOpenTask({ projectId: n.project_id || null, taskId: n.task_id });
    }
    setNotifOpen(false);
    loadNotifs();
  };

  return (
    <header className="tf-top">
      <div className="tf-crumb">{view === "board" ? "Board" : view[0].toUpperCase() + view.slice(1)}</div>
      <div className="tf-search">
        <Search size={16} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tasks…" />
        {results.length > 0 && (
          <div className="tf-search-pop">
            {results.map((t) => (
              <button key={t.id} className="tf-search-row" onClick={() => openResult(t)}>
                <span className="tf-proj-key sm">{t.project_key}</span>
                <span className="tf-search-title">{t.title}</span>
                <span className="tf-prio-dot" style={{ background: PRIORITY[t.priority].color }} />
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="tf-top-right">
        <div className="tf-pop-wrap">
          <button className="tf-icon-btn lg" onClick={() => { setNotifOpen((v) => !v); setAcctOpen(false); }}>
            <Bell size={18} />{unread > 0 && <span className="tf-badge">{unread}</span>}
          </button>
          {notifOpen && (
            <div className="tf-pop">
              <div className="tf-pop-head"><span>Notifications</span>
                <button className="tf-link" onClick={async () => { await api.readAllNotifs(); loadNotifs(); }}>Mark all read</button>
              </div>
              {notifs.length === 0 && <div className="tf-empty-sm">You're all caught up.</div>}
              {notifs.map((n) => (
                <button key={n.id} className={`tf-notif ${n.is_read ? "" : "unread"}`} onClick={() => openNotif(n)}>
                  <span className="tf-notif-dot" />
                  <div><div className="tf-notif-text">{n.body}</div><div className="tf-notif-time">{timeAgo(n.created_at)}</div></div>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="tf-pop-wrap">
          <button className="tf-acct" onClick={() => { setAcctOpen((v) => !v); setNotifOpen(false); }}>
            <span className="tf-ava" style={{ background: me.color }}>{initials(me.name)}</span>
            <ChevronDown size={14} />
          </button>
          {acctOpen && (
            <div className="tf-pop right">
              <div className="tf-acct-head">
                <span className="tf-ava lg" style={{ background: me.color }}>{initials(me.name)}</span>
                <div><div className="tf-acct-name">{me.name}</div><div className="tf-acct-mail">{me.email}</div></div>
              </div>
              <button className="tf-acct-item" onClick={signOut}><LogOut size={15} /> Sign out</button>
              {!confirmDel ? (
                <button className="tf-acct-item danger" onClick={() => setConfirmDel(true)}><Trash2 size={15} /> Delete account</button>
              ) : (
                <div className="tf-del-confirm">
                  <p>This permanently removes your account and unassigns your tasks.</p>
                  <div className="tf-del-actions">
                    <button className="tf-btn tf-btn-sm" onClick={() => setConfirmDel(false)}>Cancel</button>
                    <button className="tf-btn tf-btn-sm tf-btn-danger"
                      onClick={async () => { await api.deleteAccount(); signOut(); }}>
                      Delete permanently
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
