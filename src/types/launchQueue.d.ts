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
