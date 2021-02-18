const url = "20.71.220.144:3000";
const wsURL = "ws://" + url;
class Shard {
    static count = 0;
    readonly id: number = ++Shard.count;
    lastRUUID: number = 0;
    readonly url: string;
    socket: WebSocket;
    messageAwaiters: Array<MessageAwaiter> = [];
    constructor(url: string = wsURL) {
        this.url = url;
        this.socket = new WebSocket(this.url);
        this.init();

        setInterval(async () => {
            console.log(`Shard${this.id}: Ping to the server was ${(await this.ping()) ? "successful" : "unsuccessful"}.`);
        }, 5 * 1000);
    }
    private init() {
        this.socket = new WebSocket(this.url);
        this.socket.onerror = () => {
            this.init();
        }
        this.socket.onclose = () => {
            this.init();
        }
        this.socket.onmessage = msg => {
            var d = JSON.parse(msg.data);
            for (const a of this.messageAwaiters) {
                if (a.evaluate(d)) this.messageAwaiters.splice(this.messageAwaiters.indexOf(a), 1);
            }
        }
    }
    sendMessage(action: string, message: any = ""): void {
        this.send({ action, type: "message", data: message });
    }
    sendRequest(action: string, message: any = ""): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            const ruuid = ++this.lastRUUID;
            this.send({ action, type: "request", data: message, ruuid });
            this.messageAwaiters.push(new MessageAwaiter(ruuid, resolve));
            return;
        })
    }
    close(): void {
        this.socket.onclose = () => { };
        this.socket.close();
    }
    private send(data: any): void {
        this.socket.send(JSON.stringify(data));
    }
    async ping(): Promise<boolean> {
        return !!(await this.sendRequest("ping"));
    }
}
class MessageAwaiter {
    readonly ruuid: number;
    readonly resolve: (body: any) => void;
    constructor(ruuid: number, resolve: (body: any) => void) {
        this.resolve = resolve;
        this.ruuid = ruuid;
    }
    evaluate(message: any): boolean {
        if (message.ruuid = this.ruuid) {
            this.resolve(message.body);
            return true;
        }
        return false;
    }
}