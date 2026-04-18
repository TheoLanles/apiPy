"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { Navbar } from "@/components/Navbar";
import { IconLoader2 } from "@tabler/icons-react";
import "simplebar-react/dist/simplebar.min.css";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
          <div className="text-center py-5">
            <div className="mb-3">
              <span className="fs-1 fw-bold tracking-tighter text-primary">apiPY</span>
            </div>
            <div className="text-secondary small">Initializing secure session...</div>
          </div>
    );
  }

  return (
    <div className="page">
      <Navbar />
      <div className="page-wrapper">
        <main className="page-body">
          <div className="container-xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
