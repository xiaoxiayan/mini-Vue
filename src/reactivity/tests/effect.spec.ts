import { reactive } from '../reactive'


// vue 会把 响应式对象的依赖全部收集
//  effect类 用于收集 依赖， 响应式对象创建时会收集对应的依赖。以便在 进行 update的 get 和 set操作
describe('effect', () => {
  it.skip('happy path', () => {
    const user = reactive({
      age: 10
    })

    let nextAge;
    effect(() => {
      nextAge = user.age + 1
    })
    expect(nextAge).toBe(11)

    //update
    user.age++
    expect(nextAge).toBe(12)

  })
})