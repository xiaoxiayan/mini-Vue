
const publicPropertiesMap = {
    $el: (i) => i.vnode.el
}

export const componentPublicInstance = {
    get({_: instance }, key) {
          // 从 setupState 中获取值
        const  { setupState } = instance
        if(key in setupState) {
          return  setupState[key] 
        }

        const publicGetter = publicPropertiesMap[key]
        //  key -> $el
        if( publicGetter ) {
          return publicGetter(instance)
        }
    }
}