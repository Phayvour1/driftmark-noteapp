'use client';

import { useState, useEffect, useTransition, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { checkNote, type Note } from './actions';

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  // Derive unique tags from all notes
  const allTags = Array.from(
    new Set(notes.flatMap((note) => note.tags))
  ).sort();

  // Filter notes by selected tag
  const filteredNotes = selectedTag
    ? notes.filter((note) => note.tags.includes(selectedTag))
    : notes;

  // Read localStorage inside useEffect, not during first render (as per SPEC)
  useEffect(() => {
    try {
      const saved = localStorage.getItem('driftmark_notes');
      if (saved) {
        setNotes(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load notes from localStorage:', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save notes to localStorage whenever notes change after initial load
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem('driftmark_notes', JSON.stringify(notes));
    } catch (e) {
      console.error('Failed to save notes to localStorage:', e);
    }
  }, [notes, isLoaded]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      const result = await checkNote(formData);

      if (result.error) {
        setError(result.error);
      } else if (result.note) {
        setError(null);
        setNotes((prev) => [result.note, ...prev]);
        form.reset();
      }
    });
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-zinc-50 via-white to-zinc-100 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 text-zinc-900 dark:text-zinc-100 py-10 px-4 sm:px-6 lg:px-8 selection:bg-indigo-500 selection:text-white transition-colors duration-300">
      <main className="max-w-2xl mx-auto space-y-8">
        {/* Driftmark Brand Header */}
        <header className="border-b border-zinc-200/80 dark:border-zinc-800/80 pb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-0.5 shadow-sm shadow-indigo-500/20 flex items-center justify-center text-white font-bold transition-transform duration-300 hover:scale-105">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5"
              >
                <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 14.5l-4-2 2-4 4 2-2 4z" />
                <path d="m14.5 9.5-5 5" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
                  Driftmark
                </h1>
                <span className="px-2 py-0.5 text-xs font-semibold uppercase tracking-wider rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/50">
                  Noteapp
                </span>
              </div>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Write notes with titles, markdown content, and tags.
              </p>
            </div>
          </div>
        </header>

        {/* Note Creation Form */}
        <section className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xs p-6 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs transition-all duration-200 hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
              Create a Note
            </h2>
            <span className="text-xs text-zinc-400 dark:text-zinc-500">
              Markdown supported
            </span>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-5 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-sm text-red-700 dark:text-red-300 flex items-center justify-between transition-all duration-200 animate-in fade-in slide-in-from-top-1"
            >
              <div className="flex items-center gap-2.5">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4 text-red-500 shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span className="font-medium">{error}</span>
              </div>
              <button
                type="button"
                onClick={() => setError(null)}
                className="text-red-500 hover:text-red-700 dark:hover:text-red-200 text-xs font-semibold ml-2 transition-colors cursor-pointer"
                aria-label="Dismiss error"
              >
                Dismiss
              </button>
            </div>
          )}

          <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="note-title"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
              >
                Title <span className="text-red-500">*</span>
              </label>
              <input
                id="note-title"
                name="title"
                type="text"
                placeholder="Note title"
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-hidden focus:bg-white dark:focus:bg-zinc-800 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 text-sm transition-all duration-150"
              />
            </div>

            <div>
              <label
                htmlFor="note-body"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
              >
                Body <span className="text-red-500">*</span>
              </label>
              <textarea
                id="note-body"
                name="body"
                rows={5}
                placeholder="Write your note here (supports Markdown: headings, bold, lists)..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-hidden focus:bg-white dark:focus:bg-zinc-800 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 text-sm resize-y font-mono transition-all duration-150"
              />
            </div>

            <div>
              <label
                htmlFor="note-tags"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
              >
                Tags <span className="text-xs text-zinc-500">(comma-separated)</span>
              </label>
              <input
                id="note-tags"
                name="tags"
                type="text"
                placeholder="e.g. work, church, ideas"
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-hidden focus:bg-white dark:focus:bg-zinc-800 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 text-sm transition-all duration-150"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isPending}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-medium text-sm transition-all duration-150 shadow-xs hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
              >
                {isPending ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8H4z"
                      />
                    </svg>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-4 h-4"
                    >
                      <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                    </svg>
                    <span>Save Note</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </section>

        {/* Notes List */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                Saved Notes
                <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-200/80 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium">
                  {selectedTag ? `${filteredNotes.length} of ${notes.length}` : notes.length}
                </span>
              </h2>
              {selectedTag && (
                <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-200/60 dark:border-indigo-800/60">
                  #{selectedTag}
                </span>
              )}
            </div>
          </div>

          {/* Tags Filter Bar */}
          {allTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 p-3 rounded-xl bg-white/60 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80">
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mr-1">
                Filter by tag:
              </span>
              <button
                type="button"
                id="tag-filter-all"
                onClick={() => setSelectedTag(null)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer ${
                  selectedTag === null
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs font-semibold'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
                }`}
              >
                All
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  id={`tag-filter-${tag}`}
                  onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer flex items-center gap-1.5 ${
                    selectedTag === tag
                      ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-500/30 font-semibold'
                      : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
                  }`}
                >
                  <span>#{tag}</span>
                  {selectedTag === tag && (
                    <span className="text-[10px] opacity-75">✕</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {notes.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 bg-white/40 dark:bg-zinc-900/40">
              <div className="mx-auto w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 mb-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                  />
                </svg>
              </div>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                No notes yet. Create your first note using the form above!
              </p>
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="text-center py-10 px-4 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 bg-white/40 dark:bg-zinc-900/40 space-y-2">
              <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                No notes match tag <span className="font-semibold text-indigo-600 dark:text-indigo-400">#{selectedTag}</span>.
              </p>
              <button
                type="button"
                onClick={() => setSelectedTag(null)}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium cursor-pointer"
              >
                Clear filter (show All)
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotes.map((note) => (
                <article
                  key={note.id}
                  className="p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-xs space-y-2.5 transition-all duration-200 hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700 hover:-translate-y-0.5"
                >
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                    {note.title}
                  </h3>

                  <div className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed break-words">
                    <ReactMarkdown
                      components={{
                        h1: ({ children }) => (
                          <h1 className="text-xl font-bold text-zinc-950 dark:text-white mt-3 mb-1.5 first:mt-0">
                            {children}
                          </h1>
                        ),
                        h2: ({ children }) => (
                          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mt-2.5 mb-1 first:mt-0">
                            {children}
                          </h2>
                        ),
                        h3: ({ children }) => (
                          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mt-2 mb-1 first:mt-0">
                            {children}
                          </h3>
                        ),
                        p: ({ children }) => (
                          <p className="mb-2 last:mb-0 leading-relaxed">
                            {children}
                          </p>
                        ),
                        strong: ({ children }) => (
                          <strong className="font-semibold text-zinc-950 dark:text-white">
                            {children}
                          </strong>
                        ),
                        ul: ({ children }) => (
                          <ul className="list-disc list-inside space-y-1 my-2 text-zinc-700 dark:text-zinc-300">
                            {children}
                          </ul>
                        ),
                        ol: ({ children }) => (
                          <ol className="list-decimal list-inside space-y-1 my-2 text-zinc-700 dark:text-zinc-300">
                            {children}
                          </ol>
                        ),
                        li: ({ children }) => (
                          <li className="leading-relaxed">{children}</li>
                        ),
                        a: ({ href, children }) => (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 dark:text-indigo-400 underline hover:text-indigo-500 transition-colors"
                          >
                            {children}
                          </a>
                        ),
                        blockquote: ({ children }) => (
                          <blockquote className="border-l-2 border-indigo-500 pl-3 my-2 italic text-zinc-600 dark:text-zinc-400">
                            {children}
                          </blockquote>
                        ),
                        code: ({ children }) => (
                          <code className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-xs font-mono text-indigo-600 dark:text-indigo-400">
                            {children}
                          </code>
                        ),
                      }}
                    >
                      {note.body}
                    </ReactMarkdown>
                  </div>

                  {note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {note.tags.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                            selectedTag === tag
                              ? 'bg-indigo-600 text-white border border-indigo-600 shadow-xs'
                              : 'bg-zinc-100 dark:bg-zinc-800/90 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/80 hover:border-indigo-400 dark:hover:border-indigo-500'
                          }`}
                          title={`Filter notes by #${tag}`}
                        >
                          #{tag}
                        </button>
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
