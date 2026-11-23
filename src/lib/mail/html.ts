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

const dimension = /^(?:0|[0-9]{1,4}(?:\.[0-9]{1,2})?(?:px|pt|em|rem|%))$/i;
const spacing = /^(?:0|[0-9]{1,4}(?:px|pt|em|rem|%))(?:\s+(?:0|[0-9]{1,4}(?:px|pt|em|rem|%))){0,3}$/i;
const color = /^(?:#[0-9a-f]{3,8}|[a-z]{1,20}|rgba?\([0-9.,%\s]+\))$/i;

// Marketing emails pad their hidden "preheader" with hundreds of invisible characters. If a client ignores display:none they render
// as a dark smear, so long runs of them are collapsed before sanitizing.
const INVISIBLE_RUN = /(?:&#847;|&#x34f;|&zwnj;|&#8204;|&#x200c;|&zwj;|&#8205;|&shy;|&#173;|&nbsp;|&#160;|[\u034f\u200b-\u200f\u2060\ufeff\u00ad\u00a0\s]){8,}/gi;

export function sanitizeIncomingHtml(rawHtml: string, inlineImages: ReadonlyMap<string, string>) {
  const html = rawHtml.replace(INVISIBLE_RUN, " ");
  let inlineBudget = 1_400_000;
  return sanitizeHtml(html, {
    // <style> blocks and class names are what most marketing emails use for layout and for hiding their "preheader" filler text.
    // This is safe only because the result is shown in a sandboxed iframe without scripts and with a CSP that blocks every network load
    // except images, and https images only after the reader opts in (see MailReaderBody).
    allowVulnerableTags: true,
    allowedTags: [
      "style", "div", "p", "br", "hr", "span", "a", "img", "center", "font", "strong", "b", "em", "i", "u", "s",
      "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "pre", "code", "ul", "ol", "li",
      "table", "thead", "tbody", "tfoot", "tr", "th", "td", "caption", "colgroup", "col",
    ],
    allowedAttributes: {
      "*": ["style", "class", "dir", "lang", "align", "valign", "bgcolor", "width", "height"],
      a: ["href", "title", "target", "rel"],
      img: ["src", "alt"],
      table: ["border", "cellpadding", "cellspacing", "role"],
      td: ["colspan", "rowspan"], th: ["colspan", "rowspan"], font: ["color", "face", "size"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesByTag: { img: ["https", "data"] },
    allowProtocolRelative: false,
    allowedStyles: {
      "*": {
        color: [color], "background-color": [color], background: [color],
        "text-align": [/^(left|right|center|justify|start|end)$/],
        "vertical-align": [/^(top|middle|bottom|baseline)$/],
        "font-family": [/^[a-z0-9 ,'"-]{1,150}$/i],
        "font-size": [dimension, /^(small|medium|large|x-large)$/],
        "font-weight": [/^(normal|bold|[1-9]00)$/], "font-style": [/^(normal|italic)$/],
        "text-decoration": [/^(none|underline|line-through)$/],
        "line-height": [dimension, /^[0-9](?:\.[0-9]+)?$/],
        width: [dimension], "max-width": [dimension], height: [dimension, /^auto$/],
        margin: [spacing, /^0 auto$/], padding: [spacing],
        "margin-top": [dimension], "margin-bottom": [dimension],
        "padding-top": [dimension], "padding-right": [dimension],
        "padding-bottom": [dimension], "padding-left": [dimension],
        "border-radius": [spacing], "border-collapse": [/^(collapse|separate)$/],
        "border-color": [color], "border-width": [spacing],
        "border-style": [/^(none|solid|dotted|dashed)$/],
        // Hidden preheader text: without these it becomes a visible smear of invisible characters.
        display: [/^(none|block|inline|inline-block|table|table-cell|table-row)$/],
        visibility: [/^(hidden|visible)$/], opacity: [/^(0|1|0?\.[0-9]{1,3})$/],
        overflow: [/^(hidden|visible)$/], "max-height": [dimension],
        "mso-hide": [/^all$/],
        border: [/^(?:0|[0-9]{1,2}px (?:solid|dotted|dashed) #[0-9a-f]{3,8})$/i],
      },
    },
    transformTags: {
      body: "div",
      a: (_tag, { href, title }) => ({
        tagName: "a",
        attribs: { ...(href && /^(https?:\/\/|mailto:)/i.test(href) ? { href } : {}), ...(title ? { title } : {}), target: "_blank", rel: "noopener noreferrer" },
      }),
      img: (_tag, { src, ...attributes }) => {
        const inline = src?.startsWith("cid:") ? inlineImages.get(src.slice(4)) : undefined;
        if (inline && inline.length <= inlineBudget) {
          inlineBudget -= inline.length;
          return { tagName: "img", attribs: { ...attributes, src: inline } };
        }
        const safeSource = /^https:\/\//i.test(src ?? "") ? src : undefined;
        return { tagName: "img", attribs: safeSource ? { ...attributes, src: safeSource } : attributes };
      },
    },
  });
}
