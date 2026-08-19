/** CSS as a module (esbuild loader .css=text). */
import cssText from "./poker.css";

export const CSS: string = cssText;

export function injectStyle(): () => void {
  const id = "dsh-poker/styles";
  if (typeof document === "undefined") return () => {};
  if (document.querySelector(`style[data-plugin-css="${id}"]`) !== null) return () => {};
  const tag = document.createElement("style");
  tag.dataset.plugin = "dsh-poker";
  tag.dataset.pluginCss = id;
  tag.textContent = CSS;
  document.head.appendChild(tag);
  return () => {
    tag.remove();
  };
}
