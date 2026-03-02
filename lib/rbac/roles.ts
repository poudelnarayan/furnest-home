import { Role } from "@prisma/client";
import { AppError } from "@/lib/http/errors";

export function requireRole(userRole: Role, allowed: Role[]) {
  if (!allowed.includes(userRole)) {
    throw new AppError("Forbidden", "FORBIDDEN", 403);
  }
}
