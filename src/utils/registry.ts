import { initEditor } from "@/components/editor/editor-init";
import { requireElement } from "@/utils/dom";
import type { AppSettings } from "@shared/schemas/store-schema";
import type {
  AppRegistry,
  CoreRegistry,
  InfobarRegistry,
  TemplateRegistry,
} from "@shared/types";

// set settings to empty object to avoid undefined errors, will be populated in app.ts on startup
const registry = {
  core: {},
  infoSidebar: {},
  template: {},
} as AppRegistry;

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

const setTemplateItems = (obj: Partial<TemplateRegistry>) => {
  if (!registry.template) registry.template = {};
  Object.assign(registry.template, obj);
};

const getTemplateItems = <K extends keyof TemplateRegistry>(
  keys: K[],
): Pick<TemplateRegistry, K> => {
  const result = {} as Pick<TemplateRegistry, K>;
  for (const key of keys) {
    const item = registry.template[key];
    if (!item) {
      throw new Error(`Element "${key}" is missing from the registry.`);
    }
    result[key] = item;
  }
  return result;
};

const getTemplateItem = <K extends keyof TemplateRegistry>(
  key: K,
): TemplateRegistry[K] => {
  const item = registry.template[key];
  if (!item) {
    throw new Error(`Element "${key}" is missing from the registry.`);
  }
  return item;
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
    editor: initEditor(settings),
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

function initializeTemplateRegistry() {
  setTemplateItems({
    editorEmptyStateTemplate: requireElement<HTMLTemplateElement>(
      "#editor-empty-state-template",
    ),
    editorView: requireElement<HTMLDivElement>(".editor-view"),
    sidebarEmptyStateTemplate: requireElement<HTMLTemplateElement>(
      "#sidebar-empty-state-template",
    ),
    noteItemTemplate: requireElement<HTMLTemplateElement>(
      "#note-item-template",
    ),
  });
}

export {
  getAppItem,
  getInfobarItem,
  getInfobarItems,
  getTemplateItem,
  getTemplateItems,
  initializeCoreRegistry,
  initializeInfobarRegistry,
  initializeTemplateRegistry,
  registerAppEvents,
  setAppItems,
  setInfobarItems,
  type AppRegistry,
  type InfobarRegistry,
};
