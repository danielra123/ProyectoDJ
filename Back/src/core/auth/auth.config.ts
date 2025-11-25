import { betterAuth } from "better-auth";
import { Database } from "bun:sqlite";

// Crear la instancia de base de datos SQLite
const db = new Database("database.SQLite");

// Crear tabla de usuarios si no existe
db.run(`
  CREATE TABLE IF NOT EXISTS user (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    emailVerified INTEGER DEFAULT 0,
    image TEXT,
    createdAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL
  )
`);

// Crear tabla de sesiones si no existe
db.run(`
  CREATE TABLE IF NOT EXISTS session (
    id TEXT PRIMARY KEY,
    expiresAt INTEGER NOT NULL,
    ipAddress TEXT,
    userAgent TEXT,
    userId TEXT NOT NULL,
    token TEXT NOT NULL,
    createdAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL,
    FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE
  )
`);

// Crear tabla de cuentas si no existe
db.run(`
  CREATE TABLE IF NOT EXISTS account (
    id TEXT PRIMARY KEY,
    accountId TEXT NOT NULL,
    providerId TEXT NOT NULL,
    userId TEXT NOT NULL,
    accessToken TEXT,
    refreshToken TEXT,
    idToken TEXT,
    expiresAt INTEGER,
    password TEXT,
    createdAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL,
    FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE
  )
`);

// Crear tabla de verificación si no existe
db.run(`
  CREATE TABLE IF NOT EXISTS verification (
    id TEXT PRIMARY KEY,
    identifier TEXT NOT NULL,
    value TEXT NOT NULL,
    expiresAt INTEGER NOT NULL
  )
`);

// Función auxiliar para mapear snake_case a camelCase y convertir timestamps a Date
function toCamelCase(obj: any) {
    if (!obj || typeof obj !== 'object') return obj;

    const newObj: any = {};
    for (const key in obj) {
        const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
        const value = obj[key];

        // Convert timestamps back to Date objects
        if ((camelKey === 'createdAt' || camelKey === 'updatedAt' || camelKey === 'expiresAt') && typeof value === 'number') {
            newObj[camelKey] = new Date(value * 1000);
        }
        // Convert integers back to booleans for specific fields
        else if (camelKey === 'emailVerified' && typeof value === 'number') {
            newObj[camelKey] = value === 1;
        }
        else {
            newObj[camelKey] = value;
        }
    }
    return newObj;
}

// Configuración de better-auth con adaptador personalizado
export const auth = betterAuth({
    database: () => ({
        create: async ({ model, data }) => {
            try {
                // Generate ID if not provided
                if (!data.id) {
                    data.id = crypto.randomUUID();
                }

                // Convert Date objects to Unix timestamps and filter undefined values
                const processedData: any = {};
                for (const [key, value] of Object.entries(data)) {
                    if (value !== undefined) {
                        if (value instanceof Date) {
                            processedData[key] = Math.floor(value.getTime() / 1000);
                        } else if (typeof value === 'boolean') {
                            processedData[key] = value ? 1 : 0;
                        } else {
                            processedData[key] = value;
                        }
                    }
                }

                const keys = Object.keys(processedData);
                const values = Object.values(processedData);
                const placeholders = keys.map(() => '?').join(', ');
                const sql = `INSERT INTO ${model} (${keys.join(', ')}) VALUES (${placeholders})`;
                const stmt = db.prepare(sql);
                stmt.run(...values);
                return toCamelCase(data);
            } catch (error) {
                console.error('Error creating record:', error);
                console.error('Model:', model);
                console.error('Data:', data);
                throw error;
            }
        },
        findOne: async ({ model, where }) => {
            try {
                // Handle both array format and object format
                let whereObj: any = {};
                if (Array.isArray(where)) {
                    // Convert array of {field, value} to object
                    for (const condition of where) {
                        whereObj[condition.field] = condition.value;
                    }
                } else {
                    whereObj = where;
                }

                const whereKeys = Object.keys(whereObj);
                const whereValues = Object.values(whereObj);
                const whereClauses = whereKeys.map(key => `${key} = ?`).join(' AND ');
                const sql = `SELECT * FROM ${model} WHERE ${whereClauses} LIMIT 1`;
                const stmt = db.prepare(sql);
                const result = stmt.get(...whereValues);
                return result ? toCamelCase(result) : null;
            } catch (error) {
                console.error('Error finding one:', error);
                return null;
            }
        },
        findMany: async ({ model, where, limit, offset, sortBy }) => {
            try {
                let sql = `SELECT * FROM ${model}`;
                const values: any[] = [];

                if (where && ((Array.isArray(where) && where.length > 0) || (!Array.isArray(where) && Object.keys(where).length > 0))) {
                    // Handle both array format and object format
                    let whereObj: any = {};
                    if (Array.isArray(where)) {
                        // Convert array of {field, value} to object
                        for (const condition of where) {
                            whereObj[condition.field] = condition.value;
                        }
                    } else {
                        whereObj = where;
                    }

                    const whereKeys = Object.keys(whereObj);
                    const whereClauses = whereKeys.map(key => `${key} = ?`).join(' AND ');
                    sql += ` WHERE ${whereClauses}`;
                    values.push(...Object.values(whereObj));
                }

                if (sortBy) {
                    const field = Object.keys(sortBy)[0];
                    const direction = sortBy[field] === 'desc' ? 'DESC' : 'ASC';
                    sql += ` ORDER BY ${field} ${direction}`;
                }

                if (limit) sql += ` LIMIT ${limit}`;
                if (offset) sql += ` OFFSET ${offset}`;

                const stmt = db.prepare(sql);
                const results = stmt.all(...values);
                return results.map(toCamelCase);
            } catch (error) {
                console.error('Error finding many:', error);
                return [];
            }
        },
        update: async ({ model, where, update }) => {
            try {
                // Process update data (convert dates and booleans)
                const processedUpdate: any = {};
                for (const [key, value] of Object.entries(update)) {
                    if (value !== undefined) {
                        if (value instanceof Date) {
                            processedUpdate[key] = Math.floor(value.getTime() / 1000);
                        } else if (typeof value === 'boolean') {
                            processedUpdate[key] = value ? 1 : 0;
                        } else {
                            processedUpdate[key] = value;
                        }
                    }
                }

                const updateKeys = Object.keys(processedUpdate);
                const updateValues = Object.values(processedUpdate);
                const setClauses = updateKeys.map(key => `${key} = ?`).join(', ');
                const whereKeys = Object.keys(where);
                const whereValues = Object.values(where);
                const whereClauses = whereKeys.map(key => `${key} = ?`).join(' AND ');
                const sql = `UPDATE ${model} SET ${setClauses} WHERE ${whereClauses}`;
                const stmt = db.prepare(sql);
                stmt.run(...updateValues, ...whereValues);

                // Retornar el registro actualizado
                const selectSql = `SELECT * FROM ${model} WHERE ${whereClauses} LIMIT 1`;
                const selectStmt = db.prepare(selectSql);
                const result = selectStmt.get(...whereValues);
                return result ? toCamelCase(result) : null;
            } catch (error) {
                console.error('Error updating:', error);
                throw error;
            }
        },
        delete: async ({ model, where }) => {
            try {
                const whereKeys = Object.keys(where);
                const whereValues = Object.values(where);
                const whereClauses = whereKeys.map(key => `${key} = ?`).join(' AND ');
                const sql = `DELETE FROM ${model} WHERE ${whereClauses}`;
                const stmt = db.prepare(sql);
                stmt.run(...whereValues);
            } catch (error) {
                console.error('Error deleting:', error);
                throw error;
            }
        }
    }),
    emailAndPassword: {
        enabled: true,
        autoSignIn: true,
        minPasswordLength: 8,
        maxPasswordLength: 128
    },
    session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 días
        updateAge: 60 * 60 * 24, // 1 día
        cookieCache: {
            enabled: true,
            maxAge: 5 * 60 // 5 minutos
        }
    },
    user: {
        additionalFields: {}
    },
    trustedOrigins: ["http://localhost:5173"],
    secret: process.env.BETTER_AUTH_SECRET!,
    baseURL: process.env.BETTER_AUTH_URL!
});

export type Session = typeof auth.$Infer.Session;
