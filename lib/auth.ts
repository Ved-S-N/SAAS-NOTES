import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import prisma from "./prisma";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
if (!process.env.JWT_SECRET) {
  console.warn("JWT_SECRET not set — using dev-secret (not for production)");
}

export const signToken = (payload: object) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
};

export const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, JWT_SECRET) as any;
  } catch (e) {
    return null;
  }
};

export async function validateUserCredentials(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { tenant: true },
  });
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return null;
  // return user without password
  const { password: _p, ...rest } = user as any;
  return rest;
}
