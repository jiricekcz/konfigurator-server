import ws from "ws";
import Shard from "./shard";
export default class ShardManager extends Array<Shard>{
    constructor () {
        super();
    }
    addShard(shard: Shard): void {
        this.push(shard);
    }
    addSocket(socket: ws): void {
        this.push(new Shard(socket));
    }
}