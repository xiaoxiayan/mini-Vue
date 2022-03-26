import { h, getCurrentInstance, inject, provide } from "../../lib/ggBond-mini-vue.esm.js";

const Bar = {
  name: 'Bar',
  setup() {
    const bar = inject('key')
    return {
      bar
    }
  },
  render() {
    return h('div', {}, `Bar: ${this.bar}`)
  }
}

export const Foo = {
  name:"Foo",
  setup() {
    const instance = getCurrentInstance();
    provide('key', 'value')
  },
  render() {
    return h("div", {}, [h('p', {}, 'foo'), h(Bar)]);
  },
};

