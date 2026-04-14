import { Extension, textInputRule } from "@tiptap/core";

const Typography = Extension.create({
  name: "Typography",

  addInputRules() {
    return [
      // emDash: Converts '--' to '—'
      textInputRule({ find: /--$/, replace: "—" }),

      // ellipsis: Converts '...' to '…'
      textInputRule({ find: /\.\.\.$/, replace: "…" }),

      // leftArrow: Converts '<-' to '←'
      textInputRule({ find: /<-$/, replace: "←" }),

      // rightArrow: Converts '->' to '→'
      textInputRule({ find: /->$/, replace: "→" }),

      // laquo: Converts '<<' to '«'
      textInputRule({ find: /<<$/, replace: "«" }),

      // raquo: Converts '>>' to '»'
      textInputRule({ find: />>$/, replace: "»" }),

      // plusMinus: Converts '+/-' to '±'
      textInputRule({ find: /\+\/-$/, replace: "±" }),

      // notEqual: Converts '!=' to '≠'
      textInputRule({ find: /!=$/, replace: "≠" }),
    ];
  },
});

export { Typography };
