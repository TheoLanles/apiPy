"use client";

import React, { useState } from "react";
import { IconSearch } from "@tabler/icons-react";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const SearchInput = React.memo(({ value, onChange, placeholder = "Search...", className }: SearchInputProps) => {
  return (
    <div className={`position-relative d-flex align-items-center ${className || ""}`}>
      <div 
        className="position-absolute d-flex align-items-center justify-content-center text-primary opacity-50" 
        style={{ left: '12px', height: '100%', pointerEvents: 'none', zIndex: 10 }}
      >
        <IconSearch size={16} />
      </div>
      <input 
        type="text" 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="form-control" 
        placeholder={placeholder}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            onChange("");
            e.currentTarget.blur();
          }
        }}
        style={{ paddingLeft: '2.5rem' }}
      />
    </div>
  );
});

SearchInput.displayName = "SearchInput";
