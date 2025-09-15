import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import prisma from "./prisma";
import { User, Tenant } from "@prisma/client";

// 1. Define the structure of your JWT payload for type safety
export interface JWTPayload {
  userId: string;
  role: "ADMIN" | "MEMBER";
  tenantId: string;
  tenantSlug: string;
}

// 2. Define a type for the user object returned after validation
type ValidatedUser = Omit<User, "password"> & { tenant: Tenant };

// 3. Get the JWT secret from environment variables with a stricter check
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

if (process.env.NODE_ENV === "production" && JWT_SECRET === "dev-secret") {
  console.error(
    "FATAL ERROR: JWT_SECRET is not set for the production environment."
  );
  // In a real production app, this should stop the server from starting.
  // process.exit(1);
}

// 4. Update signToken to use the specific JWTPayload type
export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "1d" }); // Changed expiration to 1 day
}

// 5. Update verifyToken to return a typed payload or null
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (e) {
    return null;
  }
}

// 6. Update validateUserCredentials to use the specific return type
export async function validateUserCredentials(
  email: string,
  password: string
): Promise<ValidatedUser | null> {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { tenant: true },
  });

  if (!user) return null;

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) return null;

  // Omit the password field from the returned user object
  const { password: _p, ...userWithoutPassword } = user;
  return userWithoutPassword;
}
