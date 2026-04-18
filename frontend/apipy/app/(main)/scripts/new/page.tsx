"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { IconLoader2, IconUpload, IconX, IconCheck } from "@tabler/icons-react";
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

  return (
    <div className="container-xl">
      <div className="page-header d-print-none mb-4">
        <div className="row align-items-center text-center">
          <div className="col">
            <h2 className="page-title justify-content-center fw-bold tracking-tight">
              Create New Script
            </h2>
          </div>
        </div>
      </div>

      <div className="row justify-content-center">
        <div className="col-12 col-md-8 col-lg-6">
          <div className="card card-premium shadow-sm">
            <div className="card-header">
              <h3 className="card-title">Upload Python Script</h3>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                {error && (
                  <div className="alert alert-danger mb-3">
                    {error}
                  </div>
                )}

                <div className="mb-4">
                  <label className="form-label required">Script File</label>
                  <div 
                    className={`dropzone-premium d-flex flex-column align-items-center justify-content-center rounded-3 p-5 cursor-pointer ${file ? 'active' : ''}`}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".py"
                      onChange={handleFileChange}
                      className="d-none"
                    />
                    <IconUpload size={40} className="mb-3 icon-upload" />
                    <div className="fw-bold h3 mb-1">
                      {file ? file.name : "Click to upload Python file"}
                    </div>
                    <div className="text-muted small">
                      {file ? "Click to change file" : "Drag and drop or browse files"}
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="form-label">
                    Dependencies
                    <span className="form-label-description">Optional requirements.txt</span>
                  </label>
                  <div 
                    className={`dropzone-premium d-flex flex-column align-items-center justify-content-center rounded-3 p-3 cursor-pointer ${reqFile ? 'active' : ''}`}
                    onClick={() => reqInputRef.current?.click()}
                    style={{ borderStyle: 'dashed' }}
                  >
                    <input
                      ref={reqInputRef}
                      type="file"
                      accept=".txt"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) setReqFile(f);
                      }}
                      className="d-none"
                    />
                    <div className="d-flex align-items-center gap-2">
                      <IconUpload size={20} className="icon-upload" />
                      <div className="fw-bold">
                        {reqFile ? reqFile.name : "Upload requirements.txt"}
                      </div>
                      {reqFile && (
                        <button 
                          className="btn btn-ghost-danger btn-icon btn-sm ms-2" 
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setReqFile(null);
                            if (reqInputRef.current) reqInputRef.current.value = "";
                          }}
                        >
                          <IconX size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label required">Script Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Enter script name"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Briefly describe what this script does..."
                    rows={3}
                  />
                </div>

                <div className="d-flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isLoading || !file}
                  >
                    {isLoading ? <IconLoader2 size={16} className="me-2 animate-spin" /> : <IconCheck size={16} className="me-2" />}
                    {isLoading ? "Uploading..." : "Upload Script"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-link link-secondary"
                    onClick={() => router.back()}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
