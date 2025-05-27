
"use client";

import { LoginForm } from "@/components/auth/login-form";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Image from 'next/image';

export default function LoginPage() {
  const { currentUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && currentUser) {
      router.push("/"); // Redirect to dashboard if already logged in
    }
  }, [currentUser, loading, router]);

  if (loading || (!loading && currentUser)) {
    // Show a loading state or nothing while redirecting
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
            <Image src="/icon.png" alt="Authenticating Icon" width={48} height={48} className="mb-4 animate-pulse" />
            <p className="text-muted-foreground">Loading...</p>
        </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="mb-8 text-center">
        <Image src="/icon.png" alt="ChronoHatch Logo" width={64} height={64} className="mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-primary">ChronoHatch<sup className="text-sm font-normal align-super">©</sup></h1>
        <p className="text-muted-foreground">Your Smart Incubation Companion</p>
      </div>
      <LoginForm />
    </div>
  );
}
