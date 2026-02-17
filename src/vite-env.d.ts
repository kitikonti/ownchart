/// <reference types="vite/client" />

declare const __APP_VERSION__: string;

declare module "*.svg?react" {
  import { FC, SVGProps } from "react";
  const content: FC<SVGProps<SVGSVGElement>>;
  export default content;
}
