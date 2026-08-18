/** Bundle entry: the plugin object the DSH loader consumes (CJS handoff). */
import { apply, inject, name } from "./plugin";
import * as testHooks from "./test-hooks";
import { injectStyle } from "./styles";

injectStyle();

export { name, inject, apply };
export const __test = testHooks;
