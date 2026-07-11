import { useState, useEffect, useMemo, useCallback } from "react";
import { Shield, Trash2, UserPlus, Building2, Plus, Check } from "lucide-react";
import { api, ApiError } from "../api.js";
import { useApp } from "../context.js";
import { ROLES, ROLE_RANK, initials } from "../constants.js";

export default function TeamView() {
  const { me, membership, can, dataVersion, refresh, orgId, orgs, createOrg, selectOrg } = useApp();
  const [members, setMembers] = useState([]);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [confirmRemove, setConfirmRemove] = useState(null); // member id pending removal

  // Assign panel
  const [directory, setDirectory] = useState([]);
  const [picked, setPicked] = useState("");
  const [assignRole, setAssignRole] = useState("member");
  const [busy, setBusy] = useState(false);

  // Create-organization panel
  const [creating, setCreating] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [orgSlug, setOrgSlug] = useState("");
  const [touchedSlug, setTouchedSlug] = useState(false);

  const org = orgs.find((o) => o.id === orgId);
  const myRank = membership ? ROLE_RANK[membership.role] : -1;

  // Roles the caller may grant: owners can grant up to admin, admins up to
  // member. Nobody grants "owner" from this screen.
  const grantable = useMemo(
    () => Object.keys(ROLES).filter((r) => r !== "owner" && ROLE_RANK[r] < myRank),
    [myRank]
  );

  const load = useCallback(
    () => api.members(orgId).then(setMembers).catch(() => {}),
    [orgId]
  );

  useEffect(() => {
    load();
    // Leaving stale banners/confirms up after an org switch is confusing.
    setErr(""); setOk(""); setConfirmRemove(null); setPicked("");
  }, [dataVersion, load]);

  // The directory is admin-only; a viewer's request would 403, so don't ask.
  useEffect(() => {
    if (!can("admin") || !orgId) {
      setDirectory([]);
      return;
    }
    api.assignable(orgId).then(setDirectory).catch(() => setDirectory([]));
  }, [dataVersion, orgId, can]);

  const flash = (msg) => { setOk(msg); setTimeout(() => setOk(""), 2600); };

  // A row is editable when the caller outranks that member. Owners are never
  // editable here, and you can't change or remove yourself.
  const canEditRow = (m) =>
    can("admin") && m.user_id !== me.id && m.role !== "owner" && ROLE_RANK[m.role] < myRank;

  const changeRole = async (memberId, role) => {
    setErr("");
    try { await api.setRole(orgId, memberId, role); load(); refresh(); }
    catch (e) { setErr(e instanceof ApiError ? e.message : "Could not update role."); }
  };

  const remove = async (memberId) => {
    setErr(""); setConfirmRemove(null);
    try { await api.removeMember(orgId, memberId); load(); refresh(); }
    catch (e) { setErr(e instanceof ApiError ? e.message : "Could not remove member."); }
  };

  // Only offer people who aren't already in this org.
  const candidates = directory.filter((u) => !u.is_member);

  // Assign an existing account to this organization. The picker works on
  // email: choosing a suggestion fills the email in, and free-typed emails
  // are sent as-is so the server can resolve accounts we can't see.
  const assign = async () => {
    const value = picked.trim();
    if (!value) return setErr("Choose someone to assign, or type an email.");
    setErr(""); setBusy(true);
    try {
      const match = candidates.find((u) => u.email.toLowerCase() === value.toLowerCase());
      const who = match ? { userId: match.id } : { email: value };
      const added = await api.addMember(orgId, who, assignRole);
      flash(`${added?.name || match?.name || "They"} joined ${org?.name || "the workspace"}.`);
      setPicked(""); load(); refresh();
    } catch (e) {
      setErr(e instanceof ApiError
        ? (e.status === 404 ? "No account matches that person."
          : e.status === 409 ? "They're already in this organization."
          : e.status === 403 ? "You don't have permission to assign people."
          : e.message)
        : "Could not assign that person.");
    } finally { setBusy(false); }
  };

  const onOrgName = (v) => {
    setOrgName(v);
    if (!touchedSlug) {
      setOrgSlug(v.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 24));
    }
  };

  const submitOrg = async () => {
    if (!orgName.trim() || !orgSlug.trim()) return setErr("Name and slug are both required.");
    setErr(""); setBusy(true);
    try {
      const created = await createOrg({ name: orgName.trim(), slug: orgSlug.trim() });
      flash(`Created ${created.name}. You're its owner.`);
      setOrgName(""); setOrgSlug(""); setTouchedSlug(false); setCreating(false);
    } catch (e) {
      setErr(e instanceof ApiError && e.status === 409
        ? "That slug is already taken."
        : "Could not create the organization.");
    } finally { setBusy(false); }
  };

  return (
    <div className="tf-team">
      <div className="tf-eyebrow">People</div>
      <h2 className="tf-h2">Team & roles</h2>
      <p className="tf-lede">Roles decide who can move, edit, and delete work. Only owners and admins can change them.</p>

      {!can("admin") && membership && (
        <div className="tf-note"><Shield size={15} /> You&rsquo;re a <b>{ROLES[membership.role]}</b>. Role management is read-only for you.</div>
      )}
      {err && <div className="tf-auth-err" style={{ marginTop: 12 }}>{err}</div>}
      {ok && <div className="tf-ok"><Check size={14} /> {ok}</div>}

      {can("admin") && (
        <div className="tf-org-admin">
          {/* ── Assign an existing account to this organization ───────────── */}
          <div className="tf-panel">
            <div className="tf-panel-head">
              <UserPlus size={15} />
              <div>
                <h4>Assign to {org?.name || "this workspace"}</h4>
                <p>Pick an existing account, or type an email address.</p>
              </div>
            </div>
            <div className="tf-panel-row">
              <input list="tf-people" value={picked} placeholder="Search people or enter an email"
                onChange={(e) => { setPicked(e.target.value); setErr(""); }}
                onKeyDown={(e) => e.key === "Enter" && assign()} />
              <datalist id="tf-people">
                {candidates.map((u) => <option key={u.id} value={u.email}>{u.name}</option>)}
              </datalist>
              <select value={assignRole} onChange={(e) => setAssignRole(e.target.value)}>
                {grantable.map((r) => <option key={r} value={r}>{ROLES[r]}</option>)}
              </select>
              <button className="tf-btn tf-btn-primary tf-btn-sm" onClick={assign} disabled={busy}>
                {busy ? "Assigning…" : "Assign"}
              </button>
            </div>
            {candidates.length > 0 && (
              <div className="tf-chiprow">
                {candidates.slice(0, 6).map((u) => (
                  <button key={u.id} className={`tf-person-chip ${picked === u.email ? "on" : ""}`}
                    onClick={() => setPicked(u.email)}>
                    <span className="tf-ava xs" style={{ background: u.color }}>{initials(u.name)}</span>
                    {u.name}
                  </button>
                ))}
                {candidates.length > 6 && <span className="tf-chip-more">+{candidates.length - 6} more</span>}
              </div>
            )}
            {candidates.length === 0 && directory.length > 0 && (
              <p className="tf-panel-empty">Everyone with an account is already in this workspace.</p>
            )}
          </div>

          {/* ── Create a new organization ─────────────────────────────────── */}
          <div className="tf-panel">
            <div className="tf-panel-head">
              <Building2 size={15} />
              <div>
                <h4>Create an organization</h4>
                <p>You&rsquo;ll become its owner. Work stays isolated from other workspaces.</p>
              </div>
            </div>
            {!creating ? (
              <button className="tf-btn tf-btn-sm" onClick={() => setCreating(true)}>
                <Plus size={14} /> New organization
              </button>
            ) : (
              <>
                <div className="tf-panel-row">
                  <input autoFocus value={orgName} placeholder="Organization name"
                    onChange={(e) => onOrgName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && submitOrg()} />
                  <input className="tf-slug" value={orgSlug} placeholder="slug"
                    onChange={(e) => { setTouchedSlug(true); setOrgSlug(e.target.value); }}
                    onKeyDown={(e) => e.key === "Enter" && submitOrg()} />
                  <button className="tf-btn tf-btn-primary tf-btn-sm" onClick={submitOrg} disabled={busy}>
                    {busy ? "Creating…" : "Create"}
                  </button>
                  <button className="tf-btn tf-btn-sm" onClick={() => setCreating(false)}>Cancel</button>
                </div>
                <p className="tf-panel-empty">taskforge.io/{orgSlug || "your-team"}</p>
              </>
            )}
            {orgs.length > 1 && (
              <div className="tf-chiprow">
                {orgs.map((o) => (
                  <button key={o.id} className={`tf-person-chip ${o.id === orgId ? "on" : ""}`}
                    onClick={() => selectOrg(o.id)}>
                    <Building2 size={12} /> {o.name}
                    <span className="tf-role-chip sm" data-role={o.role}>{ROLES[o.role]}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="tf-table">
        <div className="tf-tr tf-th"><span>Member</span><span>Email</span><span>Role</span><span></span></div>
        {members.map((m) => {
          const isSelf = m.user_id === me.id;
          const editable = canEditRow(m);
          return (
            <div key={m.id} className="tf-tr">
              <span className="tf-td-member">
                <span className="tf-ava" style={{ background: m.color }}>{initials(m.name)}</span>
                {m.name}{isSelf && <em>you</em>}
              </span>
              <span className="tf-td-mail">{m.email}</span>
              <span>
                {editable ? (
                  <select className="tf-role-select" value={m.role} onChange={(e) => changeRole(m.id, e.target.value)}>
                    {/* Include the current role even if it isn't grantable, so the select isn't lying. */}
                    {[...new Set([m.role, ...grantable])].map((r) => <option key={r} value={r}>{ROLES[r]}</option>)}
                  </select>
                ) : <span className="tf-role-chip" data-role={m.role}>{ROLES[m.role]}</span>}
              </span>
              <span>
                {editable && (confirmRemove === m.id ? (
                  <span className="tf-inline-confirm">Remove?
                    <button className="tf-btn tf-btn-sm tf-btn-danger" onClick={() => remove(m.id)}>Yes</button>
                    <button className="tf-btn tf-btn-sm" onClick={() => setConfirmRemove(null)}>No</button>
                  </span>
                ) : (
                  <button className="tf-icon-btn danger sm" title={`Remove ${m.name}`}
                    onClick={() => setConfirmRemove(m.id)}><Trash2 size={14} /></button>
                ))}
              </span>
            </div>
          );
        })}
      </div>

      <div className="tf-perm-legend">
        <h4>What each role can do</h4>
        <div className="tf-perm-grid">
          {[
            { r: "owner", d: "Full control. Manage org, roles, and all work." },
            { r: "admin", d: "Manage members, projects, and every task." },
            { r: "member", d: "Create, move, edit, and comment on tasks." },
            { r: "viewer", d: "Read-only. Can view boards but not change them." },
          ].map((x) => (
            <div key={x.r} className="tf-perm-card">
              <span className="tf-role-chip" data-role={x.r}>{ROLES[x.r]}</span>
              <p>{x.d}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}