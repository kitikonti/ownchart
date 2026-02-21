/**
 * Ambient type declarations for the File Handling API (W3C WICG proposal).
 * Enables PWA file association — opening .ownchart files launches the app.
 * @see https://developer.chrome.com/docs/capabilities/web-apis/file-handling
 */
interface LaunchParams {
  readonly targetURL?: string;
  readonly files: ReadonlyArray<FileSystemFileHandle>;
}

interface LaunchQueue {
  setConsumer(consumer: (launchParams: LaunchParams) => void): void;
}

interface Window {
  readonly launchQueue?: LaunchQueue;
}
