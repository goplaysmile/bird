import Peer, { MediaConnection } from "peerjs"

export default class Chestnut {
    OurStream: Promise<MediaStream>
    private ourStreamResolver: (stream: MediaStream) => void
    TheirStream: Promise<MediaStream>
    private theirStreamResolver: (stream: MediaStream) => void

    private peer: Peer

    constructor() {
        this.OurStream = new Promise(
            (resolve) => this.ourStreamResolver = resolve
        )
        this.TheirStream = new Promise(
            (resolve) => this.theirStreamResolver = resolve
        )

        this.peer = new Peer()

        setTimeout(() => {
            alert(this.peer.id)
            console.log(this.peer.id)
        }, 500)

        this.listen()
    }

    async Call(id: string) {
        console.log("Chestnut: calling...")
        try {
            let stream = await this.whenMediaStreams()

            let call = this.peer.call(id, stream)
            call.on("stream", this.handleStream.bind(this))
        } catch (e) {
            console.error("Chestnut: failed to call", e)
        }
    }

    private listen() {
        console.log("Chestnut: listening...")
        try {
            this.peer.on("call", this.handleCall.bind(this))
        }
        catch (e) {
            console.error("Chestnut: failed to listen", e)
        }

    }

    private async handleCall(call: MediaConnection) {
        console.log("Chestnut: handling call...")
        try {
            let stream = await this.whenMediaStreams()

            call.answer(stream)
            call.on("stream", this.handleStream.bind(this))
        } catch (e) {
            console.error("Chestnut: failed to handle call", e)
        }
    }

    private whenMediaStreams() {
        console.log("Chestnut: starting user media stream...")
        try {
            return new Promise<MediaStream>(async (resolve, reject) => {
                try {
                    let stream = await navigator.mediaDevices.getUserMedia({
                        video: true,
                        audio: true,
                    })
                    resolve(stream)
                    this.ourStreamResolver(stream)
                } catch (e) {
                    reject(e)
                }
            })
        } catch (e) {
            console.error("Chestnut: failed to get user media", e)
        }
    }

    private handleStream(stream: MediaStream) {
        console.log(`Chestnut: handling ${stream.id} stream...`)
        try {
            let resolve = this.theirStreamResolver
            this.TheirStream = new Promise((resolve) => {
                this.theirStreamResolver = resolve
            })
            resolve(stream)
        } catch (e) {
            console.error("Chestnut: failed to handle stream", e)
        }
    }
}
