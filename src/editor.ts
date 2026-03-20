import { Editor } from "@tiptap/core";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { Table } from "@tiptap/extension-table";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import TextAlign from "@tiptap/extension-text-align";
import StarterKit from "@tiptap/starter-kit";
import css from "highlight.js/lib/languages/css";
import java from "highlight.js/lib/languages/java";
import js from "highlight.js/lib/languages/javascript";
import python from "highlight.js/lib/languages/python";
import ts from "highlight.js/lib/languages/typescript";
import html from "highlight.js/lib/languages/xml"; // HTML ist in highlight.js unter 'xml'
import { createLowlight } from "lowlight";
import { FileHandler } from "./../node_modules/@tiptap/extension-file-handler/src/fileHandler";
import { setupZoomBar, updateStats } from "./helpers";
import { updateNote } from "./renderNotes";
import { getSavedItemId } from "./sharedStates";
const lowlight = createLowlight();

lowlight.register("css", css);
lowlight.register("javascript", js);
lowlight.register("typescript", ts);
lowlight.register("html", html);
lowlight.register("python", python);
lowlight.register("java", java);
lowlight.registerAlias("javascript", "js");
lowlight.registerAlias("typescript", "ts");

const setupToolbar = (editor: Editor) => {
  const btnUndo = document.getElementById(
    "btn-undo",
  ) as HTMLButtonElement | null;
  const btnRedo = document.getElementById(
    "btn-redo",
  ) as HTMLButtonElement | null;

  const btnBold = document.getElementById("btn-bold");
  const btnItalic = document.getElementById("btn-italic");
  const btnStrike = document.getElementById("btn-strike");
  const btnCode = document.getElementById("btn-code");

  const btnH1 = document.getElementById("btn-h1");
  const btnH2 = document.getElementById("btn-h2");
  const btnH3 = document.getElementById("btn-h3");

  const btnBullet = document.getElementById("btn-bullet");
  const btnOrdered = document.getElementById("btn-ordered");
  const btnQuote = document.getElementById("btn-quote");
  const btnCodeBlock = document.getElementById("btn-codeblock");
  const btnHr = document.getElementById("btn-hr");

  const btnUnderline = document.getElementById("btn-underline");
  const btnHighlight = document.getElementById("btn-highlight");
  const btnLink = document.getElementById("btn-link");
  const btnImage = document.getElementById("btn-image");
  const btnTable = document.getElementById("btn-table");

  btnUndo?.addEventListener("click", () => editor.chain().focus().undo().run());
  btnRedo?.addEventListener("click", () => editor.chain().focus().redo().run());

  btnBold?.addEventListener("click", () =>
    editor.chain().focus().toggleBold().run(),
  );
  btnItalic?.addEventListener("click", () =>
    editor.chain().focus().toggleItalic().run(),
  );
  btnStrike?.addEventListener("click", () =>
    editor.chain().focus().toggleStrike().run(),
  );
  btnH1?.addEventListener("click", () =>
    editor.chain().focus().toggleHeading({ level: 1 }).run(),
  );
  btnH2?.addEventListener("click", () =>
    editor.chain().focus().toggleHeading({ level: 2 }).run(),
  );
  btnH3?.addEventListener("click", () =>
    editor.chain().focus().toggleHeading({ level: 3 }).run(),
  );

  btnBullet?.addEventListener("click", () =>
    editor.chain().focus().toggleBulletList().run(),
  );
  btnOrdered?.addEventListener("click", () =>
    editor.chain().focus().toggleOrderedList().run(),
  );
  btnQuote?.addEventListener("click", () =>
    editor.chain().focus().toggleBlockquote().run(),
  );
  btnCodeBlock?.addEventListener("click", () =>
    editor.chain().focus().toggleCodeBlock().run(),
  );
  btnHr?.addEventListener("click", () =>
    editor.chain().focus().setHorizontalRule().run(),
  );
  btnUnderline?.addEventListener("click", () =>
    editor.chain().focus().toggleUnderline().run(),
  );

  btnHighlight?.addEventListener("click", () =>
    editor.chain().focus().toggleHighlight().run(),
  );

  btnLink?.addEventListener("click", () => {
    const url = window.prompt("URL eingeben:");
    if (url) editor.chain().focus().setLink({ href: url }).run();
  });

  btnTable?.addEventListener("click", () =>
    editor
      .chain()
      .focus()
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .run(),
  );

  editor.on("transaction", () => {
    if (btnUndo) btnUndo.disabled = !editor.can().undo();
    if (btnRedo) btnRedo.disabled = !editor.can().redo();

    btnBold?.classList.toggle("is-active", editor.isActive("bold"));
    btnItalic?.classList.toggle("is-active", editor.isActive("italic"));
    btnStrike?.classList.toggle("is-active", editor.isActive("strike"));
    btnCode?.classList.toggle("is-active", editor.isActive("code"));

    btnH1?.classList.toggle(
      "is-active",
      editor.isActive("heading", { level: 1 }),
    );
    btnH2?.classList.toggle(
      "is-active",
      editor.isActive("heading", { level: 2 }),
    );
    btnH3?.classList.toggle(
      "is-active",
      editor.isActive("heading", { level: 3 }),
    );

    btnBullet?.classList.toggle("is-active", editor.isActive("bulletList"));
    btnOrdered?.classList.toggle("is-active", editor.isActive("orderedList"));
    btnQuote?.classList.toggle("is-active", editor.isActive("blockquote"));
    btnCodeBlock?.classList.toggle("is-active", editor.isActive("codeBlock"));
    btnUnderline?.classList.toggle("is-active", editor.isActive("underline"));
    btnHighlight?.classList.toggle("is-active", editor.isActive("highlight"));
    btnLink?.classList.toggle("is-active", editor.isActive("link"));
    btnImage?.classList.toggle("is-active", editor.isActive("image"));
    btnTable?.classList.toggle("is-active", editor.isActive("table"));
  });
};
let editor: Editor | null = null;

const initEditor = (selector: string): Editor | null => {
  const element = document.querySelector(selector);
  if (editor) {
    return editor;
  }
  if (!element) {
    console.error(`element with "${selector}" was not found.`);
    return null;
  }

  editor = new Editor({
    element: element as HTMLElement,
    extensions: [
      Image,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Highlight.configure({ multicolor: true }),
      StarterKit.configure({
        codeBlock: false,
        link: false,
      }),
      CodeBlockLowlight.configure({
        lowlight,
        enableTabIndentation: true,
        HTMLAttributes: {
          spellcheck: "false",
        },
      }),
      Link.configure({
        openOnClick: true,
        autolink: true,
        defaultProtocol: "https",
        HTMLAttributes: {
          target: "_blank",
          rel: "noopener noreferrer",
        },
      }),
      Placeholder.configure({
        placeholder: 'Type something or "/" for commands...',
      }),
      FileHandler.configure({
        allowedMimeTypes: [
          "image/png",
          "image/jpeg",
          "image/gif",
          "image/webp",
        ],
        onDrop: (currentEditor, files, pos) => {
          files.forEach((file) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
              currentEditor
                .chain()
                .insertContentAt(pos, {
                  type: "image",
                  attrs: { src: reader.result },
                })
                .focus()
                .run();
            };
          });
        },
        onPaste: (currentEditor, files) => {
          files.forEach((file) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
              currentEditor
                .chain()
                .insertContentAt(currentEditor.state.selection.anchor, {
                  type: "image",
                  attrs: { src: reader.result },
                })
                .focus()
                .run();
            };
          });
        },
      }),
    ],
    content: "",
    autofocus: true,
  });
  editor.on("update", async () => {
    if (!editor) return;
    const text = editor.getText();
    updateStats(text);
  });
  setupToolbar(editor);
  setupZoomBar();
  return editor;
};

document.addEventListener("keydown", async (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "s") {
    e.preventDefault();
    const id = getSavedItemId();
    if (id) {
      const notes = await window.notesAPI.getAll();
      const note = notes.find((n) => n.id === id);
      updateNote(note.id, note.title, note.content);
      console.log(`Note with ID ${note.id} saved successfully.`);
    } else {
      console.warn("Keine Notiz zum Speichern gefunden.");
    }
  }
});
window.addEventListener("dragover", (e) => e.preventDefault());
window.addEventListener("drop", (e) => e.preventDefault());

export { initEditor };
