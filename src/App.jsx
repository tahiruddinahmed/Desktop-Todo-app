import { useEffect, useState } from "react";
import "./App.css";
import { addTodo, deleteTodo, getTodos, toggleTodo } from "./db";

function App() {
  const [text, setText] = useState("");
  const [todos, setTodos] = useState([]);

  async function refresh() {
    const rows = await getTodos();
    setTodos(rows);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleTodoSubmit(e) {
    e.preventDefault();
    const trimmedText = text.trim();

    if (!trimmedText) return;

    await addTodo(trimmedText);
    setText("");
    await refresh();
  }

  async function handleTodoToggle(todo) {
    await toggleTodo(todo.id, !todo.done);
    await refresh();
  }

  async function handleTodoDelete(todo) {
    await deleteTodo(todo.id);
    await refresh();
  }

  const remaining = todos.filter((todo) => !todo.done).length;
  const completed = todos.length - remaining;

  return (
    <div className="app">
      <header className="app-header">
        <h1>Todo</h1>
      </header>

      <form className="composer" onSubmit={handleTodoSubmit}>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.currentTarget.value)}
          placeholder="Add a task…"
          aria-label="New task"
          autoFocus
        />
        <button type="submit" disabled={!text.trim()}>
          Add
        </button>
      </form>

      <section className="list-panel" aria-label="Task list">
        <div className="list-meta">
          <h2>Your tasks</h2>
          <p className="status">
            {todos.length === 0
              ? "Nothing queued yet"
              : `${remaining} open · ${completed} done`}
          </p>
        </div>

        {todos.length === 0 ? (
          <div className="empty">
            <p className="empty-title">Your list is clear</p>
            <p className="empty-copy">Type above to capture the next thing.</p>
          </div>
        ) : (
          <ul className="todo-list">
            {todos.map((todo) => (
              <li
                className={`todo-item${todo.done ? " is-done" : ""}`}
                key={todo.id}
              >
                <label className="todo-check">
                  <input
                    type="checkbox"
                    checked={todo.done}
                    onChange={() => handleTodoToggle(todo)}
                  />
                  <span className="checkmark" aria-hidden="true" />
                  <span className="todo-text">{todo.text}</span>
                </label>
                <button
                  type="button"
                  className="delete-btn"
                  onClick={() => handleTodoDelete(todo)}
                  aria-label={`Delete ${todo.text}`}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default App;
