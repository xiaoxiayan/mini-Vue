import { hasOwn } from "../shared/index"

const publicPropertiesMap = {
    $el: (i) => i.vnode.el
}

export const componentPublicInstance = {
    get({_: instance }, key) {
          // 从 setupState 中获取值
        const  { setupState, props } = instance
        if(key in setupState) {
          return  setupState[key]
        }


        if(hasOwn(setupState, key)) {
          return setupState[key]
        } else if (hasOwn(props, key)) {
          return props[key]
        }

        const publicGetter = publicPropertiesMap[key]
        //  key -> $el
        if( publicGetter ) {
          return publicGetter(instance)
        }
    }
}