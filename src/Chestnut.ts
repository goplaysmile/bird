import Peer, { MediaConnection } from "peerjs"

let chestnut: Chestnut

function defaultChestnut() {
    return new Chestnut()
}

export function Call(id: string) {
    chestnut = chestnut || defaultChestnut()
    return chestnut.Call(id)
}

class Chestnut {
    private peer: Peer

    constructor() {
        this.peer = new Peer()
        setTimeout(() => alert(this.peer.id), 1000)
        this.listen()
    }

    async Call(id: string) {
        try {
            let stream = await this.whenMediaStreams()

            let call = this.peer.call(id, stream)
            call.on("stream", this.handleStream.bind(this))
        } catch (e) {
            console.error("Chestnut: failed to call", e)
        }
    }

    private listen() {
        try {
            this.peer.on("call", this.handleCall.bind(this))
        }
        catch (e) {
            console.error("Chestnut: failed to listen", e)
        }

    }

    private async handleCall(call: MediaConnection) {
        try {
            let stream = await this.whenMediaStreams()

            call.answer(stream)
            call.on("stream", this.handleStream.bind(this))
        } catch (e) {
            console.error("Chestnut: failed to handle call", e)
        }
    }

    private whenMediaStreams() {
        try {
            return navigator.mediaDevices.getUserMedia({
                video: true, audio: true
            })
        } catch (e) {
            console.error("Chestnut: failed to get user media", e)
        }
    }

    private handleStream(stream: MediaStream) {
        try {
            console.log("Chestnut: handling stream...")
        } catch (e) {
            console.error("Chestnut: failed to handle stream", e)
        }
    }
}
