import * as dam from '../dataAccessModule'
import shard from '../shard';


export async function create(data: any, owner: string): Promise<boolean> {
    if (!data.name) return false;
    const name = data.name;
    await dam.Project.create(owner, name);
    return true;
}
export async function save(data: any, email: string): Promise<boolean> {
    if (!data.id) return false;
    const p = await dam.Project.fromID(data.id);
    if (!p || p.owner !== email && !p.editors.includes(email)) return false;
    await p.save();
    return true;
}
export async function udpate(id: string, data: string, email?: string): Promise<boolean> {
    if (!id || !data || !email) return false;
    const p = await dam.Project.fromID(id);
    if (!p || (p.owner !== email && !p.editors.includes(email))) return false;
    var prev = p.file;
    p.update(data);
    if (p.file == prev) return false;
    return true;
}
export async function getOwnedIDs(email: string): Promise<Array<string>> {
    return await dam.Project.getOwnedIDs(email);
}
export async function getProjectDetails(data: any): Promise<dam.Project | null> {
    return await dam.Project.fromID(data.id);
}