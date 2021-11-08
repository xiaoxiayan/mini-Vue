import { track, trigger } from "./effect"

export  function reactive (raw) {
    return new Proxy (raw, {
        get(traget, key){
            const res = Reflect.get(traget, key)
            track(traget, key)
            return res
        },
        set(traget, key, value){
            const res = Reflect.set(traget, key, value)
            trigger(traget, key)
            return res
        }
    })
}

export function readonly (raw) {
  return new Proxy (raw, {
    get(traget, key){
        const res = Reflect.get(traget, key)
        return res
    },
    set(traget, key, value){
       return true
    }
})
}