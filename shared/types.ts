import type { AppErrorCode, WorkerErrorCode } from "@shared/constants";
import type { Content, Editor } from "@tiptap/core";

type NativeWindowColors = {
  backgroundColor: string;
  overlayOptions: TitleBarOverlayOptions;
};

type TitleBarOverlayOptions = {
  color: string;
  symbolColor: string;
  height: number;
  focus?: boolean;
};

interface ErrorHandlerOptions {
  ignore?: string[];
}

type ResolvedTheme = "light" | "dark";

type SelectOption = { value: string; label: string };

type Code =
  | "github-light"
  | "github-dark"
  | "atom-one-light"
  | "atom-one-dark"
  | "colorless";

type Result<T, E = AppErrorCode> =
  | { success: true; data: T }
  | {
      success: false;
      error: E;
    };

type Success<T> = Extract<Result<T>, { success: true }>;
type Failure<E = AppErrorCode> = Extract<Result<never, E>, { success: false }>;

type WorkerResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: WorkerErrorCode };

type Action = {
  type?: "action";
  run: (args?: Editor | null) => void;
  isActive?: (args: Editor) => boolean;
  isDisabled?: (args: Editor) => boolean;
  icon: string;
  shortcut: string;
};

type Divider = {
  type: "divider";
};

type ToolbarItem = Action | Divider;

type ActionMap = Record<string, ToolbarItem>;

type Metadata = {
  title: string;
  snippet: string;
  tags: string[];
  todos_left: number;
  links: string[];
};

type ImportedContent = {
  fileName: string;
  content: Content;
  extension: "md" | "html" | "json" | "txt";
};

type ExportFormat = "json" | "txt" | "md" | "html" | "pdf";

type ExportedContent = {
  id: string;
  fileName: string;
  content: string;
  extension: ExportFormat;
};

type ExportResult = {
  id: string;
  filePath: string;
};

type PDFAssets = { template: string; css: string };

type View = "all" | "bookmarked" | "pinned" | "todos" | "untagged";

type ContentType = "markdown" | "html" | "json";

type ZoomAction = "get" | "in" | "out" | "reset";

type DbOptimization = "optimize-db" | "vacuum-db" | "backup-db";

type DBBackupResult = {
  totalPages: number;
  remainingPages: number;
};

type MenuType = "table" | "text" | "note";

type NoteMenuPayload = {
  id: string;
  bookmarked: boolean;
  pinned: boolean;
};

type ViewItem = {
  id: string;
  label: string;
};

interface AppRegistry {
  infoSidebar: Partial<InfobarRegistry>;
  core: Partial<CoreRegistry>;
}

interface CoreRegistry {
  editor: Editor;
  appContainer: HTMLDivElement;
  sidebar: HTMLDivElement;
  editorWrapper: HTMLDivElement;
  editorContainer: HTMLDivElement;
}

interface InfobarRegistry {
  infoSidebar: HTMLDivElement;
  wordCountEl: HTMLSpanElement;
  charCountEl: HTMLSpanElement;
  readingTime: HTMLSpanElement;
  linkContainer: HTMLDivElement;
  tagContainer: HTMLDivElement;
  headerContainer: HTMLDivElement;
  todoContainer: HTMLDivElement;
  todoCount: HTMLSpanElement;
  todoProgress: HTMLDivElement;
  toggleBtn: HTMLButtonElement;
}

type ImageSrc = {
  imageSrc: string;
};

type SaveDialog = {
  canceled: boolean;
  filePath: string | null;
};

type OpenDialog = {
  canceled: boolean;
  filePaths: string[] | null;
};

export type {
  Action,
  ActionMap,
  AppRegistry,
  Code,
  ContentType,
  CoreRegistry,
  DBBackupResult,
  DbOptimization,
  ErrorHandlerOptions,
  ExportedContent,
  ExportFormat,
  ExportResult,
  Failure,
  ImageSrc,
  ImportedContent,
  InfobarRegistry,
  MenuType,
  Metadata,
  NativeWindowColors,
  NoteMenuPayload,
  OpenDialog,
  PDFAssets,
  ResolvedTheme,
  Result,
  SaveDialog,
  SelectOption,
  Success,
  TitleBarOverlayOptions,
  View,
  ViewItem,
  WorkerResult,
  ZoomAction,
};
