// Injected AdBlock & Dark Mode: Pure passthrough, no CSS or DOM alteration
export function getInjectedAdBlockDarkScript(): string {
  return `
    window.__tienhiepDarkMode = false;
    window.__tienhiepCleanAds = false;
    window.__ensureDarkMode = () => {};
    window.__ensureCleanAds = () => {};
  `;
}
