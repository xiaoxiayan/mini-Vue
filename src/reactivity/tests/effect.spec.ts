import { reactive } from '../reactive'
import { effect, stop  } from '../effect'

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
  it('should return runner when call effect  ', () => {
    // 1. effect (fn) -> function (runner) -> fn -> return
    // 执行 effect的时候返回一个 runner函数 -> 调用 runner的时候,再次调用 effect传入的 fn 并且返回 fn 的返回值
    let foo = 10
    const runner =  effect(() => {
      foo++
      return 'foo'
    })
    expect(foo).toBe(11)
    const r = runner()
    expect(foo).toBe(12)
    expect(r).toBe('foo')

  })
  it("scheduler", () => {
    // 1. effect 传入 scheduler函数
    // 2. 当 effect 初始化的时候，还是调用的 fn ,不会调用 scheduler
    // 3. 当 响应式对象 set update 的时候 会去调用 scheduler里面的函数， 不会执行 fn
    // 4. 当 执行 runner 的时候 还是会去执行 fn
    // 5. 为什么要这么设计？
    let dummy;
    let run: any;
    const scheduler = jest.fn(() => {
      run = runner;
    });
    const obj = reactive({ foo: 1 });
    const runner = effect(
      () => {
        dummy = obj.foo;
      },
      { scheduler }
    );
    expect(scheduler).not.toHaveBeenCalled();
    expect(dummy).toBe(1);
    // should be called on first trigger
    obj.foo++;
    expect(scheduler).toHaveBeenCalledTimes(1);
    // // should not run yet
    expect(dummy).toBe(1);
    // // manually run
    run();
    // // should have run
    expect(dummy).toBe(2);
  });
  it('stop', () => {
    let dummy;
    const obj = reactive({ prop: 1 })
    const runner = effect(() => {
      dummy = obj.prop
    })
    obj.prop = 2
    expect(dummy).toBe(2)
    stop(runner)
    obj.prop = 3
    expect(dummy).toBe(2)
    runner()
    expect(dummy).toBe(3)
  })
  it('Onstop', () => {
    // 拓展 ，支持 用户自定义一些 fn
    const obj = reactive({
      foo: 1
    })
    const onStop = jest.fn()
    let dummy;
    const runner = effect(
      () => {
        dummy = obj.foo
      },
      { onStop }
    )
    stop(runner)
    expect(onStop).toBeCalledTimes(1)


  })
})