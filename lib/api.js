import { auth } from "@/lib/supabase_client";

export async function callApi(path, body) {
  const session = await auth.getSession();
  if (!session) throw new Error("Sessão expirada. Faça login novamente.");

  const res = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(body),
  });

  // Tenta parsear JSON; se falhar, usa status HTTP para montar mensagem
  let data;
  const text = await res.text();
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Erro ${res.status}: resposta inválida do servidor. Verifique as variáveis de ambiente na Vercel.`);
  }

  if (!res.ok) throw new Error(data?.error || `Erro ${res.status}`);
  return data;
}
