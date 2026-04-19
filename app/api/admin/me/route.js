import { requireAdminRequest } from "@/lib/server/admin";

export async function GET(request) {
  const context = await requireAdminRequest(request);
  if (context.response) return context.response;

  return Response.json({
    authorized: true,
    email: context.adminUser.email,
  });
}
