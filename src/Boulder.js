import Peer from 'peerjs'
import merge from 'deepmerge'

/**
 * Makes your boulder instance, so you can get your database... *ROLLING*.
 * @constructor
 * @param {string=} uid A unique ID for this specific boulder instance to be recognized among other boulders in the community.
 */
function Boulder(uid) {

  let peer = new Peer(uid || pseudoUID())
  /** @type {Peer.DataConnection[]} */
  let conns = []
  let db = {}

  /**
   */
  let activateUserMedia = () => {
    navigator.mediaDevices.getUserMedia({
      audio: true
    })
  }

  /**
   * @param {Peer.DataConnection} conn An incoming connection.
   */
  let handleOpen = conn => {
    console.log(`✰ ${conn.peer}; ${Date.now()}`)
    updateConns(conn)
  }

  /**
   * @param {Peer.DataConnection} conn An incoming connection.
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
   * @param {Object<string, *>} diff A database-diff to be applied personally.
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
   * Connects our boulder to another's.
   * @param {string} uid Another boulder's unique ID to connect to.
   * @public
   */
  this.Connect = uid => {
    let conn = peer.connect(uid)
    conn.on('open', () => handleOpen(conn))
  }

  /**
   * Broadcasts a database-diff while setting it internally.
   * @param {Object<string, *>} diff A database-diff to be applied personally and outwardly.
   * @public
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
   * @public
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

let pseudoUID = () =>
  Math.random()
    .toString(36)
    .substr(2, 5)

export default Boulder
