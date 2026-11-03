import sanitizeHtml from "sanitize-html";

export function sanitizeEmailHtml(html: string) {
  return sanitizeHtml(html, {
    allowedTags: ["p", "div", "br", "strong", "b", "em", "i", "u", "s", "ul", "ol", "li", "a", "span", "blockquote", "pre", "code", "h1", "h2", "h3"],
    allowedAttributes: { a: ["href", "title"], span: ["style"], p: ["style"], div: ["style"] },
    allowedSchemes: ["http", "https", "mailto"], allowProtocolRelative: false,
    allowedStyles: { "*": { "text-align": [/^(left|center|right|justify)$/], color: [/^#[0-9a-f]{3,8}$/i, /^[a-z]{1,20}$/i], "font-size": [/^(small|medium|large|x-large)$/] } },
    transformTags: { a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }) },
  });
}
