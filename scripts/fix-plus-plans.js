import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const plusEmails = [
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
  console.log(`Buscando usuários no Supabase...\n`);

  // Monta mapa email → id varrendo todas as páginas
  const emailToId = {};
  let page = 1;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error || !data?.users?.length) break;
    for (const u of data.users) emailToId[u.email.toLowerCase()] = u.id;
    if (data.users.length < 1000) break;
    page++;
  }

  let atualizados = 0;
  let naoEncontrados = 0;
  let erros = 0;

  for (const email of plusEmails) {
    const userId = emailToId[email.toLowerCase()];

    if (!userId) {
      console.log(`! não encontrado: ${email}`);
      naoEncontrados++;
      continue;
    }

    const { error } = await supabase
      .from("profiles")
      .update({ plan: "plus" })
      .eq("id", userId);

    if (error) {
      console.log(`✗ erro ao atualizar ${email}: ${error.message}`);
      erros++;
    } else {
      console.log(`✓ plano Plus atribuído: ${email}`);
      atualizados++;
    }
  }

  console.log(`\n═══════════════════════════════`);
  console.log(`✓  Atualizados:       ${atualizados}`);
  console.log(`!  Não encontrados:   ${naoEncontrados}`);
  console.log(`✗  Erros:             ${erros}`);
  console.log(`═══════════════════════════════`);
}

fixPlusPlans();
