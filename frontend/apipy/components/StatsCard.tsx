"use client";

import React from "react";
import { IconProps } from "@tabler/icons-react";

interface StatsCardProps {
  label: string;
  value: number | string;
  color?: string; // Optional: used for icon background
  icon?: React.ElementType<IconProps>;
  className?: string;
  trend?: {
    value: string;
    positive: boolean;
  };
}

export const StatsCard = React.memo(({ label, value, color = "primary", icon: Icon, className, trend }: StatsCardProps) => {
  return (
    <div className={`card card-premium shadow-sm ${className || ""}`}>
      <div className="card-body p-3">
        <div className="row align-items-center">
          {Icon && (
            <div className="col-auto">
              <span className={`bg-${color}-lt text-${color} avatar avatar-md rounded-3 shadow-none`}>
                <Icon size={24} stroke={1.5} />
              </span>
            </div>
          )}
          <div className="col">
            <div className="text-muted small fw-bold text-uppercase tracking-wider">
              {label}
            </div>
            <div className="d-flex align-items-baseline gap-2 mt-1">
              <span className="h1 mb-0 fw-bold tracking-tight text-body">{value}</span>
              {trend && (
                <span className={`text-${trend.positive ? 'success' : 'danger'} d-inline-flex align-items-center lh-1 small fw-bold`}>
                  {trend.value}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

StatsCard.displayName = "StatsCard";
