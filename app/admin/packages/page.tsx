import { redirect } from "next/navigation";
import { PrismaClient } from "../../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function updatePackages(formData: FormData) {
    "use server";

    const ids = formData.getAll("id").map(String);

    for (const id of ids) {
        const name = String(formData.get(`name-${id}`) || "");
        const price = Number(formData.get(`price-${id}`) || 0);
        const durationMin = Number(formData.get(`durationMin-${id}`) || 0);
        const speedLimit = String(formData.get(`speedLimit-${id}`) || "default");
        const active = formData.get(`active-${id}`) === "on";

        await prisma.internetPackage.update({
            where: { id },
            data: {
                name,
                price,
                durationMin,
                speedLimit,
                active,
            },
        });
    }

    redirect("/admin/packages?saved=1");
}

type Props = {
    searchParams: Promise<{
        saved?: string;
    }>;
};

export default async function AdminPackagesPage({ searchParams }: Props) {
    const params = await searchParams;

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

                {params.saved && (
                    <div className="mb-4 rounded-2xl bg-emerald-100 p-4 text-sm font-black text-emerald-700">
                        Packages saved successfully.
                    </div>
                )}

                <form action={updatePackages} className="space-y-4">
                    {packages.map((pkg) => (
                        <div key={pkg.id} className="rounded-3xl bg-white p-5 shadow">
                            <input type="hidden" name="id" value={pkg.id} />

                            <div className="grid gap-3 md:grid-cols-5">
                                <input
                                    name={`name-${pkg.id}`}
                                    defaultValue={pkg.name}
                                    className="rounded-xl border px-3 py-2"
                                />

                                <input
                                    name={`price-${pkg.id}`}
                                    type="number"
                                    defaultValue={pkg.price}
                                    className="rounded-xl border px-3 py-2"
                                />

                                <input
                                    name={`durationMin-${pkg.id}`}
                                    type="number"
                                    defaultValue={pkg.durationMin}
                                    className="rounded-xl border px-3 py-2"
                                />

                                <select
                                    name={`speedLimit-${pkg.id}`}
                                    defaultValue={pkg.speedLimit}
                                    className="rounded-xl border px-3 py-2"
                                >
                                    <option value="trial">trial - 1M/1M</option>
                                    <option value="daily">daily - 3M/3M</option>
                                    <option value="weekly">weekly - 5M/5M</option>
                                    <option value="monthly">monthly - 10M/10M</option>
                                    <option value="default">default</option>
                                </select>

                                <label className="flex items-center gap-2 text-sm font-bold">
                                    <input
                                        name={`active-${pkg.id}`}
                                        type="checkbox"
                                        defaultChecked={pkg.active}
                                    />
                                    Active
                                </label>
                            </div>
                        </div>
                    ))}

                    <button className="sticky bottom-6 w-full cursor-pointer rounded-2xl bg-emerald-500 px-4 py-4 text-base font-black text-slate-950 shadow-lg">
                        Save All Packages
                    </button>
                </form>

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