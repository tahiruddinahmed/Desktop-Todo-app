
import Database from "@tauri-apps/plugin-sql";

let db;

export async function getDb() {
  if (!db) {
    db = await Database.load("sqlite:todos.db");

    await db.execute(`
      CREATE TABLE IF NOT EXISTS todos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        text TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'open'
          CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')),
        created_at TIMESTAMP DEFAULT (datetime('now', 'localtime'))
      )
    `);
  }

  return db;
}

export async function getTodos() {
  const database = await getDb();

  return database.select(
    "SELECT id, text, status, created_at FROM todos ORDER BY id DESC"
  );
}

export async function addTodo(text) {
  const database = await getDb();

  await database.execute(
    "INSERT INTO todos (text, status) VALUES ($1, 'open')",
    [text]
  );
}

export async function setTodoStatus(id, status) {
  const database = await getDb();

  const allowedStatuses = [
    "open",
    "in_progress",
    "completed",
    "cancelled",
  ];

  if (!allowedStatuses.includes(status)) {
    throw new Error("Invalid todo status");
  }

  await database.execute(
    "UPDATE todos SET status = $1 WHERE id = $2",
    [status, id]
  );
}

export async function deleteTodo(id) {
  const database = await getDb();

  await database.execute("DELETE FROM todos WHERE id = $1", [id]);
}
