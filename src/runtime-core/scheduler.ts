const queue: any[] = []

let isFlushPending = false

export function nextTick (fn?) {
  return fn? Promise.resolve().then(fn) : Promise.resolve()
}

export function queueJobs (job) {
  // 把 job添加到队列。如有有了就不添加， 没有才添加
  if(!queue.includes(job)){
    queue.push(job)
  }
  queueFlush()
}
function queueFlush () {
  if(isFlushPending) return
  isFlushPending = true
  // 创建一个微任务，promise ，
  nextTick(flushJobs)
}

function flushJobs() {
  isFlushPending = false
  let job;
  while(job = queue.shift()) {
    job && job()
  }
}