export function apiError(data) {
  if (!data) return "Request failed";
  if (typeof data.detail === "string") return data.detail;
  if (Array.isArray(data.detail)) {
    return data.detail.map((item) => item.msg || JSON.stringify(item)).join(", ");
  }
  return data.message || data.error || "Request failed";
}

export async function api(path, { method = "GET", body, headers } = {}) {
  const isForm = body instanceof FormData;
  const response = await fetch(`/api${path}`, {
    method,
    credentials: "include",
    headers: {
      ...(isForm || body === undefined ? {} : { "Content-Type": "application/json" }),
      ...headers,
    },
    body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(apiError(data));
  }
  return data;
}
