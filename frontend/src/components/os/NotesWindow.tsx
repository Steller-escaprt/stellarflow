import React, { useState } from "react";

interface NoteItem {
  id: string;
  text: string;
  completed: boolean;
}

export function NotesWindow() {
  const [notes, setNotes] = useState<NoteItem[]>([
    {
      id: "note-1",
      text: "Configure recipient stream for Core Engineering Grant (10,000 USDC)",
      completed: true,
    },
    {
      id: "note-2",
      text: "Verify cliff delay parameters in Soroban contract escrow (Protocol 22)",
      completed: false,
    },
    {
      id: "note-3",
      text: "Execute multi-recipient DAO payroll batch CSV disbursement",
      completed: false,
    },
    {
      id: "note-4",
      text: "Monitor real-time micro-payment flow velocity on Stellar.Expert",
      completed: true,
    },
    {
      id: "note-5",
      text: "Test Freighter wallet instant withdrawal and balance claim",
      completed: false,
    },
  ]);

  const [inputText, setInputText] = useState("");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text) return;
    setNotes([
      ...notes,
      {
        id: `note-${Date.now()}`,
        text,
        completed: false,
      },
    ]);
    setInputText("");
  };

  const handleToggle = (id: string) => {
    setNotes(
      notes.map((n) => (n.id === id ? { ...n, completed: !n.completed } : n))
    );
  };

  const handleDelete = (id: string) => {
    setNotes(notes.filter((n) => n.id !== id));
  };

  const remaining = notes.filter((n) => !n.completed).length;

  return (
    <div className="space-y-4 font-mono text-xs max-w-xl mx-auto py-2">
      <div className="border_ui_b pb-3">
        <h3 className="text-base font-bold text-gray-900 dark:text-white uppercase tracking-wider">
          STREAM TASKS &amp; PAYROLL NOTES
        </h3>
        <p className="text-[11px] text-gray-500 font-sans mt-0.5">
          Local task checklist for tracking active disbursements, milestones, and audit items.
        </p>
      </div>

      {/* Add Todo Form */}
      <form onSubmit={handleAdd} className="flex items-center gap-2 border_ui rounded-lg p-2 bg-black/[0.02] dark:bg-white/[0.02]">
        <span className="text-purple-600 dark:text-purple-400 font-bold px-1">+</span>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="add a stream task and hit enter..."
          className="w-full bg-transparent text-xs text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none font-mono"
        />
        <button
          type="submit"
          className="px-2.5 py-1 rounded bg-purple-600 text-white font-bold text-[10px] uppercase hover:bg-purple-700 transition-colors"
        >
          Add
        </button>
      </form>

      {/* Notes List */}
      <div className="space-y-1.5 pt-1">
        {notes.map((note) => (
          <div
            key={note.id}
            className="flex items-center justify-between gap-3 p-2.5 rounded-lg border border-gray-200 dark:border-white/5 bg-white/70 dark:bg-white/5 hover:border-purple-500/40 transition-all group"
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <button
                type="button"
                onClick={() => handleToggle(note.id)}
                className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] transition-colors shrink-0 ${
                  note.completed
                    ? "bg-purple-600 border-purple-600 text-white"
                    : "border-gray-300 dark:border-white/20 hover:border-purple-500"
                }`}
              >
                {note.completed && "✓"}
              </button>
              <span
                className={`text-xs truncate ${
                  note.completed
                    ? "line-through text-gray-400 dark:text-gray-500"
                    : "text-gray-800 dark:text-gray-200"
                }`}
              >
                {note.text}
              </span>
            </div>

            <button
              type="button"
              onClick={() => handleDelete(note.id)}
              className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 text-xs px-1 transition-opacity shrink-0"
              title="Delete task"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* Bottom Counter */}
      <div className="pt-3 border_ui_t flex items-center justify-between text-[11px] text-gray-400">
        <span>
          <strong className="text-purple-600 dark:text-purple-400">{remaining}</strong> remaining ·{" "}
          <strong className="text-gray-700 dark:text-gray-300">{notes.length}</strong> total
        </span>
        <button
          type="button"
          onClick={() => setNotes(notes.filter((n) => !n.completed))}
          className="hover:text-red-500 transition-colors"
        >
          Clear completed
        </button>
      </div>
    </div>
  );
}
