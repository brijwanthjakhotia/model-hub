import { Prisma } from "@prisma/client";

/** Unique-constraint violation (e.g. duplicate email/slug). */
export const isUniqueViolation = (e: unknown) =>
  e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";

/** Record required by the operation was not found (e.g. update/delete of a
 *  since-deleted row). */
export const isNotFound = (e: unknown) =>
  e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025";

/** Foreign-key constraint failure (e.g. writing a child of a deleted parent). */
export const isForeignKeyViolation = (e: unknown) =>
  e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2003";
