"use client";

import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceArea,
  CartesianGrid,
} from "recharts";
import { format } from "date-fns";
import { formatDuration } from "@/lib/duration";

type Point = { takenAt: string; value: number };

export function TrendChart({
  data,
  unit,
  valueType = "number",
  refLow,
  refHigh,
}: {
  data: Point[];
  unit: string | null;
  valueType?: string;
  refLow: number | null;
  refHigh: number | null;
}) {
  const isDuration = valueType === "duration";
  const chartData = data.map((d) => ({
    ...d,
    label: format(new Date(d.takenAt), "MMM d, yyyy"),
  }));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          {refLow != null && refHigh != null && (
            <ReferenceArea y1={refLow} y2={refHigh} fill="#2a78d6" fillOpacity={0.08} strokeOpacity={0} />
          )}
          <XAxis
            dataKey="label"
            tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
            axisLine={{ stroke: "var(--border)" }}
            tickLine={false}
            minTickGap={24}
          />
          <YAxis
            tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
            width={44}
            domain={["auto", "auto"]}
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
            formatter={(value) => [
              isDuration ? formatDuration(Number(value)) : unit ? `${value} ${unit}` : `${value}`,
              "Value",
            ]}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#2a78d6"
            strokeWidth={2}
            dot={{ r: 4, fill: "#2a78d6", strokeWidth: 0 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
