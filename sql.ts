import mysql from 'mysql';
import path from 'path';
import fs from 'fs';

const options = JSON.parse(fs.readFileSync(path.join(__dirname, './options.json')).toString());

export const pool = mysql.createPool(options.mysql);

export function query(sql: string): Promise<Array<any>> {
    return new Promise<Array<any>>((resolve, reject) => {
        try {
            pool.query(sql, (err, result) => {
                if (err) return reject(err);
                return resolve(result);
            });
        } catch (err) {
            throw new Error("SQL Query failed to execute. " + err);
        }
    })
    
}