import React, { useState, useEffect } from "react";
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import { FileText, CheckCircle2, AlertCircle, User } from "lucide-react";
import { api } from "../api.js";
import { useApp } from "../App.jsx";
import { T, PRIORITY } from "../constants.js";

const tipStyle = { background: T.white, border: `1px solid ${T.line}`, borderRadius: 8, fontFamily: "Inter", fontSize: 12 };

export default function Dashboard() {
  const { me, dataVersion, orgId } = useApp();
  const [data, setData] = useState(null);
  const [myCount, setMyCount] = useState(0);

  useEffect(() => {
    api.analytics(orgId).then(setData).catch(() => {});
    // Count tasks assigned to me across projects.
    (async () => {
      const projs = await api.projects(orgId);
      const lists = await Promise.all(projs.map((p) => api.tasks(orgId, p.id, { assigneeId: me.id })));
      setMyCount(lists.flat().length);
    })();
  }, [orgId, me.id, dataVersion]);

  if (!data) return <div className="tf-empty">Loading analytics…</div>;

  const { totals, byStatus, byPriority } = data;
  const completion = totals.total ? Math.round((totals.completed / totals.total) * 100) : 0;
  const priorityData = byPriority.map((r) => ({
    name: PRIORITY[r.name]?.label || r.name, value: r.count, color: PRIORITY[r.name]?.color || T.sand,
  }));

  return (
    <div className="tf-dash">
      <div className="tf-dash-hero">
        <div className="tf-eyebrow">Overview</div>
        <h2 className="tf-h2">Good to see you, {me.name.split(" ")[0]}.</h2>
        <p className="tf-lede">{myCount} {myCount === 1 ? "task is" : "tasks are"} assigned to you right now.</p>
      </div>

      <div className="tf-stats">
        <Stat label="Total tasks" value={totals.total} icon={FileText} tint={T.ink} />
        <Stat label="Completed" value={totals.completed} icon={CheckCircle2} tint={T.green} sub={`${completion}% of all work`} />
        <Stat label="Overdue" value={totals.overdue} icon={AlertCircle} tint={T.rose} />
        <Stat label="Assigned to me" value={myCount} icon={User} tint={T.terra} />
      </div>

      <div className="tf-charts">
        <div className="tf-panel" style={{ gridColumn: "span 2" }}>
          <div className="tf-panel-title">Work by status</div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={byStatus} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.line} vertical={false} />
              <XAxis dataKey="name" tick={{ fill: T.inkSoft, fontSize: 11, fontFamily: "IBM Plex Mono" }} />
              <YAxis tick={{ fill: T.inkSoft, fontSize: 11, fontFamily: "IBM Plex Mono" }} allowDecimals={false} />
              <Tooltip contentStyle={tipStyle} />
              <Bar dataKey="count" fill={T.terra} radius={[5, 5, 0, 0]} maxBarSize={54} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="tf-panel">
          <div className="tf-panel-title">By priority</div>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={priorityData} dataKey="value" nameKey="name" innerRadius={48} outerRadius={78} paddingAngle={3}>
                {priorityData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip contentStyle={tipStyle} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 11, fontFamily: "IBM Plex Mono" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, icon: Icon, tint, sub }) {
  return (
    <div className="tf-stat">
      <div className="tf-stat-top"><span className="tf-stat-label">{label}</span>
        <span className="tf-stat-icon" style={{ color: tint }}><Icon size={16} /></span></div>
      <div className="tf-stat-value">{value}</div>
      {sub && <div className="tf-stat-sub">{sub}</div>}
    </div>
  );
}
