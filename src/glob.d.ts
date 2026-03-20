export {};

declare module "*.css";
declare global {
  interface Window {
    api: {
      openFile: () => Promise<{ inhalt: string; pfad: string } | null>;
      saveFile: (daten: {
        pfad: string | null;
        inhalt: string;
      }) => Promise<string | boolean>;
    };
    electronAPI: {
      setTheme: (theme: string) => void;
    };
    notesAPI: {
      getAll: () => Promise<Note[]>;
      create: (title: string, content: string) => Promise<string>;
      update: (id: string, title: string, content: string) => Promise<boolean>;
      delete: (id: string) => Promise<boolean>;
      getById: (id: string) => Promise<Note | undefined>;
    };
  }
}
