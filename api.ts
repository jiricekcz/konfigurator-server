const url = "dachkonfigurator.kantmanufaktur.com:3000";
const wsURL = "wss://" + url;
class Shard {
    static count = 0;
    readonly id: number = ++Shard.count;
    lastRUUID: number = 0;
    readonly url: string;
    socket: WebSocket;
    buffer: Array<any> = [];
    messageAwaiters: Array<MessageAwaiter> = [];
    onMessage: (data: string) => void = (data: string) => void 0;
    constructor(url: string = wsURL) {
        this.url = url;
        this.socket = new WebSocket(this.url);
        this.init();
    
        const t = this;
        setInterval(async () => {
            const pingResult = (await t.ping());
            console.log(`Shard${t.id}: Ping to the server was ${pingResult ? "successful" : "unsuccessful"}.`);
            if (!pingResult) {
                t.init();
            }
        }, 5 * 1000);
    }
    private init() {
        this.socket.onclose = () => { };
        this.socket.close();
        this.socket = new WebSocket(this.url);
        this.socket.onopen = () => {
            this.ping();
        }
        this.socket.onerror = () => {
            this.init();
        }
        this.socket.onclose = () => {
            this.init();
        }
        this.socket.onmessage = msg => {
            this.onMessage(msg.data);
            var d = JSON.parse(msg.data);
            for (const a of this.messageAwaiters) {
                if (a.evaluate(d)) this.messageAwaiters.splice(this.messageAwaiters.indexOf(a), 1);
            }
        }
    }
    sendMessage(action: string, message: any = ""): void {
        this.send({ action, type: "message", data: message });
    }
    emitEvent(event: "projectUpdated", id: string, file: string, partOfReverStack: boolean): void;
    emitEvent(event: string, ...args: any[]): void {
        this.send({ event, type: "event", args });
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
        var t = [...this.buffer];
        this.buffer = [];
        for (var h of t) {
            try {
                this.socket.send(JSON.stringify(h));
                this.buffer.splice(this.buffer.indexOf(h), 1);
            } catch (e) { }
        }
        try {
            this.socket.send(JSON.stringify(data));
        } catch (err) {
            this.buffer.push(data);
        }
    }
    async ping(): Promise<boolean> {
        return !!(await this.sendRequest("ping"));
    }
}


class Client {
    readonly shard: Shard;
    private readonly eventListeners: any = {};
    email: string | void = undefined;
    authorized: boolean = false;
    name?: string;
    constructor() {
        this.shard = new Shard();
        this.shard.onMessage = data => {
            const obj = JSON.parse(data);
            if (obj.type !== "event") return;
            this.emit(obj.event, ...obj.args);
        }
    }
    emit(event: string, ...args: any[]): void {
        if (!this.eventListeners[event]) this.eventListeners[event] = [];
        for (const c of this.eventListeners[event]) {
            c(...args);
        }
    }
    on(event: "listenerUpdate", callback: (id: string, type: "connected" | "disconnected", email?: string) => void): void;
    on(event: "projectUpdated", callback: (id: string, data: string, partOfReverStack: boolean) => void): void;
    on(event: string, callback: (...args: any[]) => void): void {
        if (!this.eventListeners[event]) this.eventListeners[event] = [];
        this.eventListeners[event].push(callback);
    }
    async login(email: string, password: string): Promise<boolean> {
        this.authorized = await this.shard.sendRequest("login", { email, password });
        if (this.authorized) this.email = email; else this.email = undefined;
        return this.authorized;
    }
    async register(email: string, name: string, password: string): Promise<boolean> {
        return await this.shard.sendRequest("registration", { email, name, password });
    }
    async createProject(name: string): Promise<string> {
        if (!this.authorized) throw new Error("Action requires authorization.");
        return await this.shard.sendRequest("createProject", { name });
    }
    async saveProject(id: string): Promise<boolean> {
        if (!this.authorized) throw new Error("Action requires authorization.");
        return await this.shard.sendRequest("saveProject", { id })
    }
    updateProject(id: string, data: string, partOfReverStack: boolean): void {
        if (!this.authorized) throw new Error("Action requires authorization.");
        return void this.shard.emitEvent("projectUpdated", id, data, partOfReverStack);
    }
    async addFileListener(id: string): Promise<boolean> {
        return await this.shard.sendRequest("listenForProjectUpdates", { id });
    }
    async removeFileListener(id: string): Promise<boolean> {
        return await this.shard.sendRequest("stopListenForProjectUpdates", { id });
    }
    async getOwnedProjectsIDs(): Promise<Array<string>> {
        if (!this.authorized) throw new Error("Action requires authorization.");
        return await this.shard.sendRequest("getMyProjectIDs");
    }
    async getProjectDetails(id: string): Promise<Project> {
        return await this.shard.sendRequest("getProjectDetails", { id });
    }
    async deleteAccount(): Promise<boolean> {
        if (!this.authorized) throw new Error("Action requires authorization.");
        return await this.shard.sendRequest("deleteAccount");
    }
    async generateKey(): Promise<string> {
        return await this.shard.sendRequest("generateKey");
    }
    async useKey(key: string): Promise<void> {
        var data = await this.shard.sendRequest("keyAuth", { key });
        if (data.authorized) this.authorized = true;
    }
    async getName(): Promise<string> {
        if (!this.authorized) throw new Error("Action requires authorization.");
        if (!this.name) this.name = await this.shard.sendRequest("getName");
        if (!this.name) throw new Error("Could not retrieve name.");
        return this.name;
    }
    async addEditorToProject(id: string, email: string): Promise<boolean> {
        if (!this.authorized) throw new Error("Action requires authorization.");
        return await this.shard.sendRequest("editShareProject", { id, email });
    }
    async removeEditorFromProject(id: string, email: string): Promise<boolean> {
        if (!this.authorized) throw new Error("Action requires authorization.");
        return await this.shard.sendRequest("removeEditorFromProject", { id, email });
    }
    async changeProjectName(id: string, name: string): Promise<boolean> {
        if (!this.authorized) throw new Error("Action requires authorization.");
        return await this.shard.sendRequest("changeProjectName", { id, name });
    }
    async transferProjectOwnership(id: string, email: string): Promise<boolean> {
        if (!this.authorized) throw new Error("Action requires authorization.");
        return await this.shard.sendRequest("transferProjectOwnership", { id, email });
    }
    async deleteProject(id: string): Promise<boolean> {
        if (!this.authorized) throw new Error("Action requires authorization.");
        return await this.shard.sendRequest("deleteProject", { id });
    }
    async getEmail(): Promise<string> {
        if (!this.authorized) throw new Error("Action requires authorization.");
        return await this.shard.sendRequest("getEmail");
    }
    async forkProject(id: string): Promise<string> {
        if (!this.authorized) throw new Error("Action requires authorization.");
        return await this.shard.sendRequest("forkProject", { id });
    }
    async restrictProjectEdit(id: string): Promise<boolean> {
        if (!this.authorized) throw new Error("Action requires authorization.");
        return await this.shard.sendRequest("restrictProjectEdit", { id });
    }
    async liftProjectEditRestriction(id: string): Promise<boolean> {
        if (!this.authorized) throw new Error("Action requires authorization.");
        return await this.shard.sendRequest("liftProjectEditRestriction", { id });
    }
    async getProjectListeners(id: string): Promise<Array<string>> {
        return await this.shard.sendRequest("getProjectListeners", { id });
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
        if (message.ruuid == this.ruuid) {
            this.resolve(message.body);
            return true;
        }
        return false;
    }
}
interface Project {
    owner: string;
    editors: Array<string>;
    file: string;
    name: string;
    id: string;
    editRestricted: boolean;
}
