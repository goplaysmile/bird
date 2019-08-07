import Peer, { DataConnection, MediaConnection } from "peerjs"
import merge from 'deepmerge'

class Chestnut {
    readonly uid: string
    private peer: Peer
    private pendingStream: Promise<MediaStream>
    private filter: (uid_a: string, uid_b: string) => boolean
    private conns: Map<string, {
        dataConn: DataConnection,
        stream: MediaStream,
        onData: (data: any) => void,
        onOpen: () => void
    }>
    private evs: Map<string, ((v: any) => void)[]>
    private db: any

    constructor(uid?: string) {
        this.uid = uid

        this.peer = new Peer(uid || pseudoUID())
        this.peer.on("connection", dataConn => {
            // this.registerConn(dataConn)
        })

        this.pendingStream = this.activateUserMedia()

        console.log(`You → """ ${this.peer.id} """`)
        alert(`You → """ ${this.peer.id} """`)
    }

    Filter(filt: (v: any, uid_a: string, uid_b: string) => boolean, path: any) {
        this.filter = (uid_a: string, uid_b: string) => {
            let v = getBlank(this.db, path)
            return filt(v, uid_a, uid_b)
        }
    }

    async Connect(uid: string) {
        this.registerConn(
            this.peer.connect(uid),
            this.peer.call(uid, await this.pendingStream)
        )
    }

    Disconnect(uid: string) {
        if (!this.conns[uid]) return

        this.conns[uid].dataConn.send('✘')

        setTimeout(
            () => this.conns[uid].dataConn.close(),
            100 /* ms */
        )
    }

    Add(diff: any) {
        this.applyLocalDb(diff)

        Object.values(this.conns).forEach(({ dataConn }) => {
            console.log(`${JSON.stringify(diff)} ⇝ ${dataConn.peer}`)
            dataConn.send(diff)
        })
    }

    private activateUserMedia() {
        return navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        })
    }

    private async registerConn(dataConn: DataConnection, mediaConn: MediaConnection) {
        let uid = dataConn.peer

        if (this.conns.get(uid)) {
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

            this.applyLocalDb(diff)
        }

        dataConn.on('data', onData)

        let onOpen = await whenOpen(dataConn)
        let stream = await whenStreaming(mediaConn)
        console.log(`✰ ${uid}; connected, checking neighbors...`)

        dataConn.dataChannel.onclose = () => {
            this.unregisterConn(dataConn)
        }

        console.log(`conns ← ${uid}`)
        this.conns.set(uid, {
            dataConn,
            stream,
            onData,
            onOpen,
        })
        console.log(`conns: ${JSON.stringify(Object.keys(this.conns))}`)

        this.conns[uid].dataConn.send({ '⨝': { x: 1, y: 2 } })
        this.Add(this.db)
    }

    unregisterConn(dataConn: DataConnection) {
        let uid = dataConn.peer

        let { onOpen, onData } = this.conns[uid]

        dataConn.off('open', onOpen)
        dataConn.off('data', onData)
        delete dataConn.dataChannel.onclose

        console.log(`conns ✘ ${uid}`)
        delete this.conns[uid]
        console.log(`conns: ${JSON.stringify(Object.keys(this.conns))}`)

        this.cleanDb(uid)
    }

    private cleanDb(uid: string) {
        console.log(`db ✘ ${JSON.stringify(uid)}`)
        this.cleanDb_helper(uid, this.db)
        console.log(`db: ${JSON.stringify(this.db, null, 2)}`)

        this.fire(__)
    }
    private cleanDb_helper(uid: string, db: any) {
        if (typeof db !== 'object' || !db) return

        delete db[uid]

        for (let key in db) {
            this.cleanDb_helper(uid, db[key])
        }
    }

    private applyLocalDb(diff: any) {
        if (
            !diff
            || this.db === diff
            || !Object.keys(diff).length
        ) return

        console.log(`db ← ${JSON.stringify(diff)}`)
        this.db = merge(this.db, diff)
        console.log(`db: ${JSON.stringify(this.db, null, 2)}`)

        this.fire(__)
    }

    private fire(path: any) {
        let ev = JSON.stringify(path)
        for (let i in this.evs.get(ev)) {
            this.evs.get(ev)[i](this.db)
        }
    }
}

const __: any = '\u0007'

function pseudoUID() {
    return Math.random()
        .toString(36)
        .substr(2, 5)
}

function whenOpen(dataConn: DataConnection): Promise<() => void> {
    return new Promise(
        (resolve) => {
            let onOpen = () => resolve(onOpen)
            dataConn.on('open', onOpen)
        }
    )
}

function whenStreaming(mediaConn: MediaConnection): Promise<MediaStream> {
    return new Promise(
        (resolve) => mediaConn.on('stream', resolve)
    )
}

function blankKeyPath(path: any) {
    if (path === __) return []
    if (typeof path !== 'object' && path) return [__]
    let [[k, v]] = Object.entries(path)
    if (v === __) return [k]
    return [k, ...blankKeyPath(v)]
}

function getBlank(obj: any, path: any) {
    return getBlank_helper(obj, blankKeyPath(path))
}
function getBlank_helper(obj: any, keyPath: any) {
    if (!keyPath.length) return obj
    let [key, ...rest] = keyPath
    if (!rest.length) return obj[key]
    return getBlank_helper(obj[key], rest)
}

export default Chestnut
