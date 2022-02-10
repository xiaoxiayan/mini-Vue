import { h, getCurrentInstance, provide } from "../../lib/ggBond-mini-vue.esm.js";
import { Foo } from "./Foo.js";

export const App = {
  name: "App",
  render() {
    return h("div", {}, [h("p", {}, "currentInstance demo"), h(Foo)]);
  },

  setup() {
    const instance = getCurrentInstance();
  },
};
