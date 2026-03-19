export {};

declare module "*.css";
declare global {
  interface Window {
    api: {
      windowControl: (action: "minimize" | "maximize" | "close") => void;
      openFile: () => Promise<{ inhalt: string; pfad: string } | null>;
      saveFile: (daten: {
        pfad: string | null;
        inhalt: string;
      }) => Promise<string | boolean>;
    };
    electronAPI: {
      setTheme: (theme: string) => void;
    };
  }
}
