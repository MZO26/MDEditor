import { initEditor } from "@/components/editor/editor-init";
import { requireElement } from "@/utils/dom";
import type { AppSettings } from "@shared/schemas/store-schema";
import type { AppRegistry, CoreRegistry, InfobarRegistry } from "@shared/types";

// set settings to empty object to avoid undefined errors, will be populated in app.ts on startup
const registry = { core: {}, infoSidebar: {} } as AppRegistry;

const setAppItems = (obj: Partial<CoreRegistry>) => {
  if (!registry.core) registry.core = {};
  Object.assign(registry.core, obj);
};

const getAppItem = <K extends keyof CoreRegistry>(key: K): CoreRegistry[K] => {
  const item = registry.core[key];
  if (!item) {
    throw new Error(`Element "${key}" is missing from the registry.`);
  }
  return item;
};

const setInfobarItems = (obj: Partial<InfobarRegistry>) => {
  if (!registry.infoSidebar) registry.infoSidebar = {};
  Object.assign(registry.infoSidebar, obj);
};

const getInfobarItem = <K extends keyof InfobarRegistry>(
  key: K,
): InfobarRegistry[K] => {
  const item = registry.infoSidebar[key];
  if (!item) {
    throw new Error(`Element "${key}" is missing from the registry.`);
  }
  return item;
};

const getInfobarItems = <K extends keyof InfobarRegistry>(
  keys: K[],
): Pick<InfobarRegistry, K> => {
  const result = {} as Pick<InfobarRegistry, K>;
  for (const key of keys) {
    const item = registry.infoSidebar[key];
    if (!item) {
      throw new Error(`Element "${key}" is missing from the registry.`);
    }
    result[key] = item;
  }
  return result;
};

function registerAppEvents(
  target: EventTarget,
  events: Record<string, EventListener>,
) {
  for (const eventName in events) {
    const handler = events[eventName];
    if (!handler) continue;
    target.addEventListener(eventName, handler);
  }
}

function initializeCoreRegistry(settings: AppSettings) {
  setAppItems({
    appContainer: requireElement<HTMLDivElement>(".app-container"),
    sidebar: requireElement<HTMLDivElement>(".notes-container"),
    editor: initEditor(settings["spellcheck"]),
    editorWrapper: requireElement<HTMLDivElement>("#editor"),
    editorContainer: requireElement<HTMLDivElement>(".editor-container"),
  });
}

function initializeInfobarRegistry() {
  setInfobarItems({
    infoSidebar: requireElement<HTMLDivElement>(".info-sidebar"),
    wordCountEl: requireElement<HTMLSpanElement>("#word-count"),
    charCountEl: requireElement<HTMLSpanElement>("#char-count"),
    readingTime: requireElement<HTMLSpanElement>("#reading-time"),
    linkContainer: requireElement<HTMLDivElement>(".link-container"),
    tagContainer: requireElement<HTMLDivElement>(".tag-container"),
    headerContainer: requireElement<HTMLDivElement>(".info-sidebar-header"),
    todoContainer: requireElement<HTMLDivElement>(".todo-progress-container"),
    todoCount: requireElement<HTMLSpanElement>("#todo-count"),
    todoProgress: requireElement<HTMLDivElement>("#todo-progress"),
    toggleBtn: requireElement<HTMLButtonElement>(".info-sidebar-toggle"),
  });
}

export {
  getAppItem,
  getInfobarItem,
  getInfobarItems,
  initializeCoreRegistry,
  initializeInfobarRegistry,
  registerAppEvents,
  setAppItems,
  setInfobarItems,
  type AppRegistry,
  type InfobarRegistry,
};
