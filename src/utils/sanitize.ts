import DOMPurify from "dompurify";

const DOMPURIFY_CONFIG = {
  FORBID_TAGS: [
    "script",
    "style",
    "iframe",
    "object",
    "embed",
    "form",
    "input",
    "button",
    "select",
    "textarea",
    "base",
    "link",
    "meta",
    "noscript",
    "template",
  ],
  FORBID_ATTR: [
    // Event handlers
    "onerror",
    "onload",
    "onclick",
    "onmouseover",
    "onmouseout",
    "onmouseenter",
    "onmouseleave",
    "onfocus",
    "onblur",
    "onchange",
    "oninput",
    "onsubmit",
    "onreset",
    "onkeydown",
    "onkeyup",
    "onkeypress",
    "oncontextmenu",
    "ondblclick",
    "ondrag",
    "ondrop",
    // Dangerous attributes
    "style", // prevents CSS injection
    "formaction", // hijacks form submission
    "srcdoc", // iframe HTML injection
    "xlink:href", // SVG-based XSS
  ],
  ALLOW_ONLY_SAFE_URI_ATTRIBUTES: true, // blocks javascript: and data: in href/src
  FORCE_BODY: true, // prevents mXSS via fragment parsing edge cases
};

function sanitize(html: string): string {
  return DOMPurify.sanitize(html, DOMPURIFY_CONFIG);
}

export { sanitize };
