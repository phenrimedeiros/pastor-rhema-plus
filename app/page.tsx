"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/supabase_client";
import { T } from "@/lib/tokens";

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
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(160deg, #0b2a5b 0%, #0d3268 100%)",
        color: "rgba(255,255,255,.82)",
        fontFamily: T.fontSans,
      }}
    >
      <div style={{ display: "grid", justifyItems: "center", gap: "14px" }}>
        <div
          style={{
            width: 38,
            height: 38,
            border: "3px solid rgba(255,255,255,.18)",
            borderTopColor: T.gold,
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <p style={{ margin: 0, fontSize: "14px", fontWeight: 700, letterSpacing: ".02em" }}>
          Entrando no Pastor Rhema...
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
