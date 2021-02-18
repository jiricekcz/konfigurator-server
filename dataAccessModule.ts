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
export async function getAllEmails(): Promise<Array<string>> {
    const q = `SELECT email FROM users;`;
    return await sql.query(q);
}
