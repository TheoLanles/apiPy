"use client";

import React from "react";

interface StatsCardProps {
  label: string;
  value: number;
  color: string;
  className?: string;
}

export const StatsCard = React.memo(({ label, value, color, className }: StatsCardProps) => {
  return (
    <div
      className={`rounded-2xl p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${className}`}
      style={{ 
        background: "#FFFFFF", 
        border: "1px solid #D6E8DC",
      }}
    >
      <p style={{ 
        fontSize: 11, 
        fontWeight: 600, 
        color: "#4A7C65", 
        textTransform: "uppercase", 
        letterSpacing: "0.1em", 
        marginBottom: 8 
      }}>
        {label}
      </p>
      <div className="flex items-baseline gap-1">
        <p style={{ 
          fontSize: 32, 
          fontWeight: 800, 
          color, 
          lineHeight: 1,
          letterSpacing: "-0.02em" 
        }}>
          {value}
        </p>
      </div>
    </div>
  );
});

StatsCard.displayName = "StatsCard";
