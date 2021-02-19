import * as dam from '../dataAccessModule'


export async function create(data: any, owner: string): Promise<boolean> {
    if (!data.name) return false;
    const name = data.name;
    await dam.Project.create(owner, name);
    return true; 
}
export async function save(data: any): Promise<boolean> {
    if (!data.id) return false;
    const p = await dam.Project.fromID(data.id);
    if (!p) return false;
    await p.save();
    return true;
}