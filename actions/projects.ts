import * as dam from '../dataAccessModule'

export async function fork(id: string, email: string): Promise<string> {
    const p = await dam.Project.fromID(id);
    if (!p) return "";
    const pn = await p.fork(email);
    return pn.id;
}
export async function create(data: any, owner: string): Promise<string> {
    if (!data.name) return "";
    const name = data.name;
    const p = await dam.Project.create(owner, name);
    return p.id;
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