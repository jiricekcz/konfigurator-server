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
    console.log(shards);
    for (var i = 0; i < shards.length; i++) {
        if (shards[i].socket.readyState == shards[i].socket.CLOSED) shards.removeAt(i);
    }
    shards.addSocket(socket);
})