"use client";

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
} from "recharts";

type Props = {
    data: {
        name: string;
        sales: number;
    }[];
};

export default function PackageChart({ data }: Props) {
    return (
        <div className="h-80 rounded-3xl bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-black text-slate-950">
                Package Sales
            </h2>

            <ResponsiveContainer width="100%" height="85%">
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="sales" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}