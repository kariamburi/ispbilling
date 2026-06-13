import { PrismaClient } from "../../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { deactivateSession, retryActivation } from "./actions";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

export default async function AdminSessionsPage() {
  const sessions = await prisma.internetSession.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      customer: true,
    },
  });

  return (
    <main className="p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 rounded-3xl bg-slate-950 p-6 text-white">
          <h1 className="text-3xl font-black">Craft Billing</h1>
          <p className="mt-1 text-slate-300">Active Internet Sessions</p>
        </div>

        <div className="overflow-hidden rounded-3xl bg-white shadow">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-200">
              <tr>
                <th className="p-4">Phone</th>
                <th className="p-4">Username</th>
                <th className="p-4">MAC</th>
                <th className="p-4">Expires</th>
                <th className="p-4">Status</th>
                <th className="p-4">Activation</th>
                <th className="p-4">Error</th>
                <th className="p-4">Action</th>
              </tr>
            </thead>

            <tbody>
              {sessions.map((session) => {
                const expired = new Date(session.expiresAt) < new Date();

                return (
                  <tr key={session.id} className="border-t">
                    <td className="p-4 font-bold">{session.customer.phone}</td>
                    <td className="p-4">{session.username || "-"}</td>
                    <td className="p-4">{session.mac || "-"}</td>
                    <td className="p-4">
                      {new Date(session.expiresAt).toLocaleString()}
                    </td>
                    <td className="p-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${!expired && session.active
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-red-100 text-red-700"
                          }`}
                      >
                        {!expired && session.active ? "ACTIVE" : "EXPIRED"}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">
                        {session.activationStatus}
                      </span>
                    </td>

                    <td className="p-4 text-xs text-red-600">
                      {session.activationError || "-"}
                    </td>
                    <td className="p-4">
                      {session.activationStatus === "FAILED" && (
                        <form action={retryActivation}>
                          <input type="hidden" name="sessionId" value={session.id} />
                          <button className="rounded-xl cursor-pointer bg-emerald-500 px-3 py-2 text-xs font-black text-slate-950">
                            Retry
                          </button>
                        </form>
                      )}
                      {session.active && new Date(session.expiresAt) > new Date() && (
                        <form action={deactivateSession} className="mt-2">
                          <input type="hidden" name="sessionId" value={session.id} />
                          <button className="rounded-xl cursor-pointer bg-red-500 px-3 py-2 text-xs font-black text-white">
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
                  <td colSpan={8} className="p-6 text-center text-slate-500">
                    No sessions yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex gap-3">
          <a href="/admin/payments" className="text-sm font-bold underline">
            View Payments
          </a>
          <a href="/" className="text-sm font-bold underline">
            Customer Portal
          </a>
        </div>
      </div>
    </main>
  );
}