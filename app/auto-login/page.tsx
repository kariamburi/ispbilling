import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

type Props = {
    searchParams: Promise<{
        sessionId?: string;
    }>;
};

const HOTSPOT_LOGIN_URL =
    process.env.HOTSPOT_LOGIN_URL || "http://192.168.88.1/login";

function escapeHtml(value: string) {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll('"', "&quot;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");
}

export default async function AutoLoginPage({ searchParams }: Props) {
    const params = await searchParams;

    if (!params.sessionId) notFound();

    const session = await prisma.internetSession.findUnique({
        where: { id: params.sessionId },
    });

    if (!session?.username || !session?.password) notFound();

    return (
        <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
            <div className="max-w-sm rounded-3xl bg-white p-6 text-center text-slate-950 shadow">
                <h1 className="text-2xl font-black">Connecting...</h1>
                <p className="mt-2 text-sm text-slate-500">
                    Please wait while we connect you to the internet.
                </p>

                <form id="hotspot-login" method="post" action={HOTSPOT_LOGIN_URL}>
                    <input type="hidden" name="username" value={escapeHtml(session.username)} />
                    <input type="hidden" name="password" value={escapeHtml(session.password)} />
                </form>

                <script
                    dangerouslySetInnerHTML={{
                        __html: `
              setTimeout(function () {
                document.getElementById("hotspot-login").submit();
              }, 800);
            `,
                    }}
                />

                <a
                    href="/"
                    className="mt-5 block rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-black"
                >
                    Back to Portal
                </a>
            </div>
        </main>
    );
}