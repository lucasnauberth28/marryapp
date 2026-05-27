import { SignJWT, jwtVerify } from "jose";

const getSecretKey = () => {
  const secret = process.env.JWT_SECRET || "fallback_super_secret_for_development_only";
  return new TextEncoder().encode(secret);
};

export async function signToken(payload: { userId: string; role: string; allowedPaths: string[] }) {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 60 * 60 * 24 * 7; // 7 dias

  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setExpirationTime(exp)
    .setIssuedAt(iat)
    .setNotBefore(iat)
    .sign(getSecretKey());
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload as { userId: string; role: string; allowedPaths: string[] };
  } catch (error) {
    return null;
  }
}
