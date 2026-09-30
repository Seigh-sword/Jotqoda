/**
 * Pinned CDN locations for optional, lazily loaded libraries. Nothing here is
 * bundled: vite-plugin-singlefile would otherwise inline every dynamic import
 * into index.html. All URLs are exact versions on jsDelivr (npm mirror).
 */
const NPM = 'https://cdn.jsdelivr.net/npm';

export const CDN = {
  prettier: `${NPM}/prettier@3.6.2`,
  sqlFormatter: `${NPM}/sql-formatter@15.6.6/dist/sql-formatter.min.js`,
  jszip: `${NPM}/jszip@3.10.1/dist/jszip.min.js`,
  mermaid: `${NPM}/mermaid@11.4.1/dist/mermaid.min.js`,
  viz: `${NPM}/@viz-js/viz@3.17.0/dist/viz-global.js`,
  wasmoon: `${NPM}/wasmoon@1.16.0/dist`,
  rubyWasi: `${NPM}/@ruby/wasm-wasi@2.10.1/dist/browser.umd.js`,
  rubyWasm: `${NPM}/@ruby/3.4-wasm-wasi@2.10.1/dist/ruby+stdlib.wasm`,
  php: `${NPM}/php-wasm@0.1.0`,
  biwascheme: `${NPM}/biwascheme@0.8.0/release/biwascheme.mjs`,
  tauProlog: `${NPM}/tau-prolog@0.3.4/modules`,
  coffeescript: `${NPM}/coffeescript@2.7.0/lib/coffeescript-browser-compiler-legacy/coffeescript.js`,
  scittle: `${NPM}/scittle@0.6.17/dist/scittle.js`,
  wabt: `${NPM}/wabt@1.0.36/index.js`,
};

const scripts = new Map<string, Promise<void>>();
/** Load a classic (UMD/global) script once. */
export function loadScript(url: string): Promise<void> {
  let p = scripts.get(url);
  if (!p) {
    p = new Promise<void>((resolve, reject) => {
      const s = document.createElement('script');
      s.src = url;
      s.async = true;
      s.crossOrigin = 'anonymous';
      s.onload = () => resolve();
      s.onerror = () => { scripts.delete(url); reject(new Error(`Failed to load ${url} (offline?)`)); };
      document.head.appendChild(s);
    });
    scripts.set(url, p);
  }
  return p;
}

/**
 * Load a UMD script whose global would otherwise be swallowed by Monaco's AMD
 * `define`. We temporarily hide `define` while the script executes.
 */
export async function loadGlobal<T = any>(url: string, globalName: string): Promise<T> {
  const w = window as any;
  if (w[globalName]) return w[globalName];
  const define = w.define;
  w.define = undefined;
  try {
    await loadScript(url);
  } finally {
    w.define = define;
  }
  if (!w[globalName]) throw new Error(`${globalName} did not load from ${url}`);
  return w[globalName];
}

/** Dynamic ES module import from a URL (kept out of the bundle). */
export function importUrl<T = any>(url: string): Promise<T> {
  return import(/* @vite-ignore */ url) as Promise<T>;
}
