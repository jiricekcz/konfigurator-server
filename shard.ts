import ws from "ws";
export default class Shard {
    readonly socket: ws;
    data: SocketData;
    constructor(socket: ws) {
        this.socket = socket;
        this.data = {};
        socket.on("ping", () => {
            socket.pong();
        });
        socket.on("message", async msg => {
            var data: DataObject;
            try {
                data = JSON.parse(msg.toString());
            } catch (e) {
                this.send({ success: false, message: "Server does not accept non-JSON data." });
                return;
            }
            if (!data.type || !["request", "message", "event"].includes(data.type)) return this.send({ success: false, message: "Type must be either \"request\", \"event\" or \"message\"." });

            if (data.type == "event") {
                if (!data.event) return this.send({ success: false, message: "Event name must be provided." });
                eventHandler(data.event, data.args || []);
                return;
            }
            if (!data.action) return this.send({ success: false, message: "Action needs to be provided." });
            if (data.type == "message") {
                messageHandler(data.action, data.data);
            } else {
                if (!data.ruuid) return this.send({ success: false, message: "RUUID must be provided for unique identification of a request." });
                const ruuid = data.ruuid;
                const resp = await requestHandler(data.action, data.data.body);
                const obj = { success: true, ruuid, body: resp };
                this.send(obj);
                return;
            }
        });
    }
    send(object: any): void {
        this.socket.send(JSON.stringify(object));
    }
    emit(eventName: string, ...args: any[]): void {
        this.send({
            type: "event",
            event: eventName,
            args
        });
    }
}
function messageHandler(action: string, message: any): void {
    console.log(action + ": " + message);
}
async function requestHandler(action: string, data: any): Promise<any> {
    switch (action) {
        case "ping": return "Pong!";
    }
}
async function eventHandler(event: string, args: any[]): Promise<void> {

}
interface DataObject {
    action?: string;
    type?: "request" | "message" | "event";
    data?: any;
    ruuid?: number;
    event?: string;
    args?: Array<any>;
}
interface SocketData {
    email?: string;
    authorized?: boolean;
}