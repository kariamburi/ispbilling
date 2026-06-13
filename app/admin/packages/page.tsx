import { PrismaClient } from "../../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function updatePackage(formData: FormData) {
    "use server";

    const id = String(formData.get("id"));
    const name = String(formData.get("name"));
    const price = Number(formData.get("price"));
    const durationMin = Number(formData.get("durationMin"));
    const speedLimit = String(formData.get("speedLimit"));
    const active = formData.get("active") === "on";

    await prisma.internetPackage.update({
        where: { id },
        data: { name, price, durationMin, speedLimit, active },
    });
}

export default async function AdminPackagesPage() {
    const packages = await prisma.internetPackage.findMany({
        orderBy: { price: "asc" },
    });

    return (
        <main className="p-6">
            <div className="mx-auto max-w-6xl">
                <div className="mb-6 rounded-3xl bg-slate-950 p-6 text-white">
                    <h1 className="text-3xl font-black">Craft Billing</h1>
                    <p className="mt-1 text-slate-300">Package Management</p>
                </div>

                <div className="space-y-4">
                    {packages.map((pkg) => (
                        <form
                            key={pkg.id}
                            action={updatePackage}
                            className="rounded-3xl bg-white p-5 shadow"
                        >
                            <input type="hidden" name="id" value={pkg.id} />

                            <div className="grid gap-3 md:grid-cols-5">
                                <input
                                    name="name"
                                    defaultValue={pkg.name}
                                    className="rounded-xl border px-3 py-2"
                                />

                                <input
                                    name="price"
                                    type="number"
                                    defaultValue={pkg.price}
                                    className="rounded-xl border px-3 py-2"
                                />

                                <input
                                    name="durationMin"
                                    type="number"
                                    defaultValue={pkg.durationMin}
                                    className="rounded-xl border px-3 py-2"
                                />

                                <input
                                    name="speedLimit"
                                    defaultValue={pkg.speedLimit}
                                    className="rounded-xl border px-3 py-2"
                                />

                                <label className="flex items-center gap-2 text-sm font-bold">
                                    <input
                                        name="active"
                                        type="checkbox"
                                        defaultChecked={pkg.active}
                                    />
                                    Active
                                </label>
                            </div>

                            <button className="mt-4 cursor-pointer rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-black text-slate-950">
                                Save Package
                            </button>
                        </form>
                    ))}
                </div>

                <div className="mt-5 flex gap-3">
                    <a href="/admin" className="text-sm font-bold underline">
                        Dashboard
                    </a>
                    <a href="/" className="text-sm font-bold underline">
                        Customer Portal
                    </a>
                </div>
            </div>
        </main>
    );
}