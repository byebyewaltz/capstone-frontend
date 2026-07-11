import React, { useState, useEffect, useCallback, createContext, useContext } from "react";
import { api, setToken, getToken } from "./api.js";
import { ROLE_RANK } from "./constants.js";
import AuthGate from "./views/AuthGate.jsx";
import Sidebar from "./views/Sidebar.jsx";
import Topbar from "./views/Topbar.jsx";
import Dashboard from "./views/Dashboard.jsx";
import Board from "./views/Board.jsx";
import TeamView from "./views/TeamView.jsx";
import SettingsView from "./views/SettingsView.jsx";
import TaskDrawer from "./views/TaskDrawer.jsx";

const AppCtx = createContext(null);
export const useApp = () => useContext(AppCtx);

export default function App() {
  const [me, setMe] = useState(null);
  const [orgs, setOrgs] = useState([]);
  const [orgId, setOrgId] = useState(null);       // active organization
  const [membership, setMembership] = useState(null);
  const [booting, setBooting] = useState(true);

  const [view, setView] = useState("dashboard");
  const [activeProject, setActiveProject] = useState(null);
  const [openTask, setOpenTask] = useState(null);
  const [dataVersion, setDataVersion] = useState(0);
  const refresh = useCallback(() => setDataVersion((v) => v + 1), []);

  // Resolve a stored session on load.
  useEffect(() => {
    (async () => {
      if (!getToken()) return setBooting(false);
      try {
        const { user } = await api.me();
        await establish(user);
      } catch {
        setToken(null);
      } finally {
        setBooting(false);
      }
    })();
  }, []);

  // Load the user and the organizations they belong to.
  // Load the user and the organizations they belong to. The API adopts an
  // org-less account into the default workspace, so `mine` should never be
  // empty; if it is, the fallback screen explains rather than crashing.
  async function establish(user) {
    setMe(user);
    const mine = await api.orgs();
    setOrgs(mine);
    const remembered = Number(localStorage.getItem("tf_org"));
    const chosen = mine.find((o) => o.id === remembered) || mine[0] || null;
    if (chosen) {
      await selectOrg(chosen.id, user, mine);
    } else {
      // Nothing to select — drop the stale preference so a later sign-in
      // doesn't try to restore a workspace that no longer exists.
      localStorage.removeItem("tf_org");
      setOrgId(null);
    }
  }

  // Switching org resets project/task context and re-resolves the caller's role.
  const selectOrg = useCallback(async (id, user = me, list = orgs) => {
    setOrgId(id);
    localStorage.setItem("tf_org", String(id));
    setActiveProject(null);
    setOpenTask(null);
    const org = list.find((o) => o.id === id);
    // The role comes back on the org row; fall back to the members lookup.
    if (org?.role) setMembership({ role: org.role });
    else {
      const members = await api.members(id);
      setMembership(members.find((m) => m.user_id === user.id) || null);
    }
    setView("dashboard");
    refresh();
  }, [me, orgs, refresh]);

  // The caller becomes the new org's owner; switch straight into it.
  async function createOrg({ name, slug }) {
    const org = await api.createOrg({ name, slug });
    const withRole = { ...org, role: "owner" };
    const next = [...orgs, withRole];
    setOrgs(next);
    await selectOrg(org.id, me, next);
    return org;
  }

  async function onAuthed({ user, token }) {
    setToken(token);
    await establish(user);
  }

  function signOut() {
    setToken(null);
    localStorage.removeItem("tf_org");
    setMe(null); setOrgs([]); setOrgId(null); setMembership(null);
    setView("dashboard"); setActiveProject(null);
  }

  const can = useCallback(
    (min) => membership && ROLE_RANK[membership.role] >= ROLE_RANK[min],
    [membership]
  );

  if (booting) return <div className="tf-boot">Loading TaskForge…</div>;
  if (!me) return <AuthGate onAuthed={onAuthed} />;
  // The API adopts every account into the default workspace, so this should
  // never render. It exists so a server-side failure can't produce a blank app.
  if (!orgId) {
    return (
      <div className="tf-boot">
        <div>
          <p className="tf-boot-title">Couldn't load your workspace</p>
          <p className="tf-boot-sub">
            The server didn't return one for this account. If the database was just
            reset, run <code>npm run db:seed</code> and reload.
          </p>
          <div className="tf-boot-actions">
            <button className="tf-btn tf-btn-primary" onClick={() => window.location.reload()}>Retry</button>
            <button className="tf-btn" onClick={signOut}>Sign out</button>
          </div>
        </div>
      </div>
    );
  }

  const ctx = {
    me, orgs, orgId, selectOrg, createOrg, membership, can, signOut,
    view, setView, activeProject, setActiveProject,
    openTask, setOpenTask, dataVersion, refresh,
  };

  return (
    <AppCtx.Provider value={ctx}>
      <div className="tf-app">
        <Sidebar />
        <main className="tf-main">
          <Topbar />
          <div className="tf-content">
            {view === "dashboard" && <Dashboard />}
            {view === "board" && <Board />}
            {view === "team" && <TeamView />}
            {view === "settings" && <SettingsView />}
          </div>
        </main>
        {openTask && (
          <TaskDrawer
            projectId={openTask.projectId}
            taskId={openTask.taskId}
            onClose={() => setOpenTask(null)}
          />
        )}
      </div>
    </AppCtx.Provider>
  );
}
