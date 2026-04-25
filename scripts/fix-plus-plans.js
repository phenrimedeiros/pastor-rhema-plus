import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

const requiredEnv = ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);

if (missingEnv.length > 0) {
  throw new Error(`Variaveis ausentes: ${missingEnv.join(", ")}`);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const plusEmails = [
  "bobbygutierrez4@gmail.com",
  "pastorjreynolds@cox.net",
  "preacherman1954@yahoo.com",
  "obedmendoza@hotmail.com",
  "jerryhaynessr1952@gmail.com",
  "pastorstmark@nc.rr.com",
  "tvalent2003@yahoo.com",
  "oialaba58@gmail.com",
  "fcostello@me.com",
  "mullins0846@gmail.com",
  "ae19560@yahoo.com",
  "pastorkejohnson@gmail.com",
  "davidpbrbali@gmail.com",
  "marnieblucher97@gmail.com",
  "olayemi.taiye@yahoo.com",
  "kingonoje@me.com",
  "cct.pradeep@gmail.com",
  "davidgaskin078@gmail.com",
  "seyiaderele@gmail.com",
  "godfreygitonga11@gmail.com",
  "ebome2012@gmail.com",
  "tommyking39@yahoo.com",
  "davis.tara40@gmail.com",
];

async function fixPlusPlans() {
  console.log(`Buscando usuarios no Supabase...\n`);

  // Monta mapa email → id varrendo todas as páginas
  const emailToId = {};
  const emailToUser = {};
  let page = 1;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(`Erro ao listar usuarios: ${error.message}`);

    const users = data?.users || [];
    if (users.length === 0) break;

    for (const u of users) {
      const normalizedEmail = String(u.email || "").toLowerCase();
      if (!normalizedEmail) continue;
      emailToId[normalizedEmail] = u.id;
      emailToUser[normalizedEmail] = u;
    }

    if (data.users.length < 1000) break;
    page++;
  }

  const uniqueEmails = [...new Set(plusEmails.map((email) => email.trim().toLowerCase()).filter(Boolean))];
  let atualizados = 0;
  let naoEncontrados = 0;
  let erros = 0;
  const detalhesNaoEncontrados = [];
  const detalhesErros = [];

  for (const email of uniqueEmails) {
    const userId = emailToId[email];
    const authUser = emailToUser[email];

    if (!userId) {
      console.log(`! nao encontrado: ${email}`);
      detalhesNaoEncontrados.push(email);
      naoEncontrados++;
      continue;
    }

    const { data: existingProfile, error: selectError } = await supabase
      .from("profiles")
      .select("id, plan")
      .eq("id", userId)
      .maybeSingle();

    if (selectError) {
      console.log(`x erro ao buscar profile ${email}: ${selectError.message}`);
      detalhesErros.push(`${email}: ${selectError.message}`);
      erros++;
      continue;
    }

    const query = existingProfile
      ? supabase
        .from("profiles")
        .update({ plan: "plus" })
        .eq("id", userId)
        .select("id, plan")
        .single()
      : supabase
        .from("profiles")
        .insert([{
          id: userId,
          full_name: authUser?.user_metadata?.full_name || null,
          plan: "plus",
        }])
        .select("id, plan")
        .single();

    const { error } = await query;

    if (error) {
      console.log(`✗ erro ao atualizar ${email}: ${error.message}`);
      detalhesErros.push(`${email}: ${error.message}`);
      erros++;
    } else {
      console.log(`✓ plano Plus atribuido: ${email}`);
      atualizados++;
    }
  }

  if (detalhesNaoEncontrados.length > 0) {
    console.log(`\nNao encontrados:`);
    for (const email of detalhesNaoEncontrados) console.log(`- ${email}`);
  }

  if (detalhesErros.length > 0) {
    console.log(`\nErros:`);
    for (const erro of detalhesErros) console.log(`- ${erro}`);
  }

  console.log(`\n═══════════════════════════════`);
  console.log(`✓  Atualizados:       ${atualizados}`);
  console.log(`!  Não encontrados:   ${naoEncontrados}`);
  console.log(`✗  Erros:             ${erros}`);
  console.log(`═══════════════════════════════`);
}

fixPlusPlans();
