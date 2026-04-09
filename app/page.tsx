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
        router.replace("/dashboard");
      } else {
        router.replace("/login");
      }
    };
    verificar();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0b2a5b] to-[#0d3268] text-white/80 font-sans">
      <div className="grid justify-items-center gap-[14px]">
        <div className="w-[38px] h-[38px] border-[3px] border-white/20 border-t-brand-gold rounded-full animate-spin" />
        <p className="m-0 text-[14px] font-bold tracking-[.02em]">
          Entrando no Pastor Rhema...
        </p>
      </div>
    </div>
  );
}
