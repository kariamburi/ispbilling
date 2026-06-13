import { prisma } from "@/lib/prisma";

export default async function SmsLogsPage() {
    const logs = await prisma.smsLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
    });

    return (
        <main className="p-6">
            <div className="mx-auto max-w-6xl">
                <div className="mb-6 rounded-3xl bg-slate-950 p-6 text-white">
                    <h1 className="text-3xl font-black">SMS Logs</h1>
                    <p className="mt-1 text-slate-300">Sent and failed SMS messages</p>
                </div>

                <div className="overflow-hidden rounded-3xl bg-white shadow">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-200">
                            <tr>
                                <th className="p-4">Phone</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Message</th>
                                <th className="p-4">Error</th>
                                <th className="p-4">Date</th>
                            </tr>
                        </thead>

                        <tbody>
                            {logs.map((log) => (
                                <tr key={log.id} className="border-t align-top">
                                    <td className="p-4 font-bold">{log.phone}</td>
                                    <td className="p-4">
                                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">
                                            {log.status}
                                        </span>
                                    </td>
                                    <td className="p-4 max-w-md">{log.message}</td>
                                    <td className="p-4 text-xs text-red-600">
                                        {log.error || "-"}
                                    </td>
                                    <td className="p-4">
                                        {new Date(log.createdAt).toLocaleString()}
                                    </td>
                                </tr>
                            ))}

                            {logs.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-6 text-center text-slate-500">
                                        No SMS logs yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <a href="/admin" className="mt-5 block text-sm font-bold underline">
                    Back to Dashboard
                </a>
            </div>
        </main>
    );
}