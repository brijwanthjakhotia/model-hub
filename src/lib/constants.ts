// Type-only imports (erased at build — safe in edge/client bundles). Two guards
// keep these lists in sync with the Prisma-generated enums: `satisfies readonly
// <Enum>[]` on each array rejects a typo'd or removed member, and keying every
// `*_META` record by the enum type forces a metadata entry for each member — so
// adding a value to schema.prisma is a compile error until it's handled here.
import type { AdminRole, Gender, ModelStatus, UserStatus } from "@prisma/client";

export const CATEGORIES = [
  "Runway",
  "Commercial",
  "Editorial",
  "Fitness",
  "Fashion",
  "Beauty",
  "Plus-Size",
  "Petite",
] as const;

export const GENDER_VALUES = ["FEMALE", "MALE", "NONBINARY"] as const satisfies readonly Gender[];

const GENDER_LABELS: Record<Gender, string> = {
  FEMALE: "Female",
  MALE: "Male",
  NONBINARY: "Non-binary",
};

/** `{ value, label }` options for selects/filters, derived from GENDER_VALUES. */
export const GENDERS = GENDER_VALUES.map((value) => ({
  value,
  label: GENDER_LABELS[value],
}));

export const EXPERIENCE_LEVELS = [
  "New Face",
  "Developing",
  "Established",
  "Pro",
] as const;

export const HAIR_COLORS = [
  "Black",
  "Brown",
  "Blonde",
  "Auburn",
  "Red",
  "Grey",
  "Other",
] as const;

export const EYE_COLORS = [
  "Brown",
  "Blue",
  "Green",
  "Hazel",
  "Grey",
  "Amber",
] as const;

export const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "top-rated", label: "Top rated" },
  { value: "newest", label: "Newest" },
  { value: "name", label: "Name (A–Z)" },
] as const;

export type SortOption = (typeof SORT_OPTIONS)[number]["value"];

/** Alias of the Prisma enum; `STATUS_META` below is the exhaustiveness guard. */
export type ModelStatusValue = ModelStatus;

export const STATUS_META: Record<
  ModelStatus,
  { label: string; tone: "warning" | "success" | "danger" }
> = {
  PENDING: { label: "Pending review", tone: "warning" },
  APPROVED: { label: "Approved", tone: "success" },
  REJECTED: { label: "Rejected", tone: "danger" },
};

/** Admin roles — single source for the enum, Zod schema and display labels. */
export const ADMIN_ROLES = ["SUPER_ADMIN", "MODERATOR"] as const satisfies readonly AdminRole[];
export type AdminRoleValue = (typeof ADMIN_ROLES)[number];

export const ADMIN_ROLE_META: Record<AdminRole, { label: string }> = {
  SUPER_ADMIN: { label: "Super admin" },
  MODERATOR: { label: "Moderator" },
};

/** Member account statuses. Only ACTIVE members can sign in. */
export const USER_STATUSES = [
  "PENDING",
  "ACTIVE",
  "INACTIVE",
  "SUSPENDED_FRAUD",
  "SUSPENDED",
] as const satisfies readonly UserStatus[];

export type UserStatusValue = (typeof USER_STATUSES)[number];

export const USER_STATUS_META: Record<
  UserStatus,
  { label: string; tone: "warning" | "success" | "muted" | "danger" }
> = {
  PENDING: { label: "Pending", tone: "warning" },
  ACTIVE: { label: "Active", tone: "success" },
  INACTIVE: { label: "Inactive", tone: "muted" },
  SUSPENDED_FRAUD: { label: "Suspended · fraud", tone: "danger" },
  SUSPENDED: { label: "Suspended", tone: "danger" },
};
