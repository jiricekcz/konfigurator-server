import ws from "ws";
import path from 'path';
import fs from 'fs';
import ShardManager from "./shardManager";

const options = JSON.parse(fs.readFileSync(path.join(__dirname, './options.json')).toString());export function init(): void {

}
export const server = new ws.Server({
    port: options.wsPort,
});
export const shards = new ShardManager();

server.on("connection", socket => {
    shards.addSocket(socket);
})