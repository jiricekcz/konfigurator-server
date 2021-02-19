import bcrypt from "bcrypt";

import * as sql from "./sql";

export async function init(): Promise<any> {
    return await sql.init();
}
export async function createUser(email: string, name: string, password: string): Promise<void> {
    const passwordHash = bcrypt.hashSync(password, 12);
    const q = `INSERT INTO users (email, name, passwordHash, emailVerified) VALUES ("${email}", "${name}", "${passwordHash}", 0)`;
    return void await sql.query(q);
}
export async function checkLogin(email: string, password: string): Promise<boolean> {
    const q = `SELECT passwordHash FROM users WHERE email = "${email}";`;
    const r = await sql.query(q);
    if (r.length == 0) return false;
    return bcrypt.compareSync(password, r[0].passwordHash);
}
export async function getAllEmails(): Promise<Array<string>> {
    const q = `SELECT email FROM users;`;
    return (await sql.query(q)).map(h => h.email);
}
