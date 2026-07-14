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

export type Category = (typeof CATEGORIES)[number];

export const GENDERS = [
  { value: "FEMALE", label: "Female" },
  { value: "MALE", label: "Male" },
  { value: "NONBINARY", label: "Non-binary" },
] as const;

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

export const STATUS_META: Record<
  "PENDING" | "APPROVED" | "REJECTED",
  { label: string; tone: "warning" | "success" | "danger" }
> = {
  PENDING: { label: "Pending review", tone: "warning" },
  APPROVED: { label: "Approved", tone: "success" },
  REJECTED: { label: "Rejected", tone: "danger" },
};
