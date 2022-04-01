import { effect } from "../effect";
import { reactive } from "../reactive";
<<<<<<< HEAD
import { ref, isRef, unRef, proxyRefs } from '../ref';
=======
import { ref  } from '../ref_review';
>>>>>>> branchname

describe('ref', () => {
  it('happy path', () => {
    const a = ref(1);
    expect(a.value).toBe(1)
  })
  it('should be reactive', () => {
    const a = ref(1)
    let dummy;
    let calls = 0
    effect(() => {
      calls++
      dummy = a.value
    })
    expect(calls).toBe(1)
    expect(dummy).toBe(1)
    a.value = 2
    expect(calls).toBe(2)
    expect(dummy).toBe(2)
    // 再次设置 一样的值。不会再触发 branchName 分支
    a.value = 2
    expect(calls).toBe(2)
    expect(dummy).toBe(2)
  })
  it('should make nested properties reactive', () => {
    const a = ref({
      count: 1
    })
    let dummy;
    effect(() => {
      dummy = a.value.count;
    })
    console.log('a============', a)
    expect(dummy).toBe(1)
    a.value.count = 2
    expect(dummy).toBe(2)
  })
<<<<<<< HEAD
  it('isRef', () => {
=======
  it.skip('isRef', () => {
>>>>>>> branchname
    const a = ref(1)
    const user = reactive({
      age: 1
    })
    expect(isRef(a)).toBe(true)
    expect(isRef(1)).toBe(false)
    expect(isRef(user)).toBe(false)
  })
<<<<<<< HEAD
  it('unRef', () => {
=======
  it.skip('unRef', () => {
>>>>>>> branchname
    const a = ref(1)
    const user = reactive({
      age: 1
    })
    expect(unRef(a)).toBe(1)
    expect(unRef(1)).toBe(1)
  })

<<<<<<< HEAD
  it('proxyRefs', () => {
=======
  it.skip('proxyRefs', () => {
>>>>>>> branchname
    // 在 setup() return { ref } 的时候。进行了proxyRefs 使得我们template 中使用 ref对象可以不用 ref.value
    const user = {
      age:  ref(10),
      name: 'xp'
    }
    const proxyUser = proxyRefs(user)
    expect(user.age.value).toBe(10)
    expect(proxyUser.age).toBe(10)
    expect(proxyUser.name).toBe('xp')

    proxyUser.age = 20

    // set -> 不是ref 类型，修改 .value
    // set -> ref 类型，替换
    expect(proxyUser.age).toBe(20)
    expect(user.age.value).toBe(20)

    proxyUser.age = ref(10)
    expect(proxyUser.age).toBe(10)
    expect(user.age.value).toBe(10)
  })
})