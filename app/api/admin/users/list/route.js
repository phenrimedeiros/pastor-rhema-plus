import {
  getProfilesByUserIds,
  listAllAuthUsers,
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

function toTimestamp(value) {
  if (!value) return 0;

  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function compareUsersByActivity(a, b) {
  const lastSignInDiff = toTimestamp(b.lastSignInAt) - toTimestamp(a.lastSignInAt);
  if (lastSignInDiff !== 0) return lastSignInDiff;

  const createdAtDiff = toTimestamp(b.createdAt) - toTimestamp(a.createdAt);
  if (createdAtDiff !== 0) return createdAtDiff;

  return a.email.localeCompare(b.email, "pt-BR");
}

function matchesQuery(user, query) {
  if (!query) return true;

  const searchable = [
    user.email,
    user.fullName,
    user.plan,
    user.isAdmin ? "admin" : "",
    user.accessEnabled
      ? "habilitado enabled ativo active"
      : "desabilitado disabled bloqueado blocked inativo inactive",
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return searchable.includes(query);
}

function isWithinDays(value, days) {
  if (!value) return false;

  const timestamp = toTimestamp(value);
  if (!timestamp) return false;

  const diff = Date.now() - timestamp;
  return diff >= 0 && diff <= days * 24 * 60 * 60 * 1000;
}

function buildStats(users) {
  return {
    totalUsers: users.length,
    activeToday: users.filter((user) => isWithinDays(user.lastSignInAt, 1)).length,
    activeThisWeek: users.filter((user) => isWithinDays(user.lastSignInAt, 7)).length,
    neverLoggedIn: users.filter((user) => !user.lastSignInAt).length,
    disabledUsers: users.filter((user) => !user.accessEnabled).length,
  };
}

export async function GET(request) {
  const context = await requireAdminRequest(request);
  if (context.response) return context.response;

  try {
    const { searchParams } = new URL(request.url);
    const page = normalizePage(searchParams.get("page"));
    const perPage = normalizePerPage(searchParams.get("perPage"));
    const query = normalizeQuery(searchParams.get("q"));

    const authUsers = await listAllAuthUsers(context.serviceSupabase);
    const profilesById = await getProfilesByUserIds(
      context.serviceSupabase,
      authUsers.map((user) => user.id)
    );

    const mappedUsers = authUsers
      .map((authUser) => mapAdminUser(authUser, profilesById.get(authUser.id)))
      .sort(compareUsersByActivity);

    const stats = buildStats(mappedUsers);
    const filteredUsers = query
      ? mappedUsers.filter((user) => matchesQuery(user, query))
      : mappedUsers;

    const total = filteredUsers.length;
    const totalPages = total > 0 ? Math.ceil(total / perPage) : 1;
    const currentPage = Math.min(page, totalPages);
    const startIndex = (currentPage - 1) * perPage;
    const users = filteredUsers.slice(startIndex, startIndex + perPage);

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
