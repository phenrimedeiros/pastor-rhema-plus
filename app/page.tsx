"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/supabase_client";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const verificar = async () => {
      const session = await auth.getSession();
      if (session) {
        router.push("/dashboard");
      } else {
        router.push("/login");
      }
    };
    verificar();
  }, [router]);

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          Redirecionando...
        </p>
      </main>
    </div>
  );
}
