"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { api } from "@/lib/api";
import type { Script, ProcessState } from "@/types";
import { 
  IconLoader2, 
  IconFileCode, 
  IconPlayerPlay, 
  IconAlertCircle,
  IconCircleFilled
} from "@tabler/icons-react";
import { StatsCard } from "@/components/StatsCard";

export default function DashboardPage() {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [states, setStates] = useState<Record<string, ProcessState>>({});
  const [isLoading, setIsLoading] = useState(true);

  const loadScripts = useCallback(async () => {
    try {
      const data = await api.getScripts();
      setScripts(data || []);
    } catch (err) {
      console.error("Failed to load scripts:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadStatuses = useCallback(async () => {
    try {
      const statuses = await api.getAllScriptsStatus();
      setStates(statuses);
    } catch (err) {
      console.error("Failed to load statuses:", err);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      await Promise.all([loadScripts(), loadStatuses()]);
    };
    init();
  }, [loadScripts, loadStatuses]);

  useEffect(() => {
    const interval = setInterval(loadStatuses, 5000);
    return () => clearInterval(interval);
  }, [loadStatuses]);

  const runningCount = useMemo(() => 
    scripts.filter(script => states[script.id]?.status === "running").length, 
  [scripts, states]);

  const errorCount = useMemo(() => 
    scripts.filter(script => {
      const status = states[script.id]?.status;
      return status === "error" || status === "crashed";
    }).length,
  [scripts, states]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "running": return "bg-success";
      case "error":
      case "crashed": return "bg-danger";
      case "stopped": return "bg-secondary";
      default: return "bg-warning";
    }
  };

  return (
    <div className="container-xl">
      {/* Page Header */}
      <div className="page-header d-print-none mb-4">
        <div className="row align-items-center">
          <div className="col">
            <h2 className="page-title fw-bold tracking-tight">
              Dashboard
            </h2>
            <div className="text-secondary mt-1">Overview of your scripts and system status.</div>
          </div>
        </div>
      </div>

      <div className="row row-cards mb-4">
        <div className="col-sm-6 col-lg-4">
          <StatsCard 
            label="Total scripts" 
            value={scripts.length} 
            color="primary" 
            icon={IconFileCode} 
          />
        </div>
        <div className="col-sm-6 col-lg-4">
          <StatsCard 
            label="Running" 
            value={runningCount} 
            color="success" 
            icon={IconPlayerPlay} 
          />
        </div>
        <div className="col-sm-6 col-lg-4">
          <StatsCard 
            label="Errors" 
            value={errorCount} 
            color="danger" 
            icon={IconAlertCircle} 
          />
        </div>
      </div>

      <div className="row row-cards">
        <div className="col-12">
          <div className="card card-premium shadow-sm">
            <div className="card-header">
              <h3 className="card-title">Scripts status</h3>
            </div>
            
            {isLoading ? (
              <div className="card-body py-5 text-center">
                <IconLoader2 className="animate-spin text-secondary mb-2" size={24} />
                <div className="text-secondary small">Loading scripts data...</div>
              </div>
            ) : scripts.length === 0 ? (
              <div className="card-body py-5 text-center text-secondary">
                No scripts configured yet.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-vcenter table-mobile-md card-table">
                  <thead>
                    <tr>
                      <th className="text-uppercase tracking-widest small fw-bold text-secondary py-3">Name</th>
                      <th className="text-uppercase tracking-widest small fw-bold text-secondary py-3">Path</th>
                      <th className="text-uppercase tracking-widest small fw-bold text-secondary py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scripts.map((script) => {
                      const status = states[script.id]?.status || "unknown";
                      return (
                        <tr key={script.id} className="cursor-pointer hover:bg-light transition-colors">
                          <td className="py-3">
                            <div className="d-flex align-items-center">
                              <span className="table-accent-bar"></span>
                              <div className="fw-bold text-reset">{script.name}</div>
                            </div>
                          </td>
                          <td className="text-secondary">
                            {script.path}
                          </td>
                          <td>
                            <span className={`badge ${getStatusBadge(status)} badge-blink me-2`}></span>
                            <span className="text-capitalize">{status}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
