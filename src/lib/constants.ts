// Type-only imports (erased at build — safe in edge/client bundles). `satisfies`
// below ties each hand-written list to the Prisma-generated enum, so adding a
// value to schema.prisma without updating these arrays is a compile error.
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

export const GENDERS = [
  { value: "FEMALE", label: "Female" },
  { value: "MALE", label: "Male" },
  { value: "NONBINARY", label: "Non-binary" },
] as const satisfies readonly { value: Gender; label: string }[];

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

export const MODEL_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const satisfies readonly ModelStatus[];
export type ModelStatusValue = (typeof MODEL_STATUSES)[number];

export const STATUS_META: Record<
  ModelStatusValue,
  { label: string; tone: "warning" | "success" | "danger" }
> = {
  PENDING: { label: "Pending review", tone: "warning" },
  APPROVED: { label: "Approved", tone: "success" },
  REJECTED: { label: "Rejected", tone: "danger" },
};

/** Admin roles — single source for the enum, Zod schema and display labels. */
export const ADMIN_ROLES = ["SUPER_ADMIN", "MODERATOR"] as const satisfies readonly AdminRole[];
export type AdminRoleValue = (typeof ADMIN_ROLES)[number];

export const ADMIN_ROLE_META: Record<AdminRoleValue, { label: string }> = {
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
  UserStatusValue,
  { label: string; tone: "warning" | "success" | "muted" | "danger" }
> = {
  PENDING: { label: "Pending", tone: "warning" },
  ACTIVE: { label: "Active", tone: "success" },
  INACTIVE: { label: "Inactive", tone: "muted" },
  SUSPENDED_FRAUD: { label: "Suspended · fraud", tone: "danger" },
  SUSPENDED: { label: "Suspended", tone: "danger" },
};
