import { useState } from "react";
import { api, ApiError } from "../api.js";
import { initials, ROLES, T } from "../constants.js";

const DEMO = [
  { name: "Donna Chen", email: "donna@taskforge.io", role: "owner" },
  { name: "Marcus Reed", email: "marcus@taskforge.io", role: "admin" },
  { name: "Priya Nair", email: "priya@taskforge.io", role: "member" },
  { name: "Leo Park", email: "leo@taskforge.io", role: "viewer" },
];

export default function AuthGate({ onAuthed }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("donna@taskforge.io");
  const [password, setPassword] = useState("password123");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setErr(""); setBusy(true);
    try {
      const result =
        mode === "login"
          ? await api.login({ email, password })
          : await api.register({ name, email, password });
      await onAuthed(result);
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="tf-auth">
      <div className="tf-auth-brand">
        <div className="tf-logo-mark">◆</div>
        <h1 className="tf-auth-word">TaskForge</h1>
        <p className="tf-auth-tag">Where teams turn scattered work into shipped work.</p>
      </div>
      <div className="tf-auth-panel">
        <div className="tf-auth-tabs">
          <button className={mode === "login" ? "on" : ""} onClick={() => setMode("login")}>Sign in</button>
          <button className={mode === "signup" ? "on" : ""} onClick={() => setMode("signup")}>Create account</button>
        </div>
        {mode === "signup" && (
          <label className="tf-field"><span>Name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
          </label>
        )}
        <label className="tf-field"><span>Email</span>
          <input value={email} onChange={(e) => { setEmail(e.target.value); setErr(""); }} placeholder="you@studio.com" />
        </label>
        <label className="tf-field"><span>Password</span>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()} />
        </label>
        {err && <div className="tf-auth-err">{err}</div>}
        <button className="tf-btn tf-btn-primary tf-auth-cta" onClick={submit} disabled={busy}>
          {busy ? "One moment…" : mode === "login" ? "Sign in" : "Create account"}
        </button>
        <div className="tf-auth-demo">
          <p>Demo identities — password is <code>password123</code>:</p>
          {DEMO.map((u) => (
            <button key={u.email} className="tf-demo-row"
              onClick={() => { setEmail(u.email); setPassword("password123"); setMode("login"); setErr(""); }}>
              <span className="tf-ava" style={{ background: T.terra }}>{initials(u.name)}</span>
              <span className="tf-demo-name">{u.name}</span>
              <span className="tf-role-chip" data-role={u.role}>{ROLES[u.role]}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
