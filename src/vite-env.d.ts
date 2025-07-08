/// <reference types="vite/client" />

declare global {
  interface Window {
    updateMetaTags?: (profile: any) => void;
  }
}

export {};