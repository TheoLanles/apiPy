"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Loader2, Upload } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";

export default function NewScriptPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const reqInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [reqFile, setReqFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user && user.role !== "admin") {
      router.push("/scripts");
    }
  }, [user, router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith(".py")) {
        setError("Only .py files are allowed");
        return;
      }
      setFile(selectedFile);
      setError("");
      // Auto-fill name from filename if empty
      if (!name) {
        setName(selectedFile.name.replace(".py", ""));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!file) {
      setError("Please select a Python file");
      return;
    }

    if (!name) {
      setError("Please enter a script name");
      return;
    }

    setIsLoading(true);
    try {
      const script = await api.uploadScript(file, name, description, reqFile || undefined);
      router.push(`/scripts/detail?id=${script.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to upload script");
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyle = {
    width: "100%",
    boxSizing: "border-box" as const,
    background: "#F5F0E8",
    border: "1px solid #C8DDD0",
    borderRadius: 10,
    padding: "9px 12px",
    fontSize: 13,
    color: "#0D5C45",
    outline: "none",
    fontFamily: "inherit",
  };

  const labelStyle = {
    display: "block",
    fontSize: 11,
    fontWeight: 600,
    color: "#4A7C65",
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
    marginBottom: 6,
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = "#00C853";
  };
  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = "#C8DDD0";
  };

  return (
    <div className="px-8 py-10" style={{ background: "#F5F0E8" }}>

      <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0D5C45", letterSpacing: "-0.01em", marginBottom: 28 }}>
        Create new script
      </h1>

      <div
        className="rounded-2xl overflow-hidden"
        style={{ maxWidth: 600, background: "#FFFFFF", border: "1px solid #D6E8DC" }}
      >
        <div className="px-5 py-4" style={{ borderBottom: "1px solid #D6E8DC" }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: "#0D5C45" }}>Upload Python script</p>
        </div>

        <div className="px-5 py-5">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {error && (
              <div className="rounded-xl px-3 py-2" style={{ background: "#FEE2E2", color: "#991B1B", border: "1px solid #FCA5A5", fontSize: 13 }}>
                {error}
              </div>
            )}

            {/* File Upload Area */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative rounded-xl px-4 py-6 flex flex-col items-center gap-2 cursor-pointer transition"
              style={{
                background: "#F5F0E8",
                border: `2px dashed ${file ? "#00C853" : "#C8DDD0"}`,
              }}
              onMouseEnter={(e) => {
                if (!file) {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "#0D5C45";
                }
              }}
              onMouseLeave={(e) => {
                if (!file) {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "#C8DDD0";
                }
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".py"
                onChange={handleFileChange}
                style={{ display: "none" }}
              />
              <Upload size={24} style={{ color: "#0D5C45" }} />
              <div style={{ color: "#0D5C45", fontWeight: 600, fontSize: 13 }}>
                {file ? file.name : "Click to upload Python file"}
              </div>
              <div style={{ color: "#4A7C65", fontSize: 12 }}>
                {file ? "Click to change file" : "or drag and drop .py files"}
              </div>
            </div>

            {/* Requirements Upload (Optional) */}
            <div className="flex flex-col gap-2">
              <label style={labelStyle}>Dependencies <span style={{ color: "#4A7C65", fontWeight: 400, textTransform: "none" }}>(optional requirements.txt)</span></label>
              <div
                onClick={() => reqInputRef.current?.click()}
                className="relative rounded-xl px-4 py-3 flex items-center gap-3 cursor-pointer transition"
                style={{
                  background: "#F5F0E8",
                  border: `1.5px dashed ${reqFile ? "#00C853" : "#C8DDD0"}`,
                }}
              >
                <input
                  ref={reqInputRef}
                  type="file"
                  accept=".txt"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setReqFile(f);
                  }}
                  style={{ display: "none" }}
                />
                <div style={{ color: "#0D5C45", fontSize: 13, fontWeight: 500, flex: 1 }}>
                  {reqFile ? reqFile.name : "Select requirements.txt"}
                </div>
                {reqFile && (
                  <button 
                    type="button" 
                    onClick={(e) => { e.stopPropagation(); setReqFile(null); }}
                    style={{ background: "none", border: "none", color: "#991B1B", fontSize: 11, fontWeight: 600, cursor: "pointer" }}
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>

            <div>
              <label style={labelStyle}>Script name <span style={{ color: "#00C853" }}>*</span></label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="My script"
                required
                style={inputStyle}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
            </div>

            <div>
              <label style={labelStyle}>Description</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="What does this script do?"
                rows={3}
                style={{ ...inputStyle, resize: "vertical" }}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={isLoading || !file}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl transition"
                style={{
                  background: "#0D5C45", color: "#F5F0E8", fontSize: 13, fontWeight: 600,
                  border: "none", cursor: isLoading || !file ? "not-allowed" : "pointer",
                  opacity: isLoading || !file ? 0.7 : 1,
                }}
                onMouseEnter={e => {
                  if (!isLoading && file) e.currentTarget.style.background = "#0a4a37";
                }}
                onMouseLeave={e => e.currentTarget.style.background = "#0D5C45"}
              >
                {isLoading && <Loader2 size={14} className="animate-spin" />}
                {isLoading ? "Uploading…" : "Upload script"}
              </button>

              <button
                type="button"
                onClick={() => router.back()}
                className="px-5 py-2.5 rounded-xl transition"
                style={{
                  background: "transparent", color: "#4A7C65", fontSize: 13, fontWeight: 500,
                  border: "1px solid #C8DDD0", cursor: "pointer",
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "#0D5C45"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "#C8DDD0"}
              >
                Cancel
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}