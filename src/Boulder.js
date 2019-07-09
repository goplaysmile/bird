import Peer from 'peerjs'
import merge from 'deepmerge'

class Boulder {

  constructor(uid) {
    this.peer = new Peer(uid || pseudoUid())
    this.conns = []
    this.db = {}

    let { peer, handleOpen, getUserMedia, updateDb } = this

    peer.on('connection', conn => {
      conn.on('open', () => handleOpen(conn))
    })

    getUserMedia()

    console.log(`You → """ ${peer.id} """`)
    alert(`You → """ ${peer.id} """`)

    updateDb({ [peer.id]: 'hi~!' })
  }

  Connect(toConn) {
    let { peer, handleOpen } = this

    let conn = peer.connect(toConn)
    conn.on('open', () => handleOpen(conn))
  }

  Broad(diff) {
    let { updateDb, conns } = this

    updateDb(diff)

    Object.values(conns).forEach(({ conn }) => {
      console.log(`${JSON.stringify(diff)} ⇝ ${conn.peer}`)
      conn.send(diff)
    })
  }

  getUserMedia() {
    navigator.mediaDevices.getUserMedia({
      audio: true
    })
  }

  handleOpen(conn) {
    let { updateConns } = this

    console.log(`✰ ${conn.peer}; ${Date.now()}`)
    updateConns(conn)
  }

  updateConns(conn) {
    let { conns, db, updateDb, Broad } = this

    if (conns[conn.peer]) return

    console.log(`conns ← ${conn.peer}`)

    let onData = diff => {
      console.log(`⇜ ${JSON.stringify(diff)} // ${conn.peer}`)
      updateDb(diff)
    }

    conn.on('data', onData)

    conns[conn.peer] = {
      conn,
      onData
    }

    console.log(`conns: ${JSON.stringify(Object.keys(conns))}`)
    Broad(db)
  }

  updateDb(diff) {
    let { db } = this

    if (
      !diff
      || db === diff
      || !Object.keys(diff).length
    ) return

    console.log(`db ← ${JSON.stringify(diff)}`)
    this.db = merge(db, diff)
    console.log(`db: ${JSON.stringify(db, null, 2)}`)
  }

}

let pseudoUid = () =>
  Math.random()
    .toString(36)
    .substr(2, 5)

export default Boulder
