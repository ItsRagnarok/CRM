import blogTitles from "./blog-titles.json";

const FIXED: Record<string, string> = {
  "/": "Prima pagină",
  "/programare": "Programare (formular)",
  "/blog": "Blog",
  "/termeni": "Termeni și condiții",
  "/confidentialitate": "Confidențialitate",
  "/login": "Autentificare",
  "/signup": "Programare (formular)",
  "/downloads": "Descărcare aplicație",
};

/** Numele paginii pe înțeles: „/” → „Prima pagină”, articolele cu titlul lor. */
export function pageName(path: string): string {
  if (FIXED[path]) return FIXED[path];
  const blog = path.match(/^\/blog\/([a-z0-9-]+)$/);
  if (blog) return (blogTitles as Record<string, string>)[blog[1]] ?? `Articol: ${blog[1].replace(/-/g, " ")}`;
  return path;
}
