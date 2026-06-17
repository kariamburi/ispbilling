import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import SubmitSettingsButton from "./SubmitSettingsButton";

async function updateSettings(formData: FormData) {
    "use server";

    await prisma.appSetting.upsert({
        where: { id: "main" },
        update: {
            portalName: String(formData.get("portalName") || "CRAFT WIFI"),
            subtitle: String(formData.get("subtitle") || ""),
            supportPhone: String(formData.get("supportPhone") || ""),
            whatsappPhone: String(formData.get("whatsappPhone") || ""),
            portalUrl: String(formData.get("portalUrl") || ""),
        },
        create: {
            id: "main",
            portalName: String(formData.get("portalName") || "CRAFT WIFI"),
            subtitle: String(formData.get("subtitle") || ""),
            supportPhone: String(formData.get("supportPhone") || ""),
            whatsappPhone: String(formData.get("whatsappPhone") || ""),
            portalUrl: String(formData.get("portalUrl") || ""),
        },
    });

    revalidatePath("/");
    revalidatePath("/admin/settings");
}

export default async function SettingsPage() {
    const settings = await prisma.appSetting.upsert({
        where: { id: "main" },
        update: {},
        create: {
            id: "main",
            portalName: "CRAFT WIFI",
            subtitle: "Fast internet for Manguo Estate",
            supportPhone: "+254728820092",
            whatsappPhone: "+254728820092",
            portalUrl: "https://billing.craftinventors.co.ke",
        },
    });

    return (
        <main className="p-6">
            <div className="mx-auto max-w-3xl">
                <div className="mb-6 rounded-3xl bg-slate-950 p-6 text-white">
                    <h1 className="text-3xl font-black">Portal Settings</h1>
                    <p className="mt-1 text-slate-300">Branding and support details</p>
                </div>

                <form action={updateSettings} className="rounded-3xl bg-white p-6 shadow">
                    <label className="text-sm font-bold">Portal Name</label>
                    <input
                        name="portalName"
                        defaultValue={settings.portalName}
                        className="mt-2 w-full rounded-2xl border px-4 py-3"
                    />

                    <label className="mt-5 block text-sm font-bold">Subtitle</label>
                    <input
                        name="subtitle"
                        defaultValue={settings.subtitle}
                        className="mt-2 w-full rounded-2xl border px-4 py-3"
                    />

                    <label className="mt-5 block text-sm font-bold">Support Phone</label>
                    <input
                        name="supportPhone"
                        defaultValue={settings.supportPhone || ""}
                        className="mt-2 w-full rounded-2xl border px-4 py-3"
                    />

                    <label className="mt-5 block text-sm font-bold">WhatsApp Phone</label>
                    <input
                        name="whatsappPhone"
                        defaultValue={settings.whatsappPhone || ""}
                        className="mt-2 w-full rounded-2xl border px-4 py-3"
                    />

                    <label className="mt-5 block text-sm font-bold">Portal URL</label>
                    <input
                        name="portalUrl"
                        defaultValue={settings.portalUrl || ""}
                        placeholder="https://billing.craftinventors.co.ke"
                        className="mt-2 w-full rounded-2xl border px-4 py-3"
                    />

                    <SubmitSettingsButton />
                </form>

                <a href="/admin" className="mt-5 block text-sm font-bold underline">
                    Back to Dashboard
                </a>
            </div>
        </main>
    );
}