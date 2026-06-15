"use client";

import { useState, type FormEvent } from "react";

type Status = "idle" | "submitting" | "success" | "error";

export default function Home() {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setMessage("");

    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));

    try {
      const res = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (!res.ok) {
        setStatus("error");
        setMessage(json.error ?? "Something went wrong");
        return;
      }

      setStatus("success");
      setMessage(
        `Pipeline started! Run ID: ${json.run_ids?.[0] ?? "unknown"}. The email will be sent once processing completes.`
      );
      form.reset();
    } catch (err) {
      setStatus("error");
      setMessage((err as Error).message);
    }
  }

  return (
    <main className="flex min-h-screen items-start justify-center p-6">
      <div className="w-full max-w-2xl rounded-lg border border-[var(--border)] bg-[var(--card)] p-8">
        <h1 className="mb-6 text-xl font-bold text-[var(--foreground)]">
          Job Apply — Quick Form
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Recipient info */}
          <div className="grid grid-cols-2 gap-4">
            <Field
              id="recipient_name"
              label="Recipient name (optional)"
              placeholder="Ex: Abhinav"
            />
            <Field
              id="recipient_email"
              label="Recipient email (optional)"
              placeholder="Ex: abhinav@company.com"
              type="email"
            />
          </div>

          {/* Company + role */}
          <div className="grid grid-cols-2 gap-4">
            <Field
              id="company"
              label="Company"
              placeholder="Viral Pitch"
              required
            />
            <Field
              id="job_title"
              label="Job Title / Opening"
              placeholder="Product Manager"
              required
            />
          </div>

          {/* JD */}
          <div>
            <label
              htmlFor="jd"
              className="mb-1 block text-sm font-semibold text-[var(--foreground)]"
            >
              Job description (brief)
            </label>
            <textarea
              id="jd"
              name="jd"
              rows={4}
              placeholder="Ownership of influencer product features, 3+ yrs..."
              className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:border-[var(--primary)] focus:outline-none"
            />
          </div>

          {/* Company reason */}
          <div>
            <label
              htmlFor="company_reason"
              className="mb-1 block text-sm font-semibold text-[var(--foreground)]"
            >
              Why this company? (optional — AI generates if blank)
            </label>
            <textarea
              id="company_reason"
              name="company_reason"
              rows={2}
              placeholder="I love how Viral Pitch helps creators monetise..."
              className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:border-[var(--primary)] focus:outline-none"
            />
          </div>

          {/* Status banner */}
          {status === "success" && (
            <div className="rounded-md bg-[var(--primary)]/10 p-3 text-sm text-[var(--primary)]">
              {message}
            </div>
          )}
          {status === "error" && (
            <div className="rounded-md bg-red-500/10 p-3 text-sm text-red-400">
              {message}
            </div>
          )}

          {/* Hint */}
          <p className="text-xs text-[var(--muted-foreground)]">
            Submits to <code className="text-[var(--muted-foreground)]">/api/apply</code>. If
            recipient email is provided, the search pipeline is skipped.
          </p>

          <button
            type="submit"
            disabled={status === "submitting"}
            className="rounded-md bg-[var(--primary)] px-5 py-2.5 text-sm font-medium text-[var(--primary-foreground)] transition hover:opacity-90 disabled:opacity-50"
          >
            {status === "submitting" ? "Processing..." : "Submit"}
          </button>
        </form>
      </div>
    </main>
  );
}

function Field({
  id,
  label,
  placeholder,
  required,
  type = "text",
}: {
  id: string;
  label: string;
  placeholder: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1 block text-sm font-semibold text-[var(--foreground)]"
      >
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:border-[var(--primary)] focus:outline-none"
      />
    </div>
  );
}
