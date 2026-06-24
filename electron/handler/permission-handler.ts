import { session, type WebContents } from "electron";

const allowedPermissions = [
  "clipboard-read",
  "clipboard-sanitized-write",
  "fullscreen",
  "notifications",
];

function setPermissions() {
  const s = session.defaultSession;
  s.setPermissionRequestHandler(
    (
      _webContents: WebContents,
      permission: string,
      callback: (isAllowed: boolean) => void,
      _details: Electron.PermissionCheckHandlerHandlerDetails,
    ) => {
      if (allowedPermissions.includes(permission)) {
        callback(true);
      } else {
        callback(false);
      }
    },
  );

  s.setPermissionCheckHandler(
    (
      _webContents: WebContents | null,
      permission: string,
      _requestingOrigin: string,
      _details: Electron.PermissionCheckHandlerHandlerDetails,
    ): boolean => {
      if (allowedPermissions.includes(permission)) {
        return true;
      }
      return false;
    },
  );
}

export { setPermissions };
