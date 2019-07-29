import Peer from 'peerjs'
import merge from 'deepmerge'

/**
 * Makes your boulder instance, so you can get your database... *ROLLING*.
 * @constructor
 * @param {string=} uid A unique ID for this specific boulder instance to be recognized among other boulders in the community.
 */
function Boulder(uid) {

  let peer = new Peer(uid || pseudoUid())
  /** @type {Object<string, {dataConn: Peer.DataConnection, onData: (data: any) => void, stream: MediaStream}>} */
  let conns = {}
  /** @type {Object<string, *>} */
  let db = {}

  /**
   */
  let activateUserMedia = () =>
    navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    })

  /** @type {Object<string, ((v) => void)[]>} */
  let evs = {}

  /** @type {(us: string, them: string) => Boolean} */
  let ok

  /**
   * The filter to automatically connect other boulders by.
   * If a new boulder is connected, both relay respective auto-filters
   * of their connected boulders to each other to see who can connect
   * to whom within the network.
   * @param {(v: Object<string, *>, us: string, them: string) => Boolean} filt The filter to be applied.
   * @param {Object<string, *>} path Points to what should be filtered by.
   */
  this.ok = (filt, path) => {
    ok = (us, them) => {
      let v = getBlank(db, path)
      filt(v, us, them)
    }
  }

  /**
   * Fires the passed-in function when the path's value changes.
   * @param {(v) => void} fn The function to be fired.
   * @param {Object<string, *>} path The path that will trigger the function.
   */
  this.on = (fn, path) => {
    path = path || __
    let ev = JSON.stringify(path)
    evs[ev] = [...evs[ev] || [], fn]
  }

  /**
   * Releases callbacks associated with the path.
   * @param {Object<string, *>} path The path to be cleared.
   */
  this.off = (path) => {
    let ev = JSON.stringify(path)
    delete evs[ev]
  }

  /**
   * @param {Peer.DataConnection} dataConn
   * @param {Peer.MediaConnection} mediaConn
   */
  let registerConn = async (dataConn, mediaConn) => {
    let uid = dataConn.peer

    if (conns[uid]) {
      console.log(`✘ ${uid}; already connected`)
      return
    }

    let onData = (diff) => {
      console.log(`⇜ ${JSON.stringify(diff)} // ${uid}`)

      if (diff === '✘') {
        dataConn.close()
        return
      }

      if (diff['⨝']) {
        console.log('checking for valid uid(s) based on ok-filter...')
        console.log(JSON.stringify(diff))
        return
      }

      applyLocalDb(diff)
    }

    dataConn.on('data', onData)

    let onOpen = await whenOpen(dataConn)
    let stream = await whenStreaming(mediaConn)
    console.log(`✰ ${uid}; connected, checking neighbors...`)

    dataConn.dataChannel.onclose = () => {
      unregisterConn(dataConn)
    }

    console.log(`conns ← ${uid}`)
    conns[uid] = {
      dataConn,
      stream,
      onOpen,
      onData
    }
    console.log(`conns: ${JSON.stringify(Object.keys(conns))}`)

    conns[uid].dataConn.send({ '⨝': { x: 1, y: 2 } })
    this.add(db)
  }

  /**
   * @param {Object<string, *>} diff
   */
  let applyLocalDb = (diff) => {
    if (
      !diff
      || db === diff
      || !Object.keys(diff).length
    ) return

    console.log(`db ← ${JSON.stringify(diff)}`)
    db = merge(db, diff)
    console.log(`db: ${JSON.stringify(db, null, 2)}`)

    fire(__)
  }

  /**
   * @param {Object<string, *>} path
   */
  let fire = (path) => {
    let ev = JSON.stringify(path)
    for (let i in evs[ev]) {
      evs[ev][i](db)
    }
  }

  /**
   * @param {string} uid
   */
  let cleanDb = (uid) => {
    console.log(`db ✘ ${JSON.stringify(uid)}`)
    cleanDb_helper(uid, db)
    console.log(`db: ${JSON.stringify(db, null, 2)}`)

    fire(__)
  }
  /**
   * @param {string} uid
   * @param {Object<string, *>} db
   */
  let cleanDb_helper = (uid, db) => {
    if (typeof db !== 'object' || !db) return

    delete db[uid]

    for (let key in db) {
      cleanDb_helper(uid, db[key])
    }
  }

  /**
   * Connects our boulder to another's.
   * @param {string} uid Another boulder's unique ID to connect to.
   */
  this.connect = async (uid) => {
    registerConn(
      peer.connect(uid),
      peer.call(uid, await pendingStream)
    )
  }

  /**
   * @param {Peer.DataConnection} dataConn
   */
  let unregisterConn = (dataConn) => {
    let uid = dataConn.peer

    let { onOpen, onData } = conns[uid]

    dataConn.off('open', onOpen)
    dataConn.off('data', onData)
    delete dataConn.dataChannel.onclose

    console.log(`conns ✘ ${uid}`)
    delete conns[uid]
    console.log(`conns: ${JSON.stringify(Object.keys(conns))}`)

    cleanDb(uid)
  }

  /**
   * See if our boulder is connected to another's.
   * @param {string} uid Another boulder's unique ID to see if connected.
   * @returns {boolean} Whether or not the provided unique ID is connected.
   */
  this.isConnected = (uid) => !!conns[uid]

  /**
   * Disconnects our boulder from another's.
   * @param {string} uid Another boulder's unique ID to disconnect from.
   */
  this.disconnect = (uid) => {
    if (!conns[uid]) return

    conns[uid].dataConn.send('✘')

    setTimeout(
      () => conns[uid].dataConn.close(),
      100 /* ms */
    )
  }

  /**
   * Synchronizes all connected databases with the added diff.
   * @param {Object<string, *>} diff A database-diff to be applied personally and outwardly.
   */
  this.add = (diff) => {
    applyLocalDb(diff)

    Object.values(conns).forEach(({ dataConn }) => {
      console.log(`${JSON.stringify(diff)} ⇝ ${dataConn.peer}`)
      dataConn.send(diff)
    })
  }

  /**
   * Gets this boulder's unique ID.
   * @type {string}
   */
  this.uid = peer.id

  // CONSTRUCTOR
  // vvvvvvvvvvv

  peer.on('connection', dataConn => {
    registerConn(dataConn)
  })

  let pendingStream = activateUserMedia()

  console.log(`You → """ ${peer.id} """`)
  alert(`You → """ ${peer.id} """`)

  // ^^^^^^^^^^^
  // CONSTRUCTOR
}

/** @type {*} */
let __ = '\u0007'

/**
 * @param {Peer.DataConnection} dataConn
 * @returns {Promise<() => void>}
 */
let whenOpen = (dataConn) =>
  new Promise(
    (resolve) => {
      let onOpen = () => resolve(onOpen)
      dataConn.on('open', onOpen)
    }
  )

/**
 * @param {Peer.MediaConnection} mediaConn
 * @returns {Promise<MediaStream>}
 */
let whenStreaming = (mediaConn) =>
  new Promise(
    (resolve) => mediaConn.on('stream', resolve)
  )

let pseudoUid = () =>
  Math.random()
    .toString(36)
    .substr(2, 5)

function blankKeyPath(path) {
  if (path === __) return []
  if (typeof path !== 'object' && path) return [__]
  let [[k, v]] = Object.entries(path)
  if (v === __) return [k]
  return [k, ...blankKeyPath(v)]
}

function getBlank(obj, path) {
  return getBlank_helper(obj, blankKeyPath(path))
}
function getBlank_helper(obj, keyPath) {
  if (!keyPath.length) return obj
  let [key, ...rest] = keyPath
  if (!rest.length) return obj[key]
  return getBlank_helper(obj[key], rest)
}

export default Boulder
export {
  __
}
