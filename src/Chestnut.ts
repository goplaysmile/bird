import Peer, { MediaConnection } from "peerjs"

type UserStream = { id: string, stream: MediaStream }
type StreamResolver = (payload: UserStream) => void

class ChestnutStream {
    Stream: Promise<UserStream>

    private resolver: (payload: UserStream) => void

    protected get Resolver() {
        let resolve = this.resolver
        this.Stream = new Promise(
            (resolve) => this.resolver = resolve
        )
        return resolve
    }

    protected set Resolver(value: StreamResolver) {
        this.resolver = value
    }
}

export default class Chestnut extends ChestnutStream {

    private peer: Peer

    constructor() {
        super()

        this.handleStream.bind(this)

        this.Stream = new Promise(
            (resolve) => this.Resolver = resolve
        )

        this.peer = new Peer()

        setTimeout(() => {
            alert(this.peer.id)
            console.log(this.peer.id)
        }, 500)

        this.listen()
    }

    get ID(): string {
        return this.peer.id
    }

    async Call(id: string) {
        console.log("Chestnut: calling...")
        try {
            let stream = await this.whenMediaStreams()

            let call = this.peer.call(id, stream)
            call.on(
                "stream",
                (stream) => this.handleStream(id, stream)
            )
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
            call.on(
                "stream",
                (stream) => this.handleStream(call.peer, stream)
            )
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
                    this.Resolver({ id: this.ID, stream })
                } catch (e) {
                    reject(e)
                }
            })
        } catch (e) {
            console.error("Chestnut: failed to get user media", e)
        }
    }

    private handleStream(id: string, stream: MediaStream) {
        console.log(`Chestnut: handling ${stream.id} stream...`)
        try {
            this.Resolver({ id, stream })
        } catch (e) {
            console.error("Chestnut: failed to handle stream", e)
        }
    }
}
