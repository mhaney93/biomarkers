"use client";

import {
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
