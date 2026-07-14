import { z } from "zod";
import {
  CATEGORIES,
  EXPERIENCE_LEVELS,
  EYE_COLORS,
  HAIR_COLORS,
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

export const modelSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(80),
  category: z.enum(CATEGORIES as unknown as [string, ...string[]], {
    errorMap: () => ({ message: "Choose a category" }),
  }),
  gender: z.enum(["FEMALE", "MALE", "NONBINARY"]),
  location: z.string().trim().min(2, "Location is required").max(80),
  experience: z.enum(EXPERIENCE_LEVELS as unknown as [string, ...string[]]),
  bio: z
    .string()
    .trim()
    .min(40, "Bio should be at least 40 characters")
    .max(1200, "Bio is too long"),
  heightCm: z.coerce
    .number()
    .int()
    .min(120, "Height seems too low")
    .max(220, "Height seems too high"),
  bust: z.coerce.number().int().min(50).max(200).optional().or(z.literal(NaN).transform(() => undefined)),
  waist: z.coerce.number().int().min(40).max(200).optional().or(z.literal(NaN).transform(() => undefined)),
  hips: z.coerce.number().int().min(50).max(200).optional().or(z.literal(NaN).transform(() => undefined)),
  shoeEu: z.coerce.number().min(30).max(52).optional().or(z.literal(NaN).transform(() => undefined)),
  hairColor: z.enum(HAIR_COLORS as unknown as [string, ...string[]]).optional().or(z.literal("")),
  eyeColor: z.enum(EYE_COLORS as unknown as [string, ...string[]]).optional().or(z.literal("")),
  instagram: z.string().trim().max(60).optional().or(z.literal("")),
  agencyEmail: z.string().trim().email("Enter a valid email").optional().or(z.literal("")),
  headshotUrl: z.string().trim().url("Must be a valid URL").optional().or(z.literal("")),
  gallery: z.string().optional(), // newline or comma separated URLs
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
