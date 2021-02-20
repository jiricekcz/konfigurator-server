import ws from "ws";

import * as keyManager from "./keyManager";


import * as dam from "./dataAccessModule";


import * as projects from "./actions/projects";
import register from "./actions/register";
import login from "./actions/login";

const fileUpdateListeners: any = {};
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
                eventHandler(data.event, data.args || [], this);
                return;
            }
            if (!data.action) return this.send({ success: false, message: "Action needs to be provided." });
            if (data.type == "message") {
                messageHandler(data.action, data.data, this);
            } else {
                if (!data.ruuid) return this.send({ success: false, message: "RUUID must be provided for unique identification of a request." });
                const ruuid = data.ruuid;
                const resp = await requestHandler(data.action, data.data, this);
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
function messageHandler(action: string, message: any, shard: Shard): void {
    console.log(action + ": " + message);
}
async function requestHandler(action: string, data: any, shard: Shard): Promise<any> {
    shard.emit("gay", Math.random());
    console.log(action);
    switch (action) {
        case "ping": return "Pong!";
        case "login": {
            var auth = await login(data);
            shard.data.authorized = auth;
            shard.data.email = data.email;
            return auth;
        };
        case "registration": {
            return await register(data);
        }
        case "createProject": {
            if (!shard.data.authorized || !shard.data.email) return false;
            return await projects.create(data, shard.data.email);
        }
        case "saveProject": {
            if (!shard.data.authorized || !shard.data.email) return false;
            return await projects.save(data, shard.data.email);
        }
        case "listenForProjectUpdates": {
            if (!data.id) return false;
            const p = dam.Project.fromID(data.id);
            if (!p) return false;
            if (!fileUpdateListeners[data.id]) fileUpdateListeners[data.id] = [];
            fileUpdateListeners[data.id].push(shard);
            return true;
        }
        case "getMyProjectIDs": {
            if (!shard.data.authorized || !shard.data.email) return false;
            return await projects.getOwnedIDs(shard.data.email);
        }
        case "getProjectDetails": {
            return await projects.getProjectDetails(data);
        }
        case "deleteAccount": {
            if (!shard.data.authorized || !shard.data.email) return false;
            await dam.deleteUser(shard.data.email);
            return true;
        }
        case "keyAuth": {
            if (!data.key) return false;
            shard.data = keyManager.getDataFromKey(data.key);
            return shard.data;
        }
        case "generateKey": {
            return keyManager.createKey(shard.data);
        }
        case "getName": {
            if (!shard.data.authorized) return;
            if (!shard.data.email) return;
            return dam.getName(shard.data.email);
        }
        case "editShareProject": {
            if (!shard.data.authorized || !shard.data.email || !data.id || !data.email) return false;
            const p = await dam.Project.fromID(data.id);
            if (!p || p.owner !== shard.data.email) return false;
            if (!p.editors.includes(data.email)) p.editors.push(data.email);
            await p.save();
            return true;
        }
        case "transferOwnership": {
            if (!shard.data.authorized || !shard.data.email || !data.id || !data.email) return false;
            const p = await dam.Project.fromID(data.id);
            if (!p || p.owner !== shard.data.email) return false;
            p.owner = data.email;
            await p.save();
            return true;
        }
        case "changeProjectName": {
            if (!shard.data.authorized || !shard.data.email || !data.id || !data.name) return false;
            const p = await dam.Project.fromID(data.id);
            if (!p || (p.owner !== shard.data.email && !p.editors.includes(shard.data.email))) return false;
            p.name = data.name;
            await p.save();
            return true;
        }
        case "removeEditorFromProject": {
            if (!shard.data.authorized || !shard.data.email || !data.id || !data.email) return false;
            const p = await dam.Project.fromID(data.id);
            if (!p || p.owner !== shard.data.email) return false;
            if (p.editors.includes(data.email)) p.editors = p.editors.filter(e => e !== data.email);
            await p.save();
            return true;
        }
        case "deleteProject": {
            if (!shard.data.authorized || !shard.data.email || !data.id ) return false;
            const p = await dam.Project.fromID(data.id);
            if (!p || p.owner !== shard.data.email) return false;
            await p.delete();
            return true;
        }
        case "getEmail": {
            return shard.data.email;
        }
    }
}
async function eventHandler(event: string, args: any[], shard: Shard): Promise<void> {
    switch (event) {
        case "projectUpdated": {
            if (!shard.data.authorized) return;
            if (projects.udpate(args[0], args[1], shard.data.email)) emitFileChange(args[0], shard);
            return;
        }
    }
}
async function emitFileChange(id: string, shard: Shard): Promise<void> {
    if (!fileUpdateListeners[id]) fileUpdateListeners[id] = [];
    var p = await dam.Project.fromID(id);
    for (const s of fileUpdateListeners[id]) {
        if (s != shard) s.emit("projectUpdated", id, p?.file);
    }
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