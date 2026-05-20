import {
  mapAdminUser,
  requireAdminRequest,
} from "@/lib/server/admin";

function normalizePage(value) {
  const page = Number.parseInt(String(value || "1"), 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

function normalizePerPage(value) {
  const perPage = Number.parseInt(String(value || "12"), 10);
  if (!Number.isFinite(perPage) || perPage <= 0) return 12;
  return Math.min(perPage, 24);
}

function normalizeQuery(value) {
  return String(value || "").trim().toLowerCase();
}

const runCountQuery = async (queryPromise) => {
  try {
    const { count, error } = await queryPromise;
    if (error) {
      console.error("Erro na query de contagem:", error);
      return 0;
    }
    return count || 0;
  } catch (err) {
    console.error("Exception na query de contagem:", err);
    return 0;
  }
};

export async function GET(request) {
  const context = await requireAdminRequest(request);
  if (context.response) return context.response;

  try {
    const { searchParams } = new URL(request.url);
    const page = normalizePage(searchParams.get("page"));
    const perPage = normalizePerPage(searchParams.get("perPage"));
    const query = normalizeQuery(searchParams.get("q"));

    // 1. Paginar e buscar na tabela profiles
    let queryBuilder = context.serviceSupabase
      .from("profiles")
      .select("id, full_name, email, plan, created_at, updated_at", { count: "exact" });

    if (query) {
      queryBuilder = queryBuilder.or(`email.ilike.%${query}%,full_name.ilike.%${query}%`);
    }

    queryBuilder = queryBuilder.order("created_at", { ascending: false });

    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage - 1;
    queryBuilder = queryBuilder.range(startIndex, endIndex);

    const { data: profilesList, count: totalProfiles, error: queryError } = await queryBuilder;
    if (queryError) throw queryError;

    const total = totalProfiles || 0;
    const totalPages = total > 0 ? Math.ceil(total / perPage) : 1;
    const currentPage = Math.min(page, totalPages);

    let users = [];
    if (profilesList && profilesList.length > 0) {
      const userIds = profilesList.map((p) => p.id);

      // Buscar os dados de auth do Supabase em lote
      const { data: authRecords, error: authError } = await context.serviceSupabase
        .schema("auth")
        .from("users")
        .select("id, email, email_confirmed_at, last_sign_in_at, banned_until, created_at, raw_user_meta_data")
        .in("id", userIds);

      if (authError) throw authError;

      const authMap = new Map(
        (authRecords || []).map((r) => [
          r.id,
          {
            id: r.id,
            email: r.email,
            email_confirmed_at: r.email_confirmed_at,
            last_sign_in_at: r.last_sign_in_at,
            banned_until: r.banned_until,
            created_at: r.created_at,
            user_metadata: r.raw_user_meta_data || {},
          },
        ])
      );

      users = profilesList.map((profile) => {
        const authUser = authMap.get(profile.id) || {
          id: profile.id,
          email: profile.email || "",
          user_metadata: { full_name: profile.full_name },
        };
        return mapAdminUser(authUser, profile);
      });
    }

    // 2. Executar contagens de estatísticas em paralelo
    const [
      totalUsers,
      activeToday,
      activeThisWeek,
      disabledUsers,
      neverLoggedIn
    ] = await Promise.all([
      runCountQuery(context.serviceSupabase.from("profiles").select("id", { count: "exact", head: true })),
      runCountQuery(
        context.serviceSupabase
          .schema("auth")
          .from("users")
          .select("id", { count: "exact", head: true })
          .gt("last_sign_in_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      ),
      runCountQuery(
        context.serviceSupabase
          .schema("auth")
          .from("users")
          .select("id", { count: "exact", head: true })
          .gt("last_sign_in_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      ),
      runCountQuery(
        context.serviceSupabase
          .schema("auth")
          .from("users")
          .select("id", { count: "exact", head: true })
          .gt("banned_until", new Date().toISOString())
      ),
      runCountQuery(
        context.serviceSupabase
          .schema("auth")
          .from("users")
          .select("id", { count: "exact", head: true })
          .is("last_sign_in_at", null)
      ),
    ]);

    const stats = {
      totalUsers,
      activeToday,
      activeThisWeek,
      disabledUsers,
      neverLoggedIn,
    };

    return Response.json({
      users,
      stats,
      pagination: {
        page: currentPage,
        perPage,
        total,
        totalPages,
        hasPreviousPage: currentPage > 1,
        hasNextPage: currentPage < totalPages,
      },
      query,
    });
  } catch (error) {
    return Response.json(
      { error: error.message || "Falha ao carregar usuários." },
      { status: 500 }
    );
  }
}
