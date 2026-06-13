"use client";

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
} from "recharts";

type Props = {
    data: {
        day: string;
        revenue: number;
    }[];
};

export default function RevenueChart({ data }: Props) {
    return (
        <div className="h-80 rounded-3xl bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-black text-slate-950">
                Revenue Trend
            </h2>

            <ResponsiveContainer width="100%" height="85%">
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Line
                        type="monotone"
                        dataKey="revenue"
                        strokeWidth={3}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}