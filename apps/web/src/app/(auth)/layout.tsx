"use client";

import { type ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";

export default function AuthLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [initialSessionResolved, setInitialSessionResolved] = useState(false);
  if (!initialSessionResolved && !isPending) {
    setInitialSessionResolved(true);
  }

  useEffect(() => {
    if (!isPending && session) {
      router.replace("/dashboard");
    }
  }, [isPending, session, router]);

  if ((!initialSessionResolved && isPending) || session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f172a]">
        <Loader2 className="h-8 w-8 animate-spin text-[#357AB7]" />
      </div>
    );
  }

  return <>{children}</>;
}
