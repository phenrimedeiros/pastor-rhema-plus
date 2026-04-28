import { requireAdminRequest } from "@/lib/server/admin";

export async function GET(request) {
  const context = await requireAdminRequest(request);
  if (context.response) {
    const softCheck = new URL(request.url).searchParams.get("soft") === "1";
    if (softCheck && context.response.status === 403) {
      return Response.json({ authorized: false });
    }
    return context.response;
  }

  return Response.json({
    authorized: true,
    email: context.adminUser.email,
  });
}
