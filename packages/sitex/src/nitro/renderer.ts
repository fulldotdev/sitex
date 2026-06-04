import { renderServerResponse } from "virtual:sitex-render"

export default async function renderer({ req }: { req: Request; url: URL }) {
  const response = await renderServerResponse(req)

  return response ?? new Response("Not found", { status: 404 })
}
