import type { Metadata } from "next";
import { SubmitModelForm } from "@/components/models/submit-form";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Submit talent" };

export default async function SubmitPage() {
  await requireUser("/login?next=/submit");

  return (
    <div className="container max-w-3xl py-10 lg:py-14">
      <header className="mb-8">
        <span className="eyebrow">New profile</span>
        <h1 className="mt-2 text-4xl font-semibold">Submit talent</h1>
        <p className="mt-2 text-muted-foreground">
          Complete the profile below. Once submitted, our admin team will review
          it before it appears in the public gallery.
        </p>
      </header>

      <div className="card-surface p-6 sm:p-8">
        <SubmitModelForm />
      </div>
    </div>
  );
}
