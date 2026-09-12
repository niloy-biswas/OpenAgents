import { NextRequest } from "next/server";
import { checkCredentials, createSession, COOKIE } from "@/lib/auth";
import { seedAdminStoreIfEmpty } from "@/lib/db";

export async function POST(request: NextRequest) {
  const { username, password } = await request.json();

  const account = checkCredentials(username, password);
  if (!account) {
    return Response.json({ error: "Invalid credentials" }, { status: 401 });
  }

  // Admin account gets realistic seed data if the store is empty.
  if (account === "admin") {
    await seedAdminStoreIfEmpty();
  }

  const token = await createSession(account);

  return new Response(JSON.stringify({ ok: true, account }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": `${COOKIE}=${token}; HttpOnly; Path=/; Max-Age=28800; SameSite=Lax`,
    },
  });
}
