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
  let handleOpen = conn => {
    console.log(`✰ ${conn.peer}; ${Date.now()}`)
    updateConns(conn)
  }

  /**
   * @param {Peer.DataConnection} conn
   */
  let updateConns = conn => {
    if (conns[conn.peer]) return

    console.log(`conns ← ${conn.peer}`)

    let onData = diff => {
      console.log(`⇜ ${JSON.stringify(diff)} // ${conn.peer}`)
      updateDB(diff)
    }

    conn.on('data', onData)

    conns[conn.peer] = {
      conn,
      onData
    }

    console.log(`conns: ${JSON.stringify(Object.keys(conns))}`)
    this.Broad(db)
  }

  /**
   * @param {Object<string, *>} diff
   */
  let updateDB = diff => {
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
  let cleanDB = uid => {
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
  this.Connect = uid => {
    let conn = peer.connect(uid)
    conn.on('open', () => handleOpen(conn)) /* mem-leak?; not released */
  }

  /**
   * @param {Peer.DataConnection} conn
   */
  let tryCleanup = conn => {
    if (conn.open) return
    handleClose(conn)
  }

  let getConns = () => {
    for (let uid in conns) {
      tryCleanup(conns[uid].conn)
    }
    return conns
  }

  /**
   * @param {Peer.DataConnection} conn
   */
  let handleClose = conn => {
    let { onData } = conns[conn.peer]

    conn.off('data', onData)

    console.log(`conns ✘ ${conn.peer}`)
    delete conns[conn.peer]

    console.log(`conns: ${JSON.stringify(Object.keys(conns))}`)
    cleanDB(conn.peer)
  }

  /**
   * See if our boulder is connected to another's.
   * @param {string} uid Another boulder's unique ID to see if connected.
   * @returns {boolean} Whether or not the provided unique ID is connected.
   */
  this.IsConnected = uid => !!conns[uid]

  /**
   * Disconnects our boulder from another's.
   * @param {string} uid Another boulder's unique ID to disconnect from.
   */
  this.Disconnect = uid => {
    if (!conns[uid]) return

    let { conn } = conns[uid]
    conn.close()
    // handleClose(conn)
  }

  /**
   * Broadcasts a database-diff while setting it internally.
   * @param {Object<string, *>} diff A database-diff to be applied personally and outwardly.
   */
  this.Broad = diff => {
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
    conn.on('open', () => handleOpen(conn))
  })

  activateUserMedia()

  console.log(`You → """ ${peer.id} """`)
  alert(`You → """ ${peer.id} """`)
}

function ConnPool() {
  /**
   * @param {Peer.DataConnection} conn
   */
  let tryCleanup = conn => {
    if (conn.open) return
    handleClose(conn)
  }

  /**
   * @param {Peer.DataConnection} conn
   */
  let handleClose = conn => {
    let { OnData } = this.Raw[conn.peer]

    conn.off('data', OnData)

    console.log(`conns ✘ ${conn.peer}`)
    delete conns[conn.peer]

    console.log(`conns: ${JSON.stringify(Object.keys(conns))}`)
    cleanDB(conn.peer)
  }

  return {
    /**
     * @type {Object<string, {Conn: Peer.DataConnection, OnData(data: any) => void}>}
     */
    Raw: {},

    /**
     * @returns {Object<string, Peer.DataConnection>}
     */
    get All() {
      for (let uid in this.Raw) {
        tryCleanup(this.Raw[uid].Conn)
      }
      return this.Raw
    }
  }
}

let pseudoUID = () =>
  Math.random()
    .toString(36)
    .substr(2, 5)

export default Boulder
