"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { UploadCloud } from "lucide-react";
import { createModelAction, type ModelFormState } from "@/actions/models";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import {
  CATEGORIES,
  EXPERIENCE_LEVELS,
  EYE_COLORS,
  GENDERS,
  HAIR_COLORS,
} from "@/lib/constants";

const initial: ModelFormState = {};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="border-b border-border pb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </h2>
  );
}

export function SubmitModelForm() {
  const [state, formAction] = useActionState(createModelAction, initial);
  const v = state.values ?? {};
  const e = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-10">
      {/* Basics */}
      <section className="space-y-4">
        <SectionTitle>Basics</SectionTitle>

        <Field label="Full name" htmlFor="name" required error={e.name}>
          <Input id="name" name="name" defaultValue={v.name} placeholder="e.g. Alex Morgan" required />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Category" htmlFor="category" required error={e.category}>
            <Select id="category" name="category" defaultValue={v.category ?? ""} required>
              <option value="" disabled>
                Select a category
              </option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Gender" htmlFor="gender" required error={e.gender}>
            <Select id="gender" name="gender" defaultValue={v.gender ?? "FEMALE"} required>
              {GENDERS.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Location" htmlFor="location" required error={e.location}>
            <Input id="location" name="location" defaultValue={v.location} placeholder="City, Country" required />
          </Field>

          <Field label="Experience" htmlFor="experience" required error={e.experience}>
            <Select id="experience" name="experience" defaultValue={v.experience ?? "New Face"} required>
              {EXPERIENCE_LEVELS.map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field
          label="Bio"
          htmlFor="bio"
          required
          hint="Describe experience, strengths and notable work (40–1200 characters)."
          error={e.bio}
        >
          <Textarea id="bio" name="bio" defaultValue={v.bio} rows={5} required />
        </Field>
      </section>

      {/* Measurements */}
      <section className="space-y-4">
        <SectionTitle>Measurements</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Height (cm)" htmlFor="heightCm" required error={e.heightCm}>
            <Input id="heightCm" name="heightCm" type="number" defaultValue={v.heightCm} placeholder="178" required />
          </Field>
          <Field label="Bust (cm)" htmlFor="bust" error={e.bust}>
            <Input id="bust" name="bust" type="number" defaultValue={v.bust} placeholder="82" />
          </Field>
          <Field label="Waist (cm)" htmlFor="waist" error={e.waist}>
            <Input id="waist" name="waist" type="number" defaultValue={v.waist} placeholder="61" />
          </Field>
          <Field label="Hips (cm)" htmlFor="hips" error={e.hips}>
            <Input id="hips" name="hips" type="number" defaultValue={v.hips} placeholder="89" />
          </Field>
          <Field label="Shoe (EU)" htmlFor="shoeEu" error={e.shoeEu}>
            <Input id="shoeEu" name="shoeEu" type="number" step="0.5" defaultValue={v.shoeEu} placeholder="40" />
          </Field>
          <div />
          <Field label="Hair colour" htmlFor="hairColor" error={e.hairColor}>
            <Select id="hairColor" name="hairColor" defaultValue={v.hairColor ?? ""}>
              <option value="">—</option>
              {HAIR_COLORS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Eye colour" htmlFor="eyeColor" error={e.eyeColor}>
            <Select id="eyeColor" name="eyeColor" defaultValue={v.eyeColor ?? ""}>
              <option value="">—</option>
              {EYE_COLORS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </section>

      {/* Media & links */}
      <section className="space-y-4">
        <SectionTitle>Media &amp; links</SectionTitle>
        <Field
          label="Headshot URL"
          htmlFor="headshotUrl"
          hint="Link to a primary portrait image. Leave blank to use a placeholder."
          error={e.headshotUrl}
        >
          <Input id="headshotUrl" name="headshotUrl" type="url" defaultValue={v.headshotUrl} placeholder="https://…" />
        </Field>
        <Field
          label="Portfolio images"
          htmlFor="gallery"
          hint="One image URL per line (up to 12). These appear in the profile gallery."
          error={e.gallery}
        >
          <Textarea
            id="gallery"
            name="gallery"
            defaultValue={v.gallery}
            rows={4}
            placeholder={"https://…/photo-1.jpg\nhttps://…/photo-2.jpg"}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Instagram handle" htmlFor="instagram" error={e.instagram}>
            <Input id="instagram" name="instagram" defaultValue={v.instagram} placeholder="username" />
          </Field>
          <Field label="Contact email" htmlFor="agencyEmail" error={e.agencyEmail}>
            <Input id="agencyEmail" name="agencyEmail" type="email" defaultValue={v.agencyEmail} placeholder="agent@example.com" />
          </Field>
        </div>
      </section>

      {state.error && (
        <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm font-medium text-danger">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-3 border-t border-border pt-6">
        <SubmitButton />
        <p className="text-sm text-muted-foreground">
          Submissions are reviewed by an admin before going live.
        </p>
      </div>
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending}>
      <UploadCloud className="h-4 w-4" />
      {pending ? "Submitting…" : "Submit for review"}
    </Button>
  );
}
