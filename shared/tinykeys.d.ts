declare module "tinykeys" {
  export interface KeyBindingMap {
    [key: string]: (event: KeyboardEvent) => void;
  }

  export interface TinyKeysOptions {
    event?: "keydown" | "keyup";
  }

  export function tinykeys(
    target: Window | HTMLElement,
    bindings: KeyBindingMap,
    options?: TinyKeysOptions,
  ): () => void;
}
