import crypto from 'crypto';


export const keys: any = {};
export function createKey(data: SocketData): string {
    var key = crypto.randomBytes(64).toString("base64");
    while(keys[key] !== undefined) key = crypto.randomBytes(64).toString("base64");
    keys[key] = Object.assign<EmptyObject, SocketData>({}, data);
    return key;
}
export function getDataFromKey(key: string): SocketData {
    return keys[key] || {};
}
interface EmptyObject {

}

interface SocketData {
    email?: string;
    authorized?: boolean;
}