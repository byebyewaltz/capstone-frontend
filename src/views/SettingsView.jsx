import React, { useState, useEffect } from "react";
import { api } from "../api.js";
import { useApp } from "../App.jsx";
import { ROLES } from "../constants.js";

export default function SettingsView() {
  const { me, membership, orgId, orgs } = useApp();
  const [memberCount, setMemberCount] = useState(0);
  const org = orgs.find((o) => o.id === orgId);

  useEffect(() => {
    if (!orgId) return;
    api.members(orgId).then((m) => setMemberCount(m.length)).catch(() => {});
  }, [orgId]);

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
      <p className="tf-lede">
        To delete your account, use the account menu in the top-right corner.
      </p>
    </div>
  );
}
