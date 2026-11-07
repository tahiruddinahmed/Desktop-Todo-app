import Database from "@tauri-apps/plugin-sql";

let db;

export async function getDb() {
  if (!db) {
    db = await Database.load("sqlite:todos.db");
    await db.execute(`
      CREATE TABLE IF NOT EXISTS todos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        text TEXT NOT NULL,
        done INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }
  return db;
}

export async function getTodos() {
  const database = await getDb();
  return database.select("SELECT id, text, done FROM todos ORDER BY id DESC");
}

export async function addTodo(text) {
  const database = await getDb();
  await database.execute("INSERT INTO todos (text, done) VALUES ($1, 0)", [text]);
}

export async function toggleTodo(id, done) {
  const database = await getDb();
  await database.execute("UPDATE todos SET done = $1 WHERE id = $2", [
    done ? 1 : 0,
    id,
  ]);
}

export async function deleteTodo(id) {
  const database = await getDb();
  await database.execute("DELETE FROM todos WHERE id = $1", [id]);
}