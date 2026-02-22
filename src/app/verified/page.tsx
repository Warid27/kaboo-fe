"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

function VerifiedPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const type = searchParams.get("type");
    if (type === "signup" || type === "email_change") {
      return;
    }
  }, [searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-xl bg-card p-6 text-center shadow-xl ring-1 ring-border">
        <h1 className="text-2xl font-semibold text-foreground">
          Account verified
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your email has been verified. You can now sign in and start playing
          Kaboo.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <Button onClick={() => router.push("/auth/login")} className="w-full">
            Go to login
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/")}
            className="w-full"
          >
            Back to home
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function VerifiedPage() {
  return (
    <Suspense>
      <VerifiedPageContent />
    </Suspense>
  );
}
