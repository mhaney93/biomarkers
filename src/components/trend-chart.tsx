"use client";

import {
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceArea,
  ReferenceLine,
  CartesianGrid,
} from "recharts";
import { format } from "date-fns";
import { formatDuration } from "@/lib/duration";

type Point = { takenAt: string; value: number; source?: string };

// Primary source first: a connected line. Other sources: unconnected markers of their own shape.
const SERIES_COLORS = ["#2a78d6", "#d9730d", "#8e44ad"];

// A diamond marker; recharts calls it for every row, including rows without this source's value.
function diamondDot(fill: string, size: number) {
  function DiamondDot({ cx, cy, index, value }: { cx?: number; cy?: number; index?: number; value?: unknown }) {
    if (cx == null || cy == null || value == null) return <g key={index} />;
    const h = size / 2;
    return (
      <rect key={index} x={cx - h} y={cy - h} width={size} height={size} fill={fill} transform={`rotate(45 ${cx} ${cy})`} />
    );
  }
  return DiamondDot;
}

export function TrendChart({
  data,
  unit,
  valueType = "number",
  refLow,
  refHigh,
  sources,
}: {
  data: Point[];
  /** Source labels, primary first; points name theirs in `source`. Omit for a single source. */
  sources?: string[];
  unit: string | null;
  valueType?: string;
  refLow: number | null;
  refHigh: number | null;
}) {
  const isDuration = valueType === "duration";
  const series = sources && sources.length > 1 ? sources : null;
  // One row per reading; a multi-source row fills only its own source's column.
  const chartData = data.map((d) => ({
    ...d,
    label: format(new Date(d.takenAt), "MMM d, yyyy"),
    ...(series ? { [`s${Math.max(series.indexOf(d.source ?? ""), 0)}`]: d.value } : {}),
  }));

  const hasRange = refLow != null && refHigh != null && refLow !== refHigh;
  const singleRef = !hasRange ? refLow ?? refHigh : null;
  const refFormat = (v: number) => (isDuration ? formatDuration(v) : `${v}${unit ? ` ${unit}` : ""}`);

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 16, right: 16, bottom: 8, left: 8 }}>
          <defs>
            <pattern
              id="refRangeHatch"
              patternUnits="userSpaceOnUse"
              width="8"
              height="8"
              patternTransform="rotate(45)"
            >
              <line x1="0" y1="0" x2="0" y2="8" stroke="#1baf7a" strokeWidth="1.5" opacity="0.35" />
            </pattern>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          {hasRange && (
            <>
              <ReferenceArea
                y1={refLow!}
                y2={refHigh!}
                fill="url(#refRangeHatch)"
                strokeOpacity={0}
                ifOverflow="extendDomain"
              />
              <ReferenceLine
                y={refLow!}
                stroke="#1baf7a"
                strokeDasharray="6 4"
                ifOverflow="extendDomain"
                label={{ value: refFormat(refLow!), position: "insideBottomLeft", fill: "#1baf7a", fontSize: 11 }}
              />
              <ReferenceLine
                y={refHigh!}
                stroke="#1baf7a"
                strokeDasharray="6 4"
                ifOverflow="extendDomain"
                label={{ value: refFormat(refHigh!), position: "insideTopLeft", fill: "#1baf7a", fontSize: 11 }}
              />
            </>
          )}
          {singleRef != null && (
            <ReferenceLine
              y={singleRef}
              stroke="#1baf7a"
              strokeDasharray="6 4"
              ifOverflow="extendDomain"
              label={{ value: refFormat(singleRef), position: "insideTopLeft", fill: "#1baf7a", fontSize: 11 }}
            />
          )}
          <XAxis
            dataKey="label"
            tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
            axisLine={{ stroke: "var(--border)" }}
            tickLine={false}
            minTickGap={24}
            padding={{ left: 12, right: 12 }}
          />
          <YAxis
            tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
            width={60}
            domain={["auto", "auto"]}
            padding={{ top: 16, bottom: 16 }}
            unit={!isDuration && unit ? ` ${unit}` : undefined}
            tickFormatter={isDuration ? (v: number) => formatDuration(v) : undefined}
          />
          <Tooltip
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              fontSize: 12,
              color: "var(--popover-foreground)",
            }}
            labelStyle={{ color: "var(--muted-foreground)" }}
            formatter={(value, name) => [
              isDuration ? formatDuration(Number(value)) : unit ? `${value} ${unit}` : `${value}`,
              series ? name : "Value",
            ]}
          />
          {series ? (
            <>
              <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
              {series.map((label, i) =>
                i === 0 ? (
                  <Line
                    key={label}
                    name={label}
                    type="monotone"
                    dataKey="s0"
                    stroke={SERIES_COLORS[0]}
                    strokeWidth={2}
                    connectNulls
                    dot={{ r: 4, fill: SERIES_COLORS[0], strokeWidth: 0 }}
                    activeDot={{ r: 6 }}
                    legendType="circle"
                  />
                ) : (
                  <Line
                    key={label}
                    name={label}
                    dataKey={`s${i}`}
                    stroke={SERIES_COLORS[i % SERIES_COLORS.length]}
                    strokeWidth={0}
                    dot={diamondDot(SERIES_COLORS[i % SERIES_COLORS.length], 9)}
                    activeDot={diamondDot(SERIES_COLORS[i % SERIES_COLORS.length], 12)}
                    isAnimationActive={false}
                    legendType="diamond"
                  />
                )
              )}
            </>
          ) : (
            <Line
              type="monotone"
              dataKey="value"
              stroke="#2a78d6"
              strokeWidth={2}
              dot={{ r: 4, fill: "#2a78d6", strokeWidth: 0 }}
              activeDot={{ r: 6 }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
