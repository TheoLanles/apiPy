"use client";

import React, { useState, useEffect } from "react";
import { getGravatarUrl } from "@/lib/gravatar";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  email?: string;
  username?: string;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  pixelSize?: number;
}

export function UserAvatar({ 
  email, 
  username, 
  className, 
  size = "sm",
  pixelSize = 40
}: UserAvatarProps) {
  const [imgError, setImgError] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (email) {
      setAvatarUrl(getGravatarUrl(email, pixelSize * 2)); // 2x for retina
      setImgError(false);
    } else {
      setAvatarUrl(null);
    }
  }, [email, pixelSize]);

  // Initials Fallback
  const initials = username?.substring(0, 2).toUpperCase() || "??";

  const renderInitials = () => (
    <span className={cn(
      "avatar rounded-circle bg-primary-lt fw-bold",
      size === "sm" && "avatar-sm",
      size === "md" && "avatar-md",
      size === "lg" && "avatar-lg",
      size === "xl" && "avatar-xl",
      className
    )}>
      {initials}
    </span>
  );

  if (!avatarUrl || imgError) {
    return renderInitials();
  }

  return (
    <span className={cn(
      "avatar rounded-circle bg-transparent overflow-hidden",
      size === "sm" && "avatar-sm",
      size === "md" && "avatar-md",
      size === "lg" && "avatar-lg",
      size === "xl" && "avatar-xl",
      className
    )}>
      <img 
        src={avatarUrl} 
        alt={username} 
        onError={() => setImgError(true)}
        className="w-100 h-100 object-cover"
        loading="lazy"
      />
    </span>
  );
}
