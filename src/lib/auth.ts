import { SignJWT, jwtVerify } from "jose";
import { NextRequest } from "next/server";
import { cookies } from "next/headers";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET ?? "dev-secret");
const COOKIE = "session";

export type AccountType = "admin" | "demo";

export async function createSession(account: AccountType): Promise<string> {
  return new SignJWT({ admin: account === "admin", account })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("8h")
    .sign(SECRET);
}

export async function verifySession(
  req?: NextRequest
): Promise<{ admin: boolean; account: AccountType } | null> {
  try {
    const token = req
      ? req.cookies.get(COOKIE)?.value
      : (await cookies()).get(COOKIE)?.value;

    if (!token) return null;
    const { payload } = await jwtVerify(token, SECRET);
    const account = (payload.account as AccountType) ?? (payload.admin ? "admin" : "demo");
    return { admin: payload.admin === true, account };
  } catch {
    return null;
  }
}

export function checkCredentials(username: string, password: string): AccountType | null {
  if (
    username === process.env.ADMIN_USERNAME &&
    password === process.env.ADMIN_PASSWORD
  ) {
    return "admin";
  }
  if (
    username === process.env.DEMO_USERNAME &&
    password === process.env.DEMO_PASSWORD
  ) {
    return "demo";
  }
  return null;
}

export { COOKIE };
