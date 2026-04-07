"use client";

import { createContext, useContext, useState, useEffect } from "react";

export const LANGUAGES = [
  { code: "pt", label: "Português", flag: "🇧🇷" },
  { code: "en", label: "English",   flag: "🇺🇸" },
  { code: "es", label: "Español",   flag: "🇪🇸" },
];

const translations = {
  pt: {
    // Nav
    nav_dashboard:     "Dashboard",
    nav_series:        "Plano de Série",
    nav_study:         "Estudo e Contexto",
    nav_builder:       "Estrutura do Sermão",
    nav_illustrations: "Ilustrações",
    nav_application:   "Aplicações",
    nav_final:         "Sermão Final",
    nav_chat:          "Pastor Rhema",
    nav_support:       "Suporte",
    nav_admin:         "Admin",
    nav_signout:       "Sair",
    nav_upgrade_title: "Upgrade para Plus",
    nav_upgrade_desc:  "Acesse séries, estudo bíblico, estrutura de sermão e muito mais.",
    nav_upgrade_btn:   "Ver planos →",

    // Plan badges
    plan_simple: "SIMPLES",
    plan_plus:   "✦ PLUS",

    // Upgrade wall
    upgrade_title:     "Recurso Plus",
    upgrade_desc:      "O fluxo completo de preparo de sermões está disponível no plano Rhema Plus.",
    upgrade_chat_btn:  "Usar Pastor Rhema Chat",
    upgrade_plan_btn:  "Fazer Upgrade →",

    // Login
    login_signin_title:    "Entre na sua conta",
    login_signup_title:    "Crie sua conta",
    login_signin_subtitle: "Bem-vindo de volta, pastor.",
    login_signup_subtitle: "Comece a preparar sermões melhores hoje.",
    login_name:            "Seu nome",
    login_name_ph:         "Nome completo",
    login_email:           "Email",
    login_password:        "Senha",
    login_loading:         "Aguardando...",
    login_signup_btn:      "Criar Conta",
    login_signin_btn:      "Entrar",
    login_have_account:    "Já tem uma conta? ",
    login_no_account:      "Não tem conta ainda? ",
    login_goto_signin:     "Faça login",
    login_goto_signup:     "Crie uma agora",
    login_security:        "🔒 Seus dados são protegidos com criptografia Supabase.",
    login_redirecting:     "Redirecionando...",
    login_check_email:     "Verifique seu email para confirmar o cadastro.",
    login_err_credentials: "Email ou senha incorretos.",
    login_err_registered:  "Email já cadastrado.",
    login_err_name:        "Insira seu nome.",

    // Chat
    chat_title:       "Pastor Rhema",
    chat_subtitle:    "Seu assistente pastoral — sermões, estudo bíblico, planejamento de séries",
    chat_new:         "Novo Chat",
    chat_placeholder: "Pergunte sobre um sermão, passagem ou plano de série... (Enter para enviar)",
    chat_send:        "Enviar",
    chat_welcome:     "Olá, sou o Pastor Rhema. O que você está preparando hoje — um sermão, estudo bíblico ou precisa de ajuda com uma passagem específica?",
    chat_limit_bar:   "mensagens restantes hoje",
    chat_limit_zero:  "Limite diário atingido",
    chat_limit_low:   "Poucas mensagens restantes",
    chat_limit_title: "Limite diário atingido",
    chat_limit_desc:  "Você usou suas 20 mensagens de hoje no plano Simple. Volte amanhã ou faça upgrade para conversar sem limites.",
    chat_upgrade_btn: "Fazer Upgrade →",
    chat_home_btn:    "Voltar ao início",

    // Support
    support_title:         "Suporte",
    support_subtitle:      "Seus tickets de atendimento",
    support_new:           "+ Novo",
    support_empty:         "Nenhum ticket aberto ainda.",
    support_loading:       "Carregando...",
    support_select:        "Selecione um ticket para ver a conversa",
    support_new_title:     "Abrir Novo Ticket",
    support_subject:       "Assunto",
    support_subject_ph:    "Ex: Não consigo acessar o Sermon Builder",
    support_message:       "Mensagem",
    support_message_ph:    "Descreva sua dúvida ou problema com detalhes...",
    support_send_btn:      "Abrir Ticket",
    support_sending:       "Enviando...",
    support_cancel:        "Cancelar",
    support_reply_ph:      "Escreva sua resposta...",
    support_send_reply:    "Enviar",
    support_closed_msg:    "Este ticket foi resolvido e encerrado.",
    support_opened_on:     "Aberto em",
    support_rhema_support: "Suporte Rhema",

    // Status
    status_open:        "Aberto",
    status_in_progress: "Em andamento",
    status_closed:      "Resolvido",

    // Admin
    admin_title:        "Painel Admin",
    admin_subtitle:     "Gerencie os tickets de suporte",
    admin_filter_all:   "Todos",
    admin_filter_open:  "Abertos",
    admin_filter_prog:  "Andamento",
    admin_filter_closed:"Resolvidos",
    admin_select:       "Selecione um ticket para responder",
    admin_empty:        "Nenhum ticket nesta categoria.",
    admin_reply_ph:     "Escreva sua resposta como suporte...",
    admin_reply_btn:    "Responder",
    admin_set_progress: "Em andamento",
    admin_set_closed:   "Resolver",
    admin_set_open:     "Reabrir",

    // Common
    common_loading: "Carregando...",
  },

  en: {
    nav_dashboard:     "Dashboard",
    nav_series:        "Series Plan",
    nav_study:         "Study & Context",
    nav_builder:       "Sermon Structure",
    nav_illustrations: "Illustrations",
    nav_application:   "Applications",
    nav_final:         "Final Sermon",
    nav_chat:          "Pastor Rhema",
    nav_support:       "Support",
    nav_admin:         "Admin",
    nav_signout:       "Sign out",
    nav_upgrade_title: "Upgrade to Plus",
    nav_upgrade_desc:  "Access series planning, Bible study, sermon structure and much more.",
    nav_upgrade_btn:   "See plans →",

    plan_simple: "SIMPLE",
    plan_plus:   "✦ PLUS",

    upgrade_title:     "Plus Feature",
    upgrade_desc:      "The full sermon preparation flow is available on the Rhema Plus plan.",
    upgrade_chat_btn:  "Use Pastor Rhema Chat",
    upgrade_plan_btn:  "Upgrade →",

    login_signin_title:    "Sign in to your account",
    login_signup_title:    "Create your account",
    login_signin_subtitle: "Welcome back, pastor.",
    login_signup_subtitle: "Start preparing better sermons today.",
    login_name:            "Your name",
    login_name_ph:         "Full name",
    login_email:           "Email",
    login_password:        "Password",
    login_loading:         "Please wait...",
    login_signup_btn:      "Create Account",
    login_signin_btn:      "Sign In",
    login_have_account:    "Already have an account? ",
    login_no_account:      "Don't have an account? ",
    login_goto_signin:     "Sign in",
    login_goto_signup:     "Create one now",
    login_security:        "🔒 Your data is protected with Supabase encryption.",
    login_redirecting:     "Redirecting...",
    login_check_email:     "Check your email to confirm your account.",
    login_err_credentials: "Incorrect email or password.",
    login_err_registered:  "This email is already registered.",
    login_err_name:        "Please enter your name.",

    chat_title:       "Pastor Rhema",
    chat_subtitle:    "Your AI pastoral assistant — sermons, Bible study, series planning",
    chat_new:         "New Chat",
    chat_placeholder: "Ask about a sermon, passage, or series plan... (Enter to send)",
    chat_send:        "Send",
    chat_welcome:     "Hi, I'm Pastor Rhema. What are you preparing today — a sermon, a Bible study, or help with a specific passage?",
    chat_limit_bar:   "messages remaining today",
    chat_limit_zero:  "Daily limit reached",
    chat_limit_low:   "Few messages remaining",
    chat_limit_title: "Daily limit reached",
    chat_limit_desc:  "You've used your 20 messages for today on the Simple plan. Come back tomorrow or upgrade for unlimited conversations.",
    chat_upgrade_btn: "Upgrade →",
    chat_home_btn:    "Back to home",

    support_title:         "Support",
    support_subtitle:      "Your support tickets",
    support_new:           "+ New",
    support_empty:         "No open tickets yet.",
    support_loading:       "Loading...",
    support_select:        "Select a ticket to view the conversation",
    support_new_title:     "Open New Ticket",
    support_subject:       "Subject",
    support_subject_ph:    "e.g. I can't access the Sermon Builder",
    support_message:       "Message",
    support_message_ph:    "Describe your question or issue in detail...",
    support_send_btn:      "Open Ticket",
    support_sending:       "Sending...",
    support_cancel:        "Cancel",
    support_reply_ph:      "Write your reply...",
    support_send_reply:    "Send",
    support_closed_msg:    "This ticket has been resolved and closed.",
    support_opened_on:     "Opened on",
    support_rhema_support: "Rhema Support",

    status_open:        "Open",
    status_in_progress: "In Progress",
    status_closed:      "Resolved",

    admin_title:         "Admin Panel",
    admin_subtitle:      "Manage support tickets",
    admin_filter_all:    "All",
    admin_filter_open:   "Open",
    admin_filter_prog:   "In Progress",
    admin_filter_closed: "Resolved",
    admin_select:        "Select a ticket to reply",
    admin_empty:         "No tickets in this category.",
    admin_reply_ph:      "Write your reply as support...",
    admin_reply_btn:     "Reply",
    admin_set_progress:  "In Progress",
    admin_set_closed:    "Resolve",
    admin_set_open:      "Reopen",

    common_loading: "Loading...",
  },

  es: {
    nav_dashboard:     "Panel",
    nav_series:        "Plan de Serie",
    nav_study:         "Estudio y Contexto",
    nav_builder:       "Estructura del Sermón",
    nav_illustrations: "Ilustraciones",
    nav_application:   "Aplicaciones",
    nav_final:         "Sermón Final",
    nav_chat:          "Pastor Rhema",
    nav_support:       "Soporte",
    nav_admin:         "Admin",
    nav_signout:       "Cerrar sesión",
    nav_upgrade_title: "Mejorar a Plus",
    nav_upgrade_desc:  "Accede a series, estudio bíblico, estructura de sermón y mucho más.",
    nav_upgrade_btn:   "Ver planes →",

    plan_simple: "BÁSICO",
    plan_plus:   "✦ PLUS",

    upgrade_title:     "Función Plus",
    upgrade_desc:      "El flujo completo de preparación de sermones está disponible en el plan Rhema Plus.",
    upgrade_chat_btn:  "Usar Pastor Rhema Chat",
    upgrade_plan_btn:  "Mejorar →",

    login_signin_title:    "Inicia sesión",
    login_signup_title:    "Crea tu cuenta",
    login_signin_subtitle: "Bienvenido de nuevo, pastor.",
    login_signup_subtitle: "Empieza a preparar mejores sermones hoy.",
    login_name:            "Tu nombre",
    login_name_ph:         "Nombre completo",
    login_email:           "Correo electrónico",
    login_password:        "Contraseña",
    login_loading:         "Espere...",
    login_signup_btn:      "Crear Cuenta",
    login_signin_btn:      "Entrar",
    login_have_account:    "¿Ya tienes cuenta? ",
    login_no_account:      "¿No tienes cuenta? ",
    login_goto_signin:     "Inicia sesión",
    login_goto_signup:     "Créala ahora",
    login_security:        "🔒 Tus datos están protegidos con cifrado Supabase.",
    login_redirecting:     "Redirigiendo...",
    login_check_email:     "Revisa tu correo para confirmar tu cuenta.",
    login_err_credentials: "Correo o contraseña incorrectos.",
    login_err_registered:  "Este correo ya está registrado.",
    login_err_name:        "Por favor ingresa tu nombre.",

    chat_title:       "Pastor Rhema",
    chat_subtitle:    "Tu asistente pastoral con IA — sermones, estudio bíblico, planificación de series",
    chat_new:         "Nuevo Chat",
    chat_placeholder: "Pregunta sobre un sermón, pasaje o plan de serie... (Enter para enviar)",
    chat_send:        "Enviar",
    chat_welcome:     "Hola, soy el Pastor Rhema. ¿Qué estás preparando hoy — un sermón, un estudio bíblico, o necesitas ayuda con un pasaje específico?",
    chat_limit_bar:   "mensajes restantes hoy",
    chat_limit_zero:  "Límite diario alcanzado",
    chat_limit_low:   "Pocos mensajes restantes",
    chat_limit_title: "Límite diario alcanzado",
    chat_limit_desc:  "Usaste tus 20 mensajes de hoy en el plan Básico. Vuelve mañana o mejora tu plan para conversar sin límites.",
    chat_upgrade_btn: "Mejorar →",
    chat_home_btn:    "Volver al inicio",

    support_title:         "Soporte",
    support_subtitle:      "Tus tickets de atención",
    support_new:           "+ Nuevo",
    support_empty:         "Aún no hay tickets abiertos.",
    support_loading:       "Cargando...",
    support_select:        "Selecciona un ticket para ver la conversación",
    support_new_title:     "Abrir Nuevo Ticket",
    support_subject:       "Asunto",
    support_subject_ph:    "Ej: No puedo acceder al Sermon Builder",
    support_message:       "Mensaje",
    support_message_ph:    "Describe tu pregunta o problema con detalles...",
    support_send_btn:      "Abrir Ticket",
    support_sending:       "Enviando...",
    support_cancel:        "Cancelar",
    support_reply_ph:      "Escribe tu respuesta...",
    support_send_reply:    "Enviar",
    support_closed_msg:    "Este ticket ha sido resuelto y cerrado.",
    support_opened_on:     "Abierto el",
    support_rhema_support: "Soporte Rhema",

    status_open:        "Abierto",
    status_in_progress: "En progreso",
    status_closed:      "Resuelto",

    admin_title:         "Panel Admin",
    admin_subtitle:      "Gestiona los tickets de soporte",
    admin_filter_all:    "Todos",
    admin_filter_open:   "Abiertos",
    admin_filter_prog:   "En Progreso",
    admin_filter_closed: "Resueltos",
    admin_select:        "Selecciona un ticket para responder",
    admin_empty:         "No hay tickets en esta categoría.",
    admin_reply_ph:      "Escribe tu respuesta como soporte...",
    admin_reply_btn:     "Responder",
    admin_set_progress:  "En Progreso",
    admin_set_closed:    "Resolver",
    admin_set_open:      "Reabrir",

    common_loading: "Cargando...",
  },
};

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState("pt");

  useEffect(() => {
    const saved = localStorage.getItem("rhema_lang");
    if (saved && translations[saved]) setLang(saved);
  }, []);

  const changeLang = (code) => {
    setLang(code);
    localStorage.setItem("rhema_lang", code);
  };

  const t = (key) => translations[lang]?.[key] ?? translations.en[key] ?? key;

  return (
    <LanguageContext.Provider value={{ lang, changeLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside LanguageProvider");
  return ctx;
}
