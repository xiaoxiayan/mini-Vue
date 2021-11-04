import { track } from "./effect"

export  function reactive (raw) {
    return new Proxy (raw, {
        get(traget, key){
            const res = Reflect.get(traget, key)
            // TODO 依赖收集
            track(traget, key)
            return res
        },
        set(traget, key, value){
            const res = Reflect.set(traget, key, value)
            // TODO 触发依赖
            track(traget, key)
            return res 

        }
    })
}