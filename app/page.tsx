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
    <main className="flex min-h-screen items-start justify-center bg-[#0f0f10] p-6">
      <div className="w-full max-w-2xl rounded-lg bg-[#151517] p-8 shadow-xl">
        <h1 className="mb-6 text-xl font-bold text-white">
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
              className="mb-1 block text-sm font-semibold text-gray-300"
            >
              Job description (brief)
            </label>
            <textarea
              id="jd"
              name="jd"
              rows={4}
              placeholder="Ownership of influencer product features, 3+ yrs..."
              className="w-full rounded-md border border-[#303034] bg-[#0b0b0c] px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Company reason */}
          <div>
            <label
              htmlFor="company_reason"
              className="mb-1 block text-sm font-semibold text-gray-300"
            >
              Why this company? (optional — AI generates if blank)
            </label>
            <textarea
              id="company_reason"
              name="company_reason"
              rows={2}
              placeholder="I love how Viral Pitch helps creators monetise..."
              className="w-full rounded-md border border-[#303034] bg-[#0b0b0c] px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Status banner */}
          {status === "success" && (
            <div className="rounded-md bg-green-900/40 p-3 text-sm text-green-300">
              {message}
            </div>
          )}
          {status === "error" && (
            <div className="rounded-md bg-red-900/40 p-3 text-sm text-red-300">
              {message}
            </div>
          )}

          {/* Hint */}
          <p className="text-xs text-gray-500">
            Submits to <code className="text-gray-400">/api/apply</code>. If
            recipient email is provided, the search pipeline is skipped.
          </p>

          <button
            type="submit"
            disabled={status === "submitting"}
            className="rounded-md bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
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
        className="mb-1 block text-sm font-semibold text-gray-300"
      >
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-md border border-[#303034] bg-[#0b0b0c] px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-blue-500 focus:outline-none"
      />
    </div>
  );
}
