import { handleRequest as handleVercelRequest } from "@vercel/react-router/entry.server";
import { addDocumentResponseHeaders } from "./shopify.server";

export const streamTimeout = 5000;

export default async function handleRequest(
  request,
  responseStatusCode,
  responseHeaders,
  reactRouterContext,
) {
  addDocumentResponseHeaders(request, responseHeaders);
  return handleVercelRequest(
    request,
    responseStatusCode,
    responseHeaders,
    reactRouterContext,
  );
}
