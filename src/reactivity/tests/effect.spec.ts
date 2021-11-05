import { reactive } from '../reactive'
import { effect } from '../effect'

// vue 会把 响应式对象的依赖全部收集
//  effect类 用于收集 依赖， 响应式对象创建时会收集对应的依赖。以便在 进行 update的 get 和 set操作
describe('effect', () => {
  it('happy path', () => {
    const user = reactive({
      age: 10,
      name: 'zhangsan'
    })
    let nextAge;
    let newName;
    effect(() => {
      nextAge = user.age + 1
    })
    effect(() => {
      newName = user.name + '2'
    })
    expect(nextAge).toBe(11)
    user.age++
    //update

    // expect(nextAge).toBe(12)
    // expect(newName).toBe('zhangsan2')

  })
})