"use client";

import React, { useEffect, useState } from "react";
import { Save, Loader2, Link2, User, AlignLeft, BrainCircuit } from "lucide-react";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    senderName: "",
    phone: "",
    portfolioUrl: "",
    linkedinUrl: "",
    resumeUrl: "",
    aboutMeBullets: "",
    emailTemplateStructure: "",
    systemPrompt: "",
  });

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.profile) {
          setFormData({
            senderName: data.profile.senderName || "",
            phone: data.profile.phone || "",
            portfolioUrl: data.profile.portfolioUrl || "",
            linkedinUrl: data.profile.linkedinUrl || "",
            resumeUrl: data.profile.resumeUrl || "",
            aboutMeBullets: data.profile.aboutMeBullets || "",
            emailTemplateStructure: data.profile.emailTemplateStructure || "",
            systemPrompt: data.profile.systemPrompt || "",
          });
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setSuccess(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to save settings");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-slate-200 font-sans flex flex-col">
      <main className="flex-grow w-full max-w-4xl mx-auto px-6 py-10 space-y-10">
        <header className="space-y-2 border-b border-[#1e1e22] pb-6">
          <h1 className="text-3xl font-bold text-white">Settings & Profile</h1>
          <p className="text-slate-400">
            Configure your personal information, CV links, and custom outreach templates.
          </p>
        </header>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Basic Info */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <User className="w-5 h-5 text-indigo-400" /> Basic Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Full Name</label>
                  <input
                    type="text"
                    name="senderName"
                    value={formData.senderName}
                    onChange={handleChange}
                    className="w-full bg-[#111113] border border-[#2a2a30] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                    placeholder="E.g. Shikhar Gupta"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Phone Number</label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full bg-[#111113] border border-[#2a2a30] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                    placeholder="+91 9999999999"
                  />
                </div>
              </div>
            </section>

            {/* Links */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Link2 className="w-5 h-5 text-indigo-400" /> Web Links
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Resume / CV Link</label>
                  <input
                    type="text"
                    name="resumeUrl"
                    value={formData.resumeUrl}
                    onChange={handleChange}
                    className="w-full bg-[#111113] border border-[#2a2a30] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                    placeholder="https://..."
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Portfolio Link</label>
                    <input
                      type="text"
                      name="portfolioUrl"
                      value={formData.portfolioUrl}
                      onChange={handleChange}
                      className="w-full bg-[#111113] border border-[#2a2a30] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">LinkedIn Link</label>
                    <input
                      type="text"
                      name="linkedinUrl"
                      value={formData.linkedinUrl}
                      onChange={handleChange}
                      className="w-full bg-[#111113] border border-[#2a2a30] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Static Template */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <AlignLeft className="w-5 h-5 text-indigo-400" /> Email Formatting
              </h2>
              
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">
                  About Me Bullets (Markdown bullet points)
                </label>
                <textarea
                  name="aboutMeBullets"
                  value={formData.aboutMeBullets}
                  onChange={handleChange}
                  rows={5}
                  className="w-full bg-[#111113] border border-[#2a2a30] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 font-mono text-sm"
                  placeholder="• I am a Product Manager...\n• I have built..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1 mt-6">
                  Email Template Structure (Optional Override)
                </label>
                <p className="text-xs text-slate-500 mb-2">
                  Leave blank to use the default formatting. Available variables: {`{{contactName}}, {{companyName}}, {{role}}, {{companyMission}}, {{matchedStrengths}}, {{aboutMeBullets}}, {{portfolioUrl}}, {{phone}}, {{linkedinUrl}}, {{resumeUrl}}, {{senderName}}`}
                </p>
                <textarea
                  name="emailTemplateStructure"
                  value={formData.emailTemplateStructure}
                  onChange={handleChange}
                  rows={10}
                  className="w-full bg-[#111113] border border-[#2a2a30] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 font-mono text-sm"
                  placeholder={`Hi {{contactName}},\n\nI came across your post about {{companyName}}...`}
                />
              </div>
            </section>

            {/* LLM Prompt Override */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-indigo-400" /> LLM Generation Instructions
              </h2>
              
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">
                  Custom LLM Task Prompt (Optional Override)
                </label>
                <p className="text-xs text-slate-500 mb-2">
                  Leave blank to use the default AI research logic. Overriding this changes how the AI analyzes the company and generates the "Why PayU" hooks.
                </p>
                <textarea
                  name="systemPrompt"
                  value={formData.systemPrompt}
                  onChange={handleChange}
                  rows={8}
                  className="w-full bg-[#111113] border border-[#2a2a30] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 font-mono text-sm"
                  placeholder="1. Identify 3 critical UX friction points...\n2. Cross-reference EVIDENCE LIBRARY..."
                />
              </div>
            </section>

            <div className="pt-6 border-t border-[#1e1e22] flex items-center justify-between">
              <div>
                {error && <p className="text-red-400 text-sm">{error}</p>}
                {success && <p className="text-emerald-400 text-sm font-medium flex items-center gap-2">✓ Saved successfully</p>}
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-lg font-bold transition-all disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Settings
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
