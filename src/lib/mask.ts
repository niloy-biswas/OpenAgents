export function mask(secret: string | null): string {
  if (!secret) return "";
  if (secret.length <= 6) return "••••";
  return `${secret.slice(0, 3)}...${secret.slice(-4)}`;
}
