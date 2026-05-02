"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/AppLayout";
import { Btn, Card, Loader, Notice, Pill } from "@/components/ui";
import { auth, profiles } from "@/lib/supabase_client";
import { useLanguage } from "@/lib/i18n";

const HELP_CONTENT = {
  pt: {
    eyebrow: "Central de Ajuda",
    title: "Como usar o Pastor Rhema passo a passo",
    subtitle: "Aprenda o caminho certo para preparar sermões, estudar a Bíblia, usar o chat pastoral e cuidar da sua conta sem sair do app.",
    startTitle: "Comece por aqui",
    quickTitle: "Acesso rápido",
    guideTitle: "Passo a passo por funcionalidade",
    faqTitle: "Dúvidas rápidas",
    supportTitle: "Ainda precisa de ajuda?",
    supportText: "Se algo não funcionar como esperado, envie uma mensagem para o suporte com seu email de acesso e o que estava tentando fazer.",
    supportButton: "Falar com suporte",
    planLabel: "Seu plano",
    plusOnly: "Plus",
    allPlans: "Todos",
    backDashboard: "Ir para o Dashboard",
    openChat: "Abrir Chat",
    start: [
      {
        title: "Entre com seu email cadastrado",
        text: "Use o mesmo email informado no cadastro. Se esqueceu a senha, use a recuperação na tela de login.",
      },
      {
        title: "Confira seu plano",
        text: "Usuários Simple acessam Chat, Bíblia, Gabinete Pastoral e Perfil. Usuários Plus também acessam o fluxo completo de sermões.",
      },
      {
        title: "Crie uma série se for preparar sermões",
        text: "No plano Plus, comece pelo Plano de Série. Depois siga as etapas Estudo, Estrutura, Ilustrações, Aplicações e Sermão Final.",
      },
    ],
    quick: [
      { title: "Quero preparar um sermão", text: "Crie uma série e siga o fluxo guiado da semana atual.", href: "/series", plan: "plus" },
      { title: "Quero tirar uma dúvida bíblica", text: "Use o Pastor Rhema Chat para uma conversa livre com IA.", href: "/chat", plan: "all" },
      { title: "Quero ler e anotar a Bíblia", text: "Abra a Bíblia Interativa, selecione versículos e salve notas.", href: "/bible", plan: "all" },
      { title: "Quero uma orientação pastoral", text: "Use o Gabinete Pastoral para conforto ou aconselhamento.", href: "/pastoral", plan: "all" },
    ],
    guides: [
      {
        id: "acesso",
        title: "Acesso, senha e perfil",
        steps: [
          "Acesse o app e faça login com seu email e senha.",
          "Se não lembrar a senha, clique em Esqueceu a senha? e siga o link recebido por email.",
          "Entre em Meu Perfil para alterar nome exibido e senha.",
          "O email da conta fica bloqueado por segurança e não é alterado nessa tela.",
        ],
      },
      {
        id: "series",
        title: "Criar uma série de sermões",
        plan: "plus",
        steps: [
          "Abra Plano de Série.",
          "Informe tema ou livro bíblico, número de semanas, público, tom e objetivo.",
          "Clique em gerar série.",
          "Revise o nome da série, o resumo e as semanas criadas.",
          "Clique para iniciar a semana atual pelo Estudo e Contexto.",
        ],
      },
      {
        id: "fluxo",
        title: "Preparar o sermão da semana",
        plan: "plus",
        steps: [
          "Comece em Estudo e Contexto para receber base bíblica, contexto, termos-chave e referências cruzadas.",
          "Siga para Estrutura do Sermão para escolher título, editar grande ideia e aprovar os três pontos.",
          "Abra Ilustrações para gerar histórias e exemplos para cada ponto.",
          "Use Aplicações para transformar os pontos em ações práticas e perguntas de reflexão.",
          "Finalize em Sermão Final, revise, edite, copie, imprima em PDF ou baixe em Word.",
        ],
      },
      {
        id: "dashboard",
        title: "Acompanhar progresso no Dashboard",
        plan: "plus",
        steps: [
          "Use o Dashboard para ver a semana atual da série ativa.",
          "Confira a barra de progresso e o próximo passo sugerido.",
          "Quando todas as etapas estiverem prontas, marque a semana como concluída.",
          "O sistema salva o sermão em Meus Sermões e avança para a próxima semana.",
        ],
      },
      {
        id: "sermoes",
        title: "Consultar sermões salvos",
        plan: "plus",
        steps: [
          "Abra Meus Sermões.",
          "Use a busca para encontrar sermões por título, passagem, série ou conteúdo.",
          "Filtre por todos, pregados ou planejados.",
          "Abra um sermão pregado para revisar o preview ou copiar o texto.",
        ],
      },
      {
        id: "chat",
        title: "Usar o Pastor Rhema Chat",
        steps: [
          "Abra Pastor Rhema Chat.",
          "Digite sua pergunta sobre sermão, passagem, série, estudo ou aplicação.",
          "Use Enter para enviar ou Shift + Enter para quebrar linha.",
          "Abra conversas antigas no histórico lateral quando quiser continuar um assunto.",
          "Use Novo Chat para começar outro tema.",
        ],
      },
      {
        id: "bible",
        title: "Usar a Bíblia Interativa",
        steps: [
          "Abra Bíblia Interativa.",
          "Escolha livro e capítulo ou pesquise uma referência como João 3:16.",
          "Clique em um versículo para selecionar; use Shift + clique para selecionar um intervalo.",
          "Escreva sua nota, escolha uma cor e salve.",
          "Use Aprofundar para receber contexto, ideias-chave, referências e aplicações da passagem.",
        ],
      },
      {
        id: "pastoral",
        title: "Usar o Gabinete Pastoral",
        steps: [
          "Abra Gabinete Pastoral.",
          "Escolha Conforto se você precisa de encorajamento pessoal.",
          "Escolha Aconselhamento para preparar uma resposta pastoral a alguém.",
          "Descreva a situação com clareza e, se quiser, escolha uma categoria.",
          "Copie o resultado e adapte com sua voz pastoral antes de enviar ou falar.",
        ],
      },
    ],
    faqs: [
      {
        q: "Por que algumas áreas aparecem bloqueadas?",
        a: "As áreas de criação de série e fluxo completo de sermão fazem parte do plano Plus. Usuários Simple continuam com acesso ao Chat, Bíblia, Gabinete Pastoral e Perfil.",
      },
      {
        q: "O sistema substitui o preparo pastoral?",
        a: "Não. Ele organiza, acelera e sugere caminhos. O pastor continua responsável por discernimento, oração, revisão bíblica e aplicação ao contexto da igreja.",
      },
      {
        q: "Posso editar o que a IA gerou?",
        a: "Sim. A estrutura, aplicações e sermão final podem ser ajustados. As principais etapas também guardam versões para restaurar ou comparar.",
      },
      {
        q: "Onde encontro ajuda humana?",
        a: "Use o botão Falar com suporte nesta página ou o link Suporte no menu lateral.",
      },
    ],
  },
  en: {
    eyebrow: "Help Center",
    title: "How to use Pastor Rhema step by step",
    subtitle: "Learn how to prepare sermons, study Scripture, use pastoral chat, and manage your account inside the app.",
    startTitle: "Start here",
    quickTitle: "Quick access",
    guideTitle: "Step-by-step guides",
    faqTitle: "Quick questions",
    supportTitle: "Still need help?",
    supportText: "If something does not work as expected, contact support with your account email and what you were trying to do.",
    supportButton: "Contact support",
    planLabel: "Your plan",
    plusOnly: "Plus",
    allPlans: "All",
    backDashboard: "Go to Dashboard",
    openChat: "Open Chat",
    start: [
      { title: "Sign in with your registered email", text: "Use the same email provided during registration. If needed, reset your password from the login screen." },
      { title: "Check your plan", text: "Simple users access Chat, Bible, Pastoral Office, and Profile. Plus users also access the full sermon flow." },
      { title: "Create a series for sermon preparation", text: "On Plus, begin with Series Plan, then follow Study, Builder, Illustrations, Applications, and Final Sermon." },
    ],
    quick: [
      { title: "Prepare a sermon", text: "Create a series and follow the guided flow for the current week.", href: "/series", plan: "plus" },
      { title: "Ask a Bible question", text: "Use Pastor Rhema Chat for open-ended AI assistance.", href: "/chat", plan: "all" },
      { title: "Read and annotate Scripture", text: "Open the Interactive Bible, select verses, and save notes.", href: "/bible", plan: "all" },
      { title: "Prepare pastoral guidance", text: "Use the Pastoral Office for comfort or counsel.", href: "/pastoral", plan: "all" },
    ],
    guides: [
      { id: "access", title: "Access, password, and profile", steps: ["Sign in with your email and password.", "Use Forgot password if you need a reset link.", "Open My Profile to change your display name or password.", "Your email is locked for security and cannot be changed there."] },
      { id: "series", title: "Create a sermon series", plan: "plus", steps: ["Open Series Plan.", "Fill in theme, weeks, audience, tone, and goal.", "Generate the series.", "Review the overview and weekly plan.", "Start the current week in Study & Context."] },
      { id: "flow", title: "Prepare this week's sermon", plan: "plus", steps: ["Generate Study & Context.", "Build the Sermon Structure and approve title, big idea, and points.", "Generate and edit Illustrations.", "Generate practical Applications.", "Review, edit, copy, print, or download the Final Sermon."] },
      { id: "dashboard", title: "Track progress on the Dashboard", plan: "plus", steps: ["Use the Dashboard to see the active week.", "Follow the progress bar and next suggested step.", "Mark the week complete when all steps are ready.", "The sermon is saved in My Sermons and the series advances."] },
      { id: "sermons", title: "Find saved sermons", plan: "plus", steps: ["Open My Sermons.", "Search by title, passage, series, or content.", "Filter by all, preached, or planned.", "Preview or copy preached sermons."] },
      { id: "chat", title: "Use Pastor Rhema Chat", steps: ["Open Pastor Rhema Chat.", "Ask about sermons, passages, series, studies, or applications.", "Press Enter to send or Shift + Enter for a line break.", "Open older conversations from the history panel.", "Use New Chat for another topic."] },
      { id: "bible", title: "Use the Interactive Bible", steps: ["Open the Interactive Bible.", "Choose a book and chapter or search a reference.", "Click a verse; use Shift + click for a range.", "Write a note, choose a color, and save.", "Use Deepen for context, key ideas, references, and applications."] },
      { id: "pastoral", title: "Use the Pastoral Office", steps: ["Open Pastoral Office.", "Choose Comfort for personal encouragement.", "Choose Counsel to prepare a pastoral response.", "Describe the situation clearly.", "Copy and adapt the result with your own pastoral voice."] },
    ],
    faqs: [
      { q: "Why are some areas locked?", a: "Series planning and the full sermon preparation flow are Plus features. Simple users still have Chat, Bible, Pastoral Office, and Profile." },
      { q: "Does the system replace pastoral preparation?", a: "No. It organizes and accelerates preparation. The pastor remains responsible for prayer, discernment, biblical review, and contextual application." },
      { q: "Can I edit AI-generated content?", a: "Yes. Structure, applications, and the final sermon can be edited. Main steps also keep versions for restore and comparison." },
      { q: "Where do I get human help?", a: "Use Contact support on this page or Support in the side menu." },
    ],
  },
  es: {
    eyebrow: "Centro de Ayuda",
    title: "Cómo usar Pastor Rhema paso a paso",
    subtitle: "Aprende a preparar sermones, estudiar la Biblia, usar el chat pastoral y cuidar tu cuenta dentro de la app.",
    startTitle: "Empieza aquí",
    quickTitle: "Acceso rápido",
    guideTitle: "Guías paso a paso",
    faqTitle: "Preguntas rápidas",
    supportTitle: "¿Aún necesitas ayuda?",
    supportText: "Si algo no funciona como esperabas, contacta al soporte con tu correo de acceso y lo que estabas intentando hacer.",
    supportButton: "Contactar soporte",
    planLabel: "Tu plan",
    plusOnly: "Plus",
    allPlans: "Todos",
    backDashboard: "Ir al Panel",
    openChat: "Abrir Chat",
    start: [
      { title: "Entra con tu correo registrado", text: "Usa el mismo correo informado en el registro. Si olvidaste la contraseña, usa la recuperación en la pantalla de login." },
      { title: "Confirma tu plan", text: "Simple libera Chat, Biblia, Gabinete Pastoral y Perfil. Plus también libera el flujo completo de sermones." },
      { title: "Crea una serie para preparar sermones", text: "En Plus, empieza por Plan de Serie y sigue Estudio, Estructura, Ilustraciones, Aplicaciones y Sermón Final." },
    ],
    quick: [
      { title: "Preparar un sermón", text: "Crea una serie y sigue el flujo guiado de la semana actual.", href: "/series", plan: "plus" },
      { title: "Hacer una pregunta bíblica", text: "Usa Pastor Rhema Chat para conversar libremente con IA.", href: "/chat", plan: "all" },
      { title: "Leer y anotar la Biblia", text: "Abre la Biblia Interactiva, selecciona versículos y guarda notas.", href: "/bible", plan: "all" },
      { title: "Preparar orientación pastoral", text: "Usa el Gabinete Pastoral para consuelo o aconsejamiento.", href: "/pastoral", plan: "all" },
    ],
    guides: [
      { id: "acceso", title: "Acceso, contraseña y perfil", steps: ["Entra con tu correo y contraseña.", "Usa Olvidé mi contraseña si necesitas un enlace de recuperación.", "Abre Mi Perfil para cambiar tu nombre o contraseña.", "El correo queda bloqueado por seguridad y no se cambia allí."] },
      { id: "series", title: "Crear una serie de sermones", plan: "plus", steps: ["Abre Plan de Serie.", "Completa tema, semanas, público, tono y objetivo.", "Genera la serie.", "Revisa el resumen y las semanas.", "Inicia la semana actual en Estudio y Contexto."] },
      { id: "flujo", title: "Preparar el sermón de la semana", plan: "plus", steps: ["Genera Estudio y Contexto.", "Construye la Estructura del Sermón y aprueba título, gran idea y puntos.", "Genera y edita Ilustraciones.", "Genera Aplicaciones prácticas.", "Revisa, edita, copia, imprime o descarga el Sermón Final."] },
      { id: "dashboard", title: "Acompañar el progreso en el Panel", plan: "plus", steps: ["Usa el Panel para ver la semana activa.", "Sigue la barra de progreso y el próximo paso sugerido.", "Marca la semana como concluida cuando todo esté listo.", "El sermón se guarda en Mis Sermones y la serie avanza."] },
      { id: "sermones", title: "Consultar sermones guardados", plan: "plus", steps: ["Abre Mis Sermones.", "Busca por título, pasaje, serie o contenido.", "Filtra por todos, predicados o planeados.", "Previsualiza o copia sermones predicados."] },
      { id: "chat", title: "Usar Pastor Rhema Chat", steps: ["Abre Pastor Rhema Chat.", "Pregunta sobre sermones, pasajes, series, estudios o aplicaciones.", "Presiona Enter para enviar o Shift + Enter para nueva línea.", "Abre conversaciones antiguas desde el historial.", "Usa Nuevo Chat para otro tema."] },
      { id: "biblia", title: "Usar la Biblia Interactiva", steps: ["Abre Biblia Interactiva.", "Elige libro y capítulo o busca una referencia.", "Haz clic en un versículo; usa Shift + clic para intervalo.", "Escribe una nota, elige color y guarda.", "Usa Profundizar para contexto, ideas clave, referencias y aplicaciones."] },
      { id: "pastoral", title: "Usar el Gabinete Pastoral", steps: ["Abre Gabinete Pastoral.", "Elige Consuelo para ánimo personal.", "Elige Aconsejamiento para preparar una respuesta pastoral.", "Describe la situación claramente.", "Copia y adapta el resultado con tu propia voz pastoral."] },
    ],
    faqs: [
      { q: "¿Por qué algunas áreas están bloqueadas?", a: "La planificación de series y el flujo completo de sermones son funciones Plus. Simple mantiene Chat, Biblia, Gabinete Pastoral y Perfil." },
      { q: "¿El sistema reemplaza la preparación pastoral?", a: "No. Organiza y acelera la preparación. El pastor sigue responsable por oración, discernimiento, revisión bíblica y aplicación contextual." },
      { q: "¿Puedo editar lo que generó la IA?", a: "Sí. La estructura, las aplicaciones y el sermón final pueden editarse. Las etapas principales también guardan versiones." },
      { q: "¿Dónde recibo ayuda humana?", a: "Usa Contactar soporte en esta página o Soporte en el menú lateral." },
    ],
  },
};

function StepNumber({ children }) {
  return (
    <span className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-full bg-brand-primary text-[13px] font-extrabold text-white">
      {children}
    </span>
  );
}

export default function HelpPage() {
  const router = useRouter();
  const { lang, t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  const content = HELP_CONTENT[lang] || HELP_CONTENT.pt;
  const isPlus = profile?.plan === "plus";
  const availableQuickLinks = useMemo(() => (
    content.quick.filter((item) => item.plan !== "plus" || isPlus)
  ), [content.quick, isPlus]);

  useEffect(() => {
    let active = true;

    async function loadHelpPage() {
      try {
        const session = await auth.getSession();
        if (!session) {
          router.push("/login");
          return;
        }

        const user = await auth.getUser();
        if (!user) {
          router.push("/login");
          return;
        }

        const currentProfile = await profiles.getProfile(user.id);
        if (active) setProfile(currentProfile);
      } catch (error) {
        console.error("Erro ao carregar ajuda:", error);
        if (active) router.push("/login");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadHelpPage();

    return () => {
      active = false;
    };
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0b2a5b] to-[#163d7a]">
        <Loader text={t("common_loading")} />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <AppLayout profile={profile}>
      <div className="grid gap-[20px]">
        <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#0b2a5b] via-[#12366c] to-[#194987] p-[22px_18px] text-white shadow-brand-lg md:p-[30px]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,.16),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(202,161,74,.18),transparent_30%)]" />
          <div className="relative z-10 grid gap-[18px] md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <div className="inline-flex items-center gap-[8px] rounded-full border border-white/10 bg-white/10 px-[12px] py-[6px] text-[11px] font-extrabold uppercase tracking-[.08em]">
                {content.eyebrow}
              </div>
              <h1 className="m-[16px_0_8px] max-w-[760px] font-serif text-[30px] leading-[1.08] tracking-[-.03em] md:text-[38px]">
                {content.title}
              </h1>
              <p className="m-0 max-w-[760px] text-[14px] leading-[1.7] text-white/72 md:text-[15px]">
                {content.subtitle}
              </p>
            </div>
            <div className="rounded-[18px] border border-white/10 bg-white/10 p-[14px] backdrop-blur-md">
              <p className="m-0 mb-[6px] text-[11px] font-extrabold uppercase tracking-[.08em] text-white/52">
                {content.planLabel}
              </p>
              <p className="m-0 text-[18px] font-black text-white">
                {isPlus ? t("plan_plus") : t("plan_simple")}
              </p>
            </div>
          </div>
        </section>

        <div className="grid gap-[20px] xl:grid-cols-[minmax(0,1fr)_320px]">
          <main className="grid gap-[20px]">
            <Card>
              <div className="mb-[16px] flex items-center justify-between gap-[12px]">
                <h2 className="m-0 font-serif text-[24px] text-brand-primary">
                  {content.startTitle}
                </h2>
                <Pill>{content.allPlans}</Pill>
              </div>
              <div className="grid gap-[12px] md:grid-cols-3">
                {content.start.map((item, index) => (
                  <div key={item.title} className="rounded-[18px] border border-brand-line bg-white p-[16px]">
                    <div className="mb-[12px]">
                      <StepNumber>{index + 1}</StepNumber>
                    </div>
                    <h3 className="m-0 mb-[8px] text-[16px] font-extrabold text-brand-primary">
                      {item.title}
                    </h3>
                    <p className="m-0 text-[13px] leading-[1.65] text-brand-muted">
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <h2 className="m-0 mb-[16px] font-serif text-[24px] text-brand-primary">
                {content.quickTitle}
              </h2>
              <div className="grid gap-[12px] md:grid-cols-2">
                {availableQuickLinks.map((item) => (
                  <div key={item.href} className="flex flex-col justify-between gap-[14px] rounded-[18px] border border-brand-line bg-white p-[16px]">
                    <div>
                      <div className="mb-[10px]">
                        <Pill className={item.plan === "plus" ? "bg-brand-amber-soft text-amber-800" : ""}>
                          {item.plan === "plus" ? content.plusOnly : content.allPlans}
                        </Pill>
                      </div>
                      <h3 className="m-0 mb-[7px] text-[17px] font-extrabold text-brand-primary">
                        {item.title}
                      </h3>
                      <p className="m-0 text-[13px] leading-[1.65] text-brand-muted">
                        {item.text}
                      </p>
                    </div>
                    <Btn variant="secondary" onClick={() => router.push(item.href)} className="w-full">
                      {item.title}
                    </Btn>
                  </div>
                ))}
              </div>
              {!isPlus && (
                <Notice color="gold" className="mb-0 mt-[14px]">
                  {t("upgrade_desc")}
                </Notice>
              )}
            </Card>

            <section className="grid gap-[14px]">
              <h2 className="m-0 font-serif text-[24px] text-brand-primary">
                {content.guideTitle}
              </h2>
              <nav aria-label={content.guideTitle} className="grid gap-[10px] md:grid-cols-2">
                {content.guides.map((guide, index) => (
                  <a
                    key={`${guide.id}-shortcut`}
                    href={`#${guide.id}`}
                    className="group flex min-h-[74px] items-center justify-between gap-[12px] rounded-[18px] border border-brand-line bg-white p-[14px] text-brand-text no-underline transition-colors hover:border-brand-primary/30 hover:bg-brand-surface-2"
                  >
                    <span className="flex min-w-0 items-center gap-[12px]">
                      <StepNumber>{index + 1}</StepNumber>
                      <span className="min-w-0">
                        <span className="block text-[15px] font-extrabold leading-[1.25] text-brand-primary">
                          {guide.title}
                        </span>
                        <span className="mt-[5px] inline-flex text-[11px] font-extrabold uppercase text-brand-muted">
                          {guide.plan === "plus" ? content.plusOnly : content.allPlans}
                        </span>
                      </span>
                    </span>
                    <span aria-hidden="true" className="shrink-0 text-[20px] font-black text-brand-muted transition-all group-hover:translate-x-[2px] group-hover:text-brand-primary">
                      →
                    </span>
                  </a>
                ))}
              </nav>
              {content.guides.map((guide) => (
                <Card key={guide.id} id={guide.id} className="scroll-mt-[90px]">
                  <div className="mb-[14px] flex flex-col gap-[10px] md:flex-row md:items-start md:justify-between">
                    <h3 className="m-0 font-serif text-[21px] text-brand-primary">
                      {guide.title}
                    </h3>
                    <Pill className={guide.plan === "plus" ? "bg-brand-amber-soft text-amber-800" : ""}>
                      {guide.plan === "plus" ? content.plusOnly : content.allPlans}
                    </Pill>
                  </div>
                  <ol className="m-0 grid list-none gap-[10px] p-0">
                    {guide.steps.map((step, index) => (
                      <li key={`${guide.id}-${index}`} className="flex gap-[12px] rounded-[14px] bg-brand-surface-2 p-[12px]">
                        <StepNumber>{index + 1}</StepNumber>
                        <p className="m-0 pt-[4px] text-[14px] leading-[1.65] text-brand-text">
                          {step}
                        </p>
                      </li>
                    ))}
                  </ol>
                </Card>
              ))}
            </section>

            <Card>
              <h2 className="m-0 mb-[16px] font-serif text-[24px] text-brand-primary">
                {content.faqTitle}
              </h2>
              <div className="grid gap-[12px] md:grid-cols-2">
                {content.faqs.map((item) => (
                  <div key={item.q} className="rounded-[18px] border border-brand-line bg-white p-[16px]">
                    <h3 className="m-0 mb-[8px] text-[15px] font-extrabold text-brand-primary">
                      {item.q}
                    </h3>
                    <p className="m-0 text-[13px] leading-[1.65] text-brand-muted">
                      {item.a}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </main>

          <aside className="grid content-start gap-[16px] xl:sticky xl:top-[90px]">
            <Card>
              <h2 className="m-0 mb-[12px] font-serif text-[20px] text-brand-primary">
                {content.guideTitle}
              </h2>
              <nav className="grid gap-[8px]">
                {content.guides.map((guide) => (
                  <a
                    key={guide.id}
                    href={`#${guide.id}`}
                    className="rounded-[12px] border border-brand-line bg-white px-[12px] py-[10px] text-[13px] font-bold text-brand-text no-underline transition-colors hover:border-brand-primary/30 hover:text-brand-primary"
                  >
                    {guide.title}
                  </a>
                ))}
              </nav>
            </Card>

            <Card>
              <h2 className="m-0 mb-[8px] font-serif text-[20px] text-brand-primary">
                {content.supportTitle}
              </h2>
              <p className="m-0 mb-[14px] text-[13px] leading-[1.65] text-brand-muted">
                {content.supportText}
              </p>
              <div className="grid gap-[10px]">
                <Btn onClick={() => window.location.href = "mailto:support@pastorrhema.com"} className="w-full">
                  {content.supportButton}
                </Btn>
                <Btn variant="secondary" onClick={() => router.push(isPlus ? "/dashboard" : "/chat")} className="w-full">
                  {isPlus ? content.backDashboard : content.openChat}
                </Btn>
              </div>
            </Card>
          </aside>
        </div>
      </div>
    </AppLayout>
  );
}
