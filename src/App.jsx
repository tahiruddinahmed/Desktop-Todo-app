import { useEffect, useState } from "react";
import "./App.css";
import { addTodo, deleteTodo, getTodos, setTodoStatus } from "./db";

const COLUMNS = [
  { id: "open", label: "Open", tone: "open" },
  { id: "in_progress", label: "In Progress", tone: "progress" },
  { id: "completed", label: "Completed", tone: "completed" },
  { id: "cancelled", label: "Cancelled", tone: "cancelled" },
];

const STATUS_TONE = Object.fromEntries(
  COLUMNS.map((column) => [column.id, column.tone]),
);

function CalendarIcon() {
  return (
    <svg
      className="calendar-icon"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

function App() {
  const [text, setText] = useState("");
  const [todos, setTodos] = useState([]);
  const [error, setError] = useState(null);
  const [draggingId, setDraggingId] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);

  async function refresh() {
    try {
      const rows = await getTodos();
      setTodos(rows);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleTodoSubmit(e) {
    e.preventDefault();
    const trimmedText = text.trim();
    if (!trimmedText) return;

    try {
      await addTodo(trimmedText);
      setText("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function moveTodo(todo, status) {
    if (todo.status === status) return;
    try {
      await setTodoStatus(todo.id, status);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function handleTodoDelete(todo) {
    try {
      await deleteTodo(todo.id);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  function handleDragStart(e, todo) {
    setDraggingId(todo.id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(todo.id));
  }

  function handleDragEnd() {
    setDraggingId(null);
    setDropTarget(null);
  }

  function handleDragOver(e, status) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dropTarget !== status) setDropTarget(status);
  }

  function handleDragLeave(e, status) {
    if (!e.currentTarget.contains(e.relatedTarget) && dropTarget === status) {
      setDropTarget(null);
    }
  }

  async function handleDrop(e, status) {
    e.preventDefault();
    const id = Number(e.dataTransfer.getData("text/plain"));
    const todo = todos.find((item) => item.id === id);
    setDraggingId(null);
    setDropTarget(null);
    if (!todo) return;
    await moveTodo(todo, status);
  }

  const counts = COLUMNS.reduce((acc, column) => {
    acc[column.id] = todos.filter((todo) => todo.status === column.id).length;
    return acc;
  }, {});

  const activeCount = counts.open + counts.in_progress;

  const formatTodoDate = (dateString) => {
    const date = new Date(dateString);
    
    // 1. Get the day and add the ordinal suffix (st, nd, rd, th)
    const day = date.getDate();
    const j = day % 10, k = day % 100;
    let suffix = "th";
    if (j === 1 && k !== 11) suffix = "st";
    else if (j === 2 && k !== 12) suffix = "nd";
    else if (j === 3 && k !== 13) suffix = "rd";
    
    // 2. Format the month (Nov) and last 2 digits of the year (25)
    const month = date.toLocaleString('en-US', { month: 'short' });
    const year = date.toLocaleString('en-US', { year: '2-digit' });
    
    // 3. Format the time and strip spaces to get "03:48PM"
    const time = date.toLocaleString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: true 
    }).replace(/\s+/g, ''); // Removes spaces before AM/PM
  
    return `${day}${suffix} ${month}, ${year}, ${time}`;
  };
  

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-copy">
          <h1>Todo</h1>
          <p className="header-meta">
            {todos.length === 0
              ? "Nothing on the board yet"
              : `${activeCount} active · ${counts.completed} done`}
          </p>
        </div>
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

      {error ? (
        <div className="app-error" role="alert">
          <p className="app-error-title">Couldn’t reach the database</p>
          <p className="app-error-copy">{error}</p>
        </div>
      ) : null}

      <section className="board" aria-label="Kanban board">
        {COLUMNS.map((column) => {
          const columnTodos = todos.filter((todo) => todo.status === column.id);
          const isDropActive = dropTarget === column.id;

          return (
            <div
              key={column.id}
              className={`column tone-${column.tone}${isDropActive ? " is-drop-target" : ""}`}
              onDragOver={(e) => handleDragOver(e, column.id)}
              onDragLeave={(e) => handleDragLeave(e, column.id)}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              <header className="column-header">
                <h2>{column.label}</h2>
                <span className="column-count" aria-label={`${columnTodos.length} tasks`}>
                  {columnTodos.length}
                </span>
              </header>

              <ul className="column-list">
                {columnTodos.length === 0 ? (
                  <li className="column-empty">Drop tasks here</li>
                ) : (
                  columnTodos.map((todo) => (
                    <li
                      key={todo.id}
                      className={`card tone-${STATUS_TONE[todo.status]}${draggingId === todo.id ? " is-dragging" : ""}`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, todo)}
                      onDragEnd={handleDragEnd}
                    >
                      <p className="card-text">{todo.text}</p>

                      <div className="card-actions">
                        <time
                          className="card-date"
                          dateTime={todo.created_at}
                        >
                          <CalendarIcon />
                          <span>{formatTodoDate(todo.created_at)}</span>
                        </time>

                        <button
                          type="button"
                          className="delete-btn"
                          onClick={() => handleTodoDelete(todo)}
                          aria-label={`Delete ${todo.text}`}
                        >
                          Remove
                        </button>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>
          );
        })}
      </section>
    </div>
  );
}

export default App;
