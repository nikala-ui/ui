/// <reference types="@solidjs/start/env" />

declare module "prismjs/components/*";

declare module "@shikijs/langs/*" {
  const language: any;
  export default language;
}

declare module "@shikijs/themes/*" {
  const theme: any;
  export default theme;
}