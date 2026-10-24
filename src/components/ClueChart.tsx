import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Brush,
} from "recharts";
import type { Clue } from "../types";
export function ClueChart({
  clue,
  onSelect,
}: {
  clue: Clue;
  onSelect?: () => void;
}) {
  const chart = clue.chart;
  if (!chart)
    return (
      <div className="no-chart">
        <span className="tiny-label">THE EVIDENCE IS IN THE RECORDS</span>
        <p>
          This finding is best understood by looking directly at its supporting
          rows.
        </p>
      </div>
    );
  const axis = {
    stroke: "var(--muted)",
    fontSize: 10,
    tickLine: false,
    axisLine: false,
  };
  return (
    <div
      className="chart-wrap"
      role="group"
      aria-label={`${chart.type} chart: ${chart.yLabel} by ${chart.xLabel}. ${clue.description}`}
    >
      <div className="chart-title">
        <span>{chart.yLabel}</span>
        <span>
          {chart.type === "scatter"
            ? "Up to 500 evenly sampled points"
            : "Hover to inspect · drag the range to zoom"}
        </span>
      </div>
      <ResponsiveContainer width="100%" height={290}>
        {chart.type === "scatter" ? (
          <ScatterChart
            margin={{ top: 20, right: 25, bottom: 20, left: 5 }}
            onClick={onSelect}
          >
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 5" />
            <XAxis {...axis} type="number" dataKey="x" name={chart.xLabel} />
            <YAxis {...axis} dataKey="value" name={chart.yLabel} />
            <Tooltip
              cursor={{ strokeDasharray: "3 3" }}
              contentStyle={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 10,
              }}
            />
            <Scatter data={chart.data} fill="#698e62" fillOpacity={0.7} />
          </ScatterChart>
        ) : chart.type === "line" ? (
          <AreaChart
            data={chart.data}
            margin={{ top: 20, right: 15, bottom: 10, left: 5 }}
            onClick={onSelect}
          >
            <defs>
              <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a3be79" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#a3be79" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              stroke="var(--border)"
              vertical={false}
              strokeDasharray="3 5"
            />
            <XAxis {...axis} dataKey="name" minTickGap={45} />
            <YAxis {...axis} />
            <Tooltip
              contentStyle={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 10,
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              name={chart.yLabel}
              stroke="#739162"
              strokeWidth={2.5}
              fill="url(#areaFill)"
              activeDot={{ r: 6 }}
            />
            <Brush
              dataKey="name"
              height={18}
              stroke="#9aaa8e"
              fill="var(--surface)"
              travellerWidth={8}
            />
          </AreaChart>
        ) : (
          <BarChart
            data={chart.data}
            margin={{ top: 20, right: 15, bottom: 10, left: 5 }}
            onClick={onSelect}
          >
            <CartesianGrid
              stroke="var(--border)"
              vertical={false}
              strokeDasharray="3 5"
            />
            <XAxis {...axis} dataKey="name" minTickGap={25} />
            <YAxis {...axis} />
            <Tooltip
              contentStyle={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 10,
              }}
              cursor={{ fill: "var(--hover)" }}
            />
            <Bar
              dataKey="value"
              name={chart.yLabel}
              fill="#8caa78"
              radius={[5, 5, 0, 0]}
            />
            {chart.data.length > 10 && (
              <Brush
                height={18}
                dataKey="name"
                stroke="#9aaa8e"
                fill="var(--surface)"
              />
            )}
          </BarChart>
        )}
      </ResponsiveContainer>
      <div className="chart-axis">{chart.xLabel}</div>
    </div>
  );
}
