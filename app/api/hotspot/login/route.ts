import { NextResponse } from "next/server";

const APP_URL =
    process.env.NEXT_PUBLIC_APP_URL || "https://billing.craftinventors.co.ke";

const HOTSPOT_LOGIN_URL =
    process.env.HOTSPOT_LOGIN_URL || "http://10.5.50.1/login";

function escapeHtml(value: string) {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll('"', "&quot;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");
}

export async function POST(req: Request) {
    const formData = await req.formData();

    const username = String(formData.get("username") || "");
    const password = String(formData.get("password") || "");

    if (!username || !password) {
        return NextResponse.redirect(new URL("/?error=missing_login", APP_URL), 303);
    }

    const html = `
    <!DOCTYPE html>
    <html>
      <body>
        <p>Connecting...</p>

        <form id="login" method="post" action="${HOTSPOT_LOGIN_URL}">
          <input type="hidden" name="username" value="${escapeHtml(username)}" />
          <input type="hidden" name="password" value="${escapeHtml(password)}" />
        </form>

        <script>
          document.getElementById("login").submit();
        </script>
      </body>
    </html>
  `;

    return new NextResponse(html, {
        headers: { "Content-Type": "text/html" },
    });
}