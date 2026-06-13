import { prisma } from "@/lib/prisma";

async function updateRouter(formData: FormData) {
    "use server";

    const id = String(formData.get("id"));
    const name = String(formData.get("name"));
    const host = String(formData.get("host"));
    const username = String(formData.get("username"));
    const password = String(formData.get("password"));
    const port = Number(formData.get("port"));
    const location = String(formData.get("location"));
    const active = formData.get("active") === "on";

    await prisma.router.update({
        where: { id },
        data: { name, host, username, password, port, location, active },
    });
}

export default async function AdminRouterPage() {
    const router = await prisma.router.findFirst({
        orderBy: { createdAt: "desc" },
    });

    if (!router) {
        return <div className="p-6">No router configured.</div>;
    }

    return (
        <main className="p-6">
            <div className="mx-auto max-w-3xl">
                <div className="mb-6 rounded-3xl bg-slate-950 p-6 text-white">
                    <h1 className="text-3xl font-black">Router Settings</h1>
                    <p className="mt-1 text-slate-300">MikroTik connection details</p>
                </div>

                <form action={updateRouter} className="rounded-3xl bg-white p-6 shadow">
                    <input type="hidden" name="id" value={router.id} />

                    {[
                        ["name", "Name", router.name],
                        ["host", "Host / IP Address", router.host],
                        ["username", "Username", router.username],
                        ["password", "Password", router.password],
                        ["port", "API Port", String(router.port)],
                        ["location", "Location", router.location || ""],
                    ].map(([name, label, value]) => (
                        <div key={name} className="mb-4">
                            <label className="text-sm font-bold">{label}</label>
                            <input
                                name={name}
                                defaultValue={value}
                                className="mt-2 w-full rounded-2xl border px-4 py-3"
                            />
                        </div>
                    ))}

                    <label className="mb-4 flex items-center gap-2 text-sm font-bold">
                        <input name="active" type="checkbox" defaultChecked={router.active} />
                        Active Router
                    </label>

                    <button className="rounded-2xl bg-emerald-500 px-5 py-3 font-black text-slate-950">
                        Save Router
                    </button>
                </form>

                <a href="/admin" className="mt-5 block text-sm font-bold underline">
                    Back to Dashboard
                </a>
            </div>
        </main>
    );
}