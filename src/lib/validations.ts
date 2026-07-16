import { z } from "zod";
import {
  ADMIN_ROLES,
  CATEGORIES,
  EXPERIENCE_LEVELS,
  EYE_COLORS,
  GENDER_VALUES,
  HAIR_COLORS,
  USER_STATUSES,
} from "@/lib/constants";

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(60),
    email: z.string().trim().toLowerCase().email("Enter a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters").max(100),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

/** Payload for an admin changing a member's account status. */
export const userStatusSchema = z.object({
  userId: z.string().min(1),
  status: z.enum(USER_STATUSES),
});

/** Fields a SUPER_ADMIN provides when creating another admin. */
export const createAdminSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(60),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters").max(100),
  role: z.enum(ADMIN_ROLES),
});

/** Treat empty form values ("", null, undefined) as "not provided". */
const emptyToUndefined = (v: unknown) =>
  v === "" || v === null || v === undefined ? undefined : v;

/** Optional integer field that accepts a blank form value. */
const optionalInt = (min: number, max: number) =>
  z.preprocess(emptyToUndefined, z.coerce.number().int().min(min).max(max).optional());

/** Optional decimal field that accepts a blank form value. */
const optionalFloat = (min: number, max: number) =>
  z.preprocess(emptyToUndefined, z.coerce.number().min(min).max(max).optional());

export const modelSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(80),
  category: z.enum(CATEGORIES, {
    errorMap: () => ({ message: "Choose a category" }),
  }),
  gender: z.enum(GENDER_VALUES),
  location: z.string().trim().min(2, "Location is required").max(80),
  experience: z.enum(EXPERIENCE_LEVELS),
  bio: z
    .string()
    .trim()
    .min(40, "Bio should be at least 40 characters")
    .max(1200, "Bio is too long"),
  heightCm: z.preprocess(
    emptyToUndefined,
    z.coerce
      .number({ required_error: "Height is required" })
      .int()
      .min(120, "Height seems too low")
      .max(220, "Height seems too high"),
  ),
  bust: optionalInt(50, 200),
  waist: optionalInt(40, 200),
  hips: optionalInt(50, 200),
  shoeEu: optionalFloat(30, 52),
  hairColor: z.enum(HAIR_COLORS).optional().or(z.literal("")),
  eyeColor: z.enum(EYE_COLORS).optional().or(z.literal("")),
  instagram: z.string().trim().max(60).optional().or(z.literal("")),
  agencyEmail: z.string().trim().email("Enter a valid email").optional().or(z.literal("")),
  headshotUrl: z.string().trim().url("Must be a valid URL").optional().or(z.literal("")),
  gallery: z.string().max(4000).optional(), // newline or comma separated URLs
});

export const reviewSchema = z.object({
  modelId: z.string().min(1),
  rating: z.coerce.number().int().min(1, "Pick a rating").max(5),
  title: z.string().trim().max(120).optional().or(z.literal("")),
  body: z
    .string()
    .trim()
    .min(10, "Review should be at least 10 characters")
    .max(1000, "Review is too long"),
});

export const reviewDecisionSchema = z.object({
  modelId: z.string().min(1),
  decision: z.enum(["APPROVED", "REJECTED"]),
  note: z.string().trim().max(500).optional().or(z.literal("")),
});

export type ModelInput = z.infer<typeof modelSchema>;
