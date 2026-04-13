"use client";

import React, { useState } from "react";
import { Search } from "lucide-react";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const SearchInput = React.memo(({ value, onChange, placeholder = "Search...", className }: SearchInputProps) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div 
      className={`relative group transition-all duration-300 ${isFocused ? 'flex-[1.5]' : 'flex-1'} ${className}`}
    >
      <Search 
        className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-300 ${
          isFocused ? "text-emerald-700" : "text-emerald-800/40"
        }`} 
        size={18} 
      />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            onChange("");
            e.currentTarget.blur();
          }
        }}
        className="w-full pl-10 pr-4 py-2 rounded-2xl transition-all duration-400 placeholder:text-emerald-800/30 outline-none"
        style={{ 
          fontSize: 13,
          background: isFocused ? "#FFFFFF" : "rgba(13, 92, 69, 0.03)",
          border: isFocused ? "1px solid #0D5C45" : "1px solid rgba(13, 92, 69, 0.08)",
          color: "#0D5C45",
          boxShadow: isFocused 
            ? "0 4px 20px -5px rgba(13, 92, 69, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.02)" 
            : "none"
        }}
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-800/40 hover:text-emerald-800 transition-colors"
        >
          ESC
        </button>
      )}
    </div>
  );
});

SearchInput.displayName = "SearchInput";
