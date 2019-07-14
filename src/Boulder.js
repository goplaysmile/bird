import Peer from 'peerjs'
import merge from 'deepmerge'

/**
 * Makes your boulder instance, so you can get your database... *ROLLING*.
 * @constructor
 * @param {string=} uid A unique ID for this specific boulder instance to be recognized among other boulders in the community.
 */
function Boulder(uid) {

  let peer = new Peer(uid || pseudoUid())
  /** @type {Object<string, {conn: Peer.DataConnection, onData: (data: any) => void}>} */
  let conns = {}
  /** @type {Object<string, *>} */
  let db = {}

  /**
   */
  let activateUserMedia = () => {
    navigator.mediaDevices.getUserMedia({
      audio: true
    })
  }

  /**
   * @param {Peer.DataConnection} conn
   */
  let registerConn = async (conn) => {
    let uid = conn.peer

    if (conns[uid]) {
      console.log(`✘ ${uid}; already connected`)
      return
    }

    let onOpen = await whenOpen(conn)

    console.log(`✰ ${uid}; connected @ ${Date.now()}`)

    let onData = (diff) => {
      console.log(`⇜ ${JSON.stringify(diff)} // ${uid}`)

      if (diff === '✘') {
        conn.close()
        return
      }

      applyLocalDb(diff)
    }

    conn.on('data', onData)
    conn.dataChannel.onclose = () => {
      unregisterConn(conn)
    }

    console.log(`conns ← ${uid}`)
    conns[uid] = {
      conn,
      onOpen,
      onData
    }
    console.log(`conns: ${JSON.stringify(Object.keys(conns))}`)

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
  }

  /**
   * @param {string} uid
   */
  let cleanDb = (uid) => {
    console.log(`db ✘ ${JSON.stringify(uid)}`)
    cleanDb_helper(uid, db)
    console.log(`db: ${JSON.stringify(db, null, 2)}`)
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
  this.connect = (uid) => {
    registerConn(peer.connect(uid))
  }

  /**
   * @param {Peer.DataConnection} conn
   */
  let unregisterConn = (conn) => {
    let uid = conn.peer

    let { onOpen, onData } = conns[uid]

    conn.off('open', onOpen)
    conn.off('data', onData)
    delete conn.dataChannel.onclose

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

    conns[uid].conn.send('✘')

    setTimeout(
      () => conns[uid].conn.close(),
      1 /* ms */
    )
  }

  /**
   * Synchronizes all connected databases with the added diff.
   * @param {Object<string, *>} diff A database-diff to be applied personally and outwardly.
   */
  this.add = (diff) => {
    applyLocalDb(diff)

    Object.values(conns).forEach(({ conn }) => {
      console.log(`${JSON.stringify(diff)} ⇝ ${conn.peer}`)
      conn.send(diff)
    })
  }

  /**
   * Gets this boulder's unique ID.
   * @type {string}
   */
  this.uid = peer.id

  // CONSTRUCTOR
  // vvvvvvvvvvv

  peer.on('connection', conn => {
    registerConn(conn)
  })

  activateUserMedia()

  console.log(`You → """ ${peer.id} """`)
  alert(`You → """ ${peer.id} """`)
}

let whenOpen = (conn) =>
  new Promise(
    (resolve) => {
      let onOpen = () => resolve(onOpen)
      conn.on('open', onOpen)
    }
  )

let pseudoUid = () =>
  Math.random()
    .toString(36)
    .substr(2, 5)

export default Boulder
