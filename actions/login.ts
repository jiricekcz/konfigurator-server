import * as dam from '../dataAccessModule'


export default async function login(data: LoginData): Promise<boolean> {
    if (!data.email || !data.password) return false;
    return await dam.checkLogin(data.email, data.password);
}
interface LoginData {
    email?: string;
    password?: string;
}