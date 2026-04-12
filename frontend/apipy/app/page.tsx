"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";

export default function Home() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (user) {
      router.push("/dashboard");
    } else {
      router.push("/login");
    }
  }, [user, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#FFF3D9]">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">apiPy</h1>
        <p className="text-slate-600">Loading...</p>
      </div>
    </div>
  );
}
