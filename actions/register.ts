import * as dam from '../dataAccessModule';


export default async function register(data: any): Promise<boolean> { 
    if (!data.email || !data.name || !data.password) return false;
    if (await dam.emailUsed(data.email)) return false;
    await dam.createUser(data.email, data.name, data.password);
    return true;
}