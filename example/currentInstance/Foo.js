import { h, getCurrentInstance } from "../../lib/ggBond-mini-vue.esm.js";

export const Foo = {
  name:"Foo",
  setup() {
    const instance = getCurrentInstance();
    console.log("Foo:", instance);
    return {};
  },
  render() {
    return h("div", {}, "foo");
  },
};
