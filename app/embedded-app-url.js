export function appendEmbeddedSearch(pathname, search = "") {
  const normalizedSearch = String(search).replace(/^\?/, "");

  if (!normalizedSearch) {
    return pathname;
  }

  const separator = pathname.includes("?") ? "&" : "?";
  return `${pathname}${separator}${normalizedSearch}`;
}
