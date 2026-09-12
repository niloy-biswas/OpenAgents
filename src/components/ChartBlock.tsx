"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

export interface ChartSpec {
  type: "bar" | "line" | "area" | "pie";
  title: string;
  description?: string;
  x_key?: string;
  y_keys?: string[];
  name_key?: string;
  value_key?: string;
  data: Record<string, unknown>[];
}

const CHART_COLORS = ["#e8a33d", "#3fae7a", "#5b8def", "#d1435b", "#9b6add", "#4dd0a7"];

function toLabel(key: string) {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatYAxis(value: number) {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(value);
}

const AXIS_COLOR = "#9195a3";
const GRID_COLOR = "#262a33";

const tooltipStyle = {
  background: "#1d2027",
  border: "1px solid #333844",
  borderRadius: 8,
  fontSize: 12,
  color: "#ece8de",
};

export function ChartBlock({ spec }: { spec: ChartSpec }) {
  const isPie = spec.type === "pie";
  const isInvalid = !isPie && (!spec.x_key || !spec.y_keys?.length);
  const isPieInvalid = isPie && (!spec.name_key || !spec.value_key);

  if (isInvalid || isPieInvalid) {
    return (
      <div className="mt-3 mb-2 rounded-oa-md border border-oa-line-soft bg-oa-surface p-4 text-xs text-oa-text-faint">
        Chart could not be rendered: missing required fields ({isPie ? "name_key / value_key" : "x_key / y_keys"}).
      </div>
    );
  }

  const totalForPie = isPie
    ? spec.data.reduce((sum, row) => sum + (Number(row[spec.value_key!]) || 0), 0)
    : 0;

  return (
    <div className="mt-3 mb-2 rounded-oa-md border border-oa-line-soft bg-oa-surface p-4">
      <p className="text-sm font-semibold text-oa-text">{spec.title}</p>
      {spec.description && <p className="text-xs text-oa-text-faint mt-0.5">{spec.description}</p>}

      <div className={isPie ? "h-72 mt-3" : "h-60 mt-3"}>
        <ResponsiveContainer width="100%" height="100%">
          {spec.type === "pie" ? (
            <PieChart>
              <Pie
                data={spec.data}
                dataKey={spec.value_key}
                nameKey={spec.name_key}
                cx="50%"
                cy="50%"
                outerRadius={90}
                label={({ percent }) => (percent && percent >= 0.04 ? `${(percent * 100).toFixed(0)}%` : "")}
                labelLine={false}
              >
                {spec.data.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          ) : spec.type === "line" ? (
            <LineChart data={spec.data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
              <XAxis dataKey={spec.x_key} tick={{ fontSize: 10, fill: AXIS_COLOR }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: AXIS_COLOR }} tickLine={false} axisLine={false} tickFormatter={formatYAxis} width={40} />
              <Tooltip contentStyle={tooltipStyle} />
              {(spec.y_keys ?? []).length > 1 && <Legend wrapperStyle={{ fontSize: 11, color: AXIS_COLOR }} />}
              {(spec.y_keys ?? []).map((key, i) => (
                <Line key={key} type="monotone" dataKey={key} name={toLabel(key)} stroke={CHART_COLORS[i % CHART_COLORS.length]} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              ))}
            </LineChart>
          ) : spec.type === "area" ? (
            <AreaChart data={spec.data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
              <XAxis dataKey={spec.x_key} tick={{ fontSize: 10, fill: AXIS_COLOR }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: AXIS_COLOR }} tickLine={false} axisLine={false} tickFormatter={formatYAxis} width={40} />
              <Tooltip contentStyle={tooltipStyle} />
              {(spec.y_keys ?? []).length > 1 && <Legend wrapperStyle={{ fontSize: 11, color: AXIS_COLOR }} />}
              {(spec.y_keys ?? []).map((key, i) => (
                <Area key={key} type="monotone" dataKey={key} name={toLabel(key)} stroke={CHART_COLORS[i % CHART_COLORS.length]} fill={CHART_COLORS[i % CHART_COLORS.length]} fillOpacity={0.15} strokeWidth={2} />
              ))}
            </AreaChart>
          ) : (
            <BarChart data={spec.data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
              <XAxis dataKey={spec.x_key} tick={{ fontSize: 10, fill: AXIS_COLOR }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: AXIS_COLOR }} tickLine={false} axisLine={false} tickFormatter={formatYAxis} width={40} />
              <Tooltip contentStyle={tooltipStyle} />
              {(spec.y_keys ?? []).length > 1 && <Legend wrapperStyle={{ fontSize: 11, color: AXIS_COLOR }} />}
              {(spec.y_keys ?? []).map((key, i) => (
                <Bar key={key} dataKey={key} name={toLabel(key)} fill={CHART_COLORS[i % CHART_COLORS.length]} radius={[4, 4, 0, 0]} />
              ))}
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {isPie && spec.name_key && (
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5">
          {spec.data.map((row, i) => {
            const pct = totalForPie > 0 ? ((Number(row[spec.value_key!]) / totalForPie) * 100).toFixed(1) : "0";
            return (
              <div key={i} className="flex items-center gap-1.5 min-w-0">
                <span className="shrink-0 h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                <span className="text-xs text-oa-text-faint truncate">{String(row[spec.name_key!] ?? "")}</span>
                <span className="text-xs text-oa-text-faint font-mono shrink-0">({pct}%)</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
