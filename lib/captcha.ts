import { createHmac, timingSafeEqual } from "crypto";

function secret() {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.ADMIN_EMAIL ||
    "syllis-captcha"
  );
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

export function issueCaptcha() {
  const a = 2 + Math.floor(Math.random() * 9);
  const b = 2 + Math.floor(Math.random() * 9);
  const exp = Date.now() + 10 * 60 * 1000;
  const payload = `${a}.${b}.${exp}`;
  return {
    token: `${payload}.${sign(payload)}`,
    question: `What is ${a} + ${b}?`,
  };
}

export function verifyCaptcha(token: unknown, answer: unknown) {
  if (typeof token !== "string" || typeof answer !== "string") return false;
  const parts = token.split(".");
  if (parts.length !== 4) return false;
  const [a, b, exp, sig] = parts;
  const payload = `${a}.${b}.${exp}`;
  const expected = sign(payload);
  const left = Buffer.from(sig);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return false;
  if (Number(exp) < Date.now()) return false;
  const n = Number(answer.trim());
  return Number.isFinite(n) && n === Number(a) + Number(b);
}
