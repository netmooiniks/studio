
"use client";

import { SignupForm } from "@/components/auth/signup-form";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { EggIcon } from "lucide-react";

export default function SignupPage() {
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
            <EggIcon className="h-12 w-12 text-primary mb-4 animate-pulse" />
            <p className="text-muted-foreground">Loading...</p>
        </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
       <div className="mb-8 text-center">
        <EggIcon className="h-16 w-16 text-primary mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-primary">ChronoHatch<sup className="text-sm font-normal align-super">©</sup></h1>
        <p className="text-muted-foreground">Join ChronoHatch and Track Your Incubation Journey</p>
      </div>
      <SignupForm />
    </div>
  );
}

