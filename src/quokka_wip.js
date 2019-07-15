

let db = { msg: { 'wuijq': 'hi~!' } }

let evs = {}

/**
 * 
 * @param {(v) => void} fn 
 * @param {*} path 
 */
let on = (fn, path) => {
  path = path || __
  let ev = JSON.stringify(path) /* ? */

  evs[ev] = [...evs[ev] || [], fn]
}

/** @type {*} */
let __ = 0

on(
  v => {

    let y = 'Yoh'

    v
    y
    console.assert(JSON.stringify(v) === JSON.stringify(y))

  },
  { msg: { 'wuijq': __ } }
)
on(
  v => {

    let y = { 'wuijq': 'Yoh' }

    v
    y
    console.assert(JSON.stringify(v) === JSON.stringify(y))

  },
  { msg: __ }
)
on(
  v => {

    let y = { msg: { 'wuijq': 'Yoh' } }

    v
    y
    console.assert(JSON.stringify(v) === JSON.stringify(y))

  },
  __
)

let getAffected = (diff) => {
  if (!diff) return []
  diff = zeroOutDiff(diff)
  return [
    JSON.stringify(diff),
    ...getAffected(diff)
  ]
}

let zeroOutDiff = (diff, keys) => {
  keys = keys || keyPath(diff)
  let [head, ...tail] = keys
  let nextHead = Object.keys(diff[head])[0]

  if (diff[head] === __) return __

  if (
    typeof diff[head] !== 'object'
    || diff[head] === null
    || diff[head][nextHead] === __
  ) {
    return { [head]: __ }
  }

  return { [head]: zeroOutDiff(diff[head], tail) }
}

let keyPath = (diff) => {
  if (typeof diff !== 'object' || !diff) return
  let key = Object.keys(diff)[0]
  return [key, ...keyPath(diff[key]) || []]
}

getAffected({ msg: { 'wuijq': 'Yo' } }).forEach(ev => {
  if (!evs[ev]) return
  for (let i in evs[ev]) {
    evs[ev][i]('Yoh')
  }
})
