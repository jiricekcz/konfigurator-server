import bcrypt from "bcrypt";

import crypto from "crypto";


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
export async function emailUsed(email: string): Promise<boolean> {
    const q = `SELECT email FROM users WHERE email = "${email}";`;
    return (await sql.query(q)).length > 0;
}
export async function deleteUser(email: string): Promise<void> {
    const q = `DELETE FROM users WHERE email = "${email}"`;
    return void await sql.query(q);
}
export async function getName(email: string): Promise<string> {
    const q = `SELECT name FROM users WHERE email = "${email}";`;
    return (await sql.query(q))[0].name;
}
export class Project {
    file: string;
    owner: string;
    editors: Array<string>;
    id: string;
    name: string;
    static readonly cache: any = {};
    constructor(file: string, owner: string, editors: Array<string>, id: string, name: string) {
        this.file = file;
        this.owner = owner;
        this.editors = editors;
        this.id = id;
        this.name = name;
        this.cache();
    }
    cache(): void {
        Project.cache[this.id] = this;
    }
    uncache(): void {
        delete Project.cache[this.id];
    }
    update(data: string): void {
        this.file = data;
    }
    async save(): Promise<void> {
        var q = `UPDATE projects SET owner="${this.owner}", editors="${this.editors}", content="${this.file}", name="${this.name}";`;
        return void await sql.query(q);
    }
    async delete(): Promise<void> {
        var q = `DELETE FROM projects WHERE id="${this.id}";`;
        return void await sql.query(q);
    }
    static async fromID(id: string): Promise<Project | null> {
        if (Project.cache[id]) return Project.cache[id];
        const q = `SELECT * FROM projects WHERE id = "${id}";`;
        var p = await sql.query(q);
        if (p.length != 1) return null;
        return new this(p[0].content, p[0].owner, JSON.parse(p[0].editors), p[0].id, p[0].name);
    }
    static async create(owner: string, name: string): Promise<Project> {
        const id = await Project.createID();
        const q = `INSERT INTO projects (owner, name, editors, content, id) VALUES ("${owner}", "${name}", "[]", "", "${id}")`;
        await sql.query(q);
        return new this("", owner, [], id, name);
    }
    static async getOwnedIDs(owner: string): Promise<Array<string>> {
        const q = `SELECT id FROM projects WHERE owner = "${owner}";`;
        return (await sql.query(q)).map(r => r.id);
    }
    private static async createID(): Promise<string> {
        const q = `SELECT id FROM projects;`;
        var p = (await sql.query(q)).map(r => r.id);
        var rv: string = crypto.randomBytes(64).toString("base64");
        while (p.includes(rv)) rv = crypto.randomBytes(64).toString("base64");
        return rv;
    }
}