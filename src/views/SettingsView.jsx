import { useState, useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { api, ApiError } from "../api.js";
import { useApp } from "../context.js";
import { ROLES } from "../constants.js";

export default function SettingsView() {
  const { me, membership, orgId, orgs, can, deleteOrg } = useApp();
  const [memberCount, setMemberCount] = useState(0);
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const org = orgs.find((o) => o.id === orgId);

  useEffect(() => {
    if (!orgId) return;
    api.members(orgId).then((m) => setMemberCount(m.length)).catch(() => {});
    // A half-typed confirmation must not survive an org switch.
    setConfirm(""); setErr("");
  }, [orgId]);

  const destroy = async () => {
    setErr(""); setBusy(true);
    try {
      await deleteOrg(confirm); // success switches org, unmounting this view
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Could not delete the organization.");
      setBusy(false);
    }
  };

  return (
    <div className="tf-settings">
      <div className="tf-eyebrow">Configuration</div>
      <h2 className="tf-h2">Settings</h2>
      <div className="tf-set-card">
        <h4>Organization</h4>
        <div className="tf-set-row"><span>Name</span><b>{org?.name || "—"}</b></div>
        <div className="tf-set-row"><span>Slug</span><code>{org?.slug || "—"}</code></div>
        <div className="tf-set-row"><span>Members</span><b>{memberCount}</b></div>
      </div>
      <div className="tf-set-card">
        <h4>Your profile</h4>
        <div className="tf-set-row"><span>Name</span><b>{me.name}</b></div>
        <div className="tf-set-row"><span>Email</span><b>{me.email}</b></div>
        {membership && <div className="tf-set-row"><span>Role here</span>
          <span className="tf-role-chip" data-role={membership.role}>{ROLES[membership.role]}</span></div>}
      </div>

      {can("owner") && (
        <div className="tf-set-card danger">
          <h4><AlertTriangle size={15} /> Danger zone</h4>
          <p className="tf-set-danger-text">
            Deleting <b>{org?.name}</b> permanently removes every project, task, comment,
            and membership in it. This cannot be undone.
          </p>
          {orgs.length <= 1 ? (
            <p className="tf-set-danger-text">
              You can&rsquo;t delete your only workspace — create another organization first
              (Team &rsaquo; Create an organization).
            </p>
          ) : (
            <div className="tf-panel-row">
              <input value={confirm} placeholder={`Type “${org?.name}” to confirm`}
                onChange={(e) => { setConfirm(e.target.value); setErr(""); }} />
              <button className="tf-btn tf-btn-sm tf-btn-danger"
                disabled={busy || confirm !== org?.name} onClick={destroy}>
                {busy ? "Deleting…" : "Delete organization"}
              </button>
            </div>
          )}
          {err && <div className="tf-auth-err" style={{ marginTop: 10 }}>{err}</div>}
        </div>
      )}

      <p className="tf-lede">
        To delete your account, use the account menu in the top-right corner.
      </p>
    </div>
  );
}
