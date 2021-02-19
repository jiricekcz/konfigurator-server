import sqlite3 from 'sqlite3';

export const database = new sqlite3.Database("database.sqlite3");
export function init(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        database.serialize(() => {
            resolve();
        })
    })
}
export function query(sql: string): Promise<Array<any>> {
    return new Promise<Array<any>>((resolve, reject) => {
        database.all(sql, (err, res) => {
            return resolve(res);
        })
    })
}