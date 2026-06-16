import { prisma } from "@/lib/prisma";
import { deactivateSession, retryActivation } from "./actions";
import { AlertTriangle, CheckCircle2, Clock, Wifi } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminSessionsPage() {
  const now = new Date();

  const [sessions, totalSessions, activeSessions, failedActivations] =
    await Promise.all([
      prisma.internetSession.findMany({
        orderBy: { createdAt: "desc" },
        take: 80,
        include: { customer: true },
      }),

      prisma.internetSession.count(),

      prisma.internetSession.count({
        where: {
          active: true,
          expiresAt: { gt: now },
        },
      }),

      prisma.internetSession.count({
        where: { activationStatus: "FAILED" },
      }),
    ]);

  const expiredSessions = totalSessions - activeSessions;

  const cards = [
    { label: "Total Sessions", value: totalSessions, icon: Wifi },
    { label: "Active Sessions", value: activeSessions, icon: CheckCircle2 },
    { label: "Expired Sessions", value: expiredSessions, icon: Clock },
    { label: "Failed Activations", value: failedActivations, icon: AlertTriangle },
  ];

  return (
    <main className="p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 rounded-3xl bg-slate-950 p-6 text-white">
          <h1 className="text-3xl font-black">Craft Billing</h1>
          <p className="mt-1 text-slate-300">Internet Sessions</p>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-4">
          {cards.map((card) => {
            const Icon = card.icon;

            return (
              <div key={card.label} className="rounded-3xl bg-white p-5 shadow">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-slate-500">
                    {card.label}
                  </p>
                  <Icon className="h-5 w-5 text-slate-500" />
                </div>

                <p className="mt-3 text-2xl font-black text-slate-950">
                  {card.value}
                </p>
              </div>
            );
          })}
        </div>

        <div className="overflow-x-auto rounded-3xl bg-white shadow">
          <table className="w-full min-w-[1200px] text-left text-sm">
            <thead className="bg-slate-200">
              <tr>
                <th className="p-4">Phone</th>
                <th className="p-4">Username</th>
                <th className="p-4">Password</th>
                <th className="p-4">MAC</th>
                <th className="p-4">Created</th>
                <th className="p-4">Expires</th>
                <th className="p-4">Status</th>
                <th className="p-4">Activation</th>
                <th className="p-4">Error</th>
                <th className="p-4">Action</th>
              </tr>
            </thead>

            <tbody>
              {sessions.map((session) => {
                const expired = session.expiresAt <= now;
                const isActive = session.active && !expired;
                const canReconnect =
                  isActive && session.activationStatus === "ACTIVATED";

                return (
                  <tr key={session.id} className="border-t align-top">
                    <td className="p-4 font-bold">
                      <a
                        href={`/admin/customers/${session.customerId}`}
                        className="underline"
                      >
                        {session.customer.phone}
                      </a>
                    </td>

                    <td className="p-4 font-semibold">{session.username || "-"}</td>
                    <td className="p-4">{session.password || "-"}</td>
                    <td className="p-4">{session.mac || "-"}</td>

                    <td className="p-4">
                      {new Date(session.createdAt).toLocaleString("en-KE")}
                    </td>

                    <td className="p-4">
                      {new Date(session.expiresAt).toLocaleString("en-KE")}
                    </td>

                    <td className="p-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black ${isActive
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-red-100 text-red-700"
                          }`}
                      >
                        {isActive ? "ACTIVE" : "EXPIRED"}
                      </span>
                    </td>

                    <td className="p-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black ${session.activationStatus === "ACTIVATED"
                          ? "bg-emerald-100 text-emerald-700"
                          : session.activationStatus === "FAILED"
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-700"
                          }`}
                      >
                        {session.activationStatus}
                      </span>
                    </td>

                    <td className="max-w-xs p-4 text-xs font-bold text-red-600">
                      {session.activationError || "-"}
                    </td>

                    <td className="space-y-2 p-4">
                      {canReconnect && (
                        <a
                          href={`/auto-login?sessionId=${session.id}`}
                          className="block rounded-xl bg-emerald-500 px-3 py-2 text-center text-xs font-black text-slate-950"
                        >
                          Reconnect
                        </a>
                      )}

                      {session.activationStatus === "FAILED" && (
                        <form action={retryActivation}>
                          <input
                            type="hidden"
                            name="sessionId"
                            value={session.id}
                          />
                          <button className="w-full cursor-pointer rounded-xl bg-emerald-500 px-3 py-2 text-xs font-black text-slate-950">
                            Retry
                          </button>
                        </form>
                      )}

                      {isActive && (
                        <form action={deactivateSession}>
                          <input
                            type="hidden"
                            name="sessionId"
                            value={session.id}
                          />
                          <button className="w-full cursor-pointer rounded-xl bg-red-500 px-3 py-2 text-xs font-black text-white">
                            Deactivate
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                );
              })}

              {sessions.length === 0 && (
                <tr>
                  <td colSpan={10} className="p-6 text-center text-slate-500">
                    No sessions yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <a href="/admin/payments" className="text-sm font-bold underline">
            View Payments
          </a>

          <a href="/admin/customers" className="text-sm font-bold underline">
            View Customers
          </a>

          <a href="/" className="text-sm font-bold underline">
            Customer Portal
          </a>
        </div>
      </div>
    </main>
  );
}