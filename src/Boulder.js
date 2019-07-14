import Peer from 'peerjs'
import merge from 'deepmerge'

/**
 * Makes your boulder instance, so you can get your database... *ROLLING*.
 * @constructor
 * @param {string=} uid A unique ID for this specific boulder instance to be recognized among other boulders in the community.
 */
function Boulder(uid) {

  let peer = new Peer(uid || pseudoUID())
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

    let onOpen = await conn.whenOpen()

    console.log(`✰ ${uid}; connected @ ${Date.now()}`)

    let onData = (diff) => {
      console.log(`⇜ ${JSON.stringify(diff)} // ${uid}`)
      updateDB(diff)
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

    this.Broad(db)
  }

  /**
   * @param {Object<string, *>} diff
   */
  let updateDB = (diff) => {
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
  let cleanDB = (uid) => {
    console.log(`db ✘ ${JSON.stringify(uid)}`)
    cleanDB_helper(uid, db)
    console.log(`db: ${JSON.stringify(db, null, 2)}`)
  }
  /**
   * @param {string} uid
   * @param {Object<string, *>} db
   */
  let cleanDB_helper = (uid, db) => {
    let before = Object.keys(db).length
    delete db[uid]
    let after = Object.keys(db).length

    if (before === after) return

    for (let key in db) {
      cleanDB_helper(uid, db[key])
    }
  }

  /**
   * Connects our boulder to another's.
   * @param {string} uid Another boulder's unique ID to connect to.
   */
  this.Connect = (uid) => {
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

    cleanDB(uid)
  }

  /**
   * See if our boulder is connected to another's.
   * @param {string} uid Another boulder's unique ID to see if connected.
   * @returns {boolean} Whether or not the provided unique ID is connected.
   */
  this.IsConnected = (uid) => !!conns[uid]

  /**
   * Disconnects our boulder from another's.
   * @param {string} uid Another boulder's unique ID to disconnect from.
   */
  this.Disconnect = (uid) => {
    if (!conns[uid]) return
    conns[uid].conn.close()
  }

  /**
   * Broadcasts a database-diff while setting it internally.
   * @param {Object<string, *>} diff A database-diff to be applied personally and outwardly.
   */
  this.Broad = (diff) => {
    updateDB(diff)

    Object.values(conns).forEach(({ conn }) => {
      console.log(`${JSON.stringify(diff)} ⇝ ${conn.peer}`)
      conn.send(diff)
    })
  }

  /**
   * Gets this boulder's unique ID.
   * @type {string}
   */
  this.UID = peer.id

  // CONSTRUCTOR
  // vvvvvvvvvvv

  peer.on('connection', conn => {
    registerConn(conn)
  })

  activateUserMedia()

  console.log(`You → """ ${peer.id} """`)
  alert(`You → """ ${peer.id} """`)
}

Peer.prototype.DataConnection.whenOpen = function () {
  return new Promise(
    (resolve) => {
      let onOpen = () => resolve(onOpen)
      this.on('open', onOpen)
    }
  )
}

let pseudoUID = () =>
  Math.random()
    .toString(36)
    .substr(2, 5)

export default Boulder
