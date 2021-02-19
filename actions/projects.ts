import * as dam from '../dataAccessModule'


export async function create(data: any, owner: string): Promise<boolean> {
    if (!data.name) return false;
    const name = data.name;
    await dam.Project.create(owner, name);
    return true; 
}