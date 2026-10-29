'use client';

import { useState, useEffect, useTransition, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { checkNote, type Note } from './actions';

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');
  const [bodyDraft, setBodyDraft] = useState('');
  const [titleDraft, setTitleDraft] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const formRef = useRef<HTMLFormElement>(null);
  const bodyTextareaRef = useRef<HTMLTextAreaElement>(null);
  const tagsInputRef = useRef<HTMLInputElement>(null);

  // Derive unique tags from all notes
  const allTags = Array.from(
    new Set(notes.flatMap((note) => note.tags))
  ).sort();

  // Filter notes by selected tag and search query (matches title or body words)
  const query = searchQuery.trim().toLowerCase();
  const filteredNotes = notes.filter((note) => {
    const matchesTag = selectedTag ? note.tags.includes(selectedTag) : true;
    if (!matchesTag) return false;
    if (!query) return true;
    return (
      note.title.toLowerCase().includes(query) ||
      note.body.toLowerCase().includes(query)
    );
  });

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

  // Handle Form Submission
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
        setTitleDraft('');
        setBodyDraft('');
        setActiveTab('write');
      }
    });
  };

  // Handle Note Deletion
  const handleDelete = (id: string) => {
    setNotes((prev) => prev.filter((note) => note.id !== id));
  };

  // Copy note content to clipboard with tactile feedback
  const handleCopyNote = async (note: Note) => {
    const textToCopy = `${note.title}\n\n${note.body}${
      note.tags.length > 0 ? `\n\nTags: ${note.tags.map((t) => `#${t}`).join(' ')}` : ''
    }`;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedId(note.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Could not copy text: ', err);
    }
  };

  // Markdown helper to insert syntax at cursor position
  const insertMarkdown = (prefix: string, suffix: string = '') => {
    const textarea = bodyTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);

    const replacement = `${prefix}${selected || 'text'}${suffix}`;
    const newText = text.substring(0, start) + replacement + text.substring(end);

    setBodyDraft(newText);
    textarea.value = newText;

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + (selected ? selected.length : 4)
      );
    }, 0);
  };

  // Append a quick tag chip into the tags input
  const addQuickTag = (tag: string) => {
    if (!tagsInputRef.current) return;
    const current = tagsInputRef.current.value.trim();
    if (!current) {
      tagsInputRef.current.value = tag;
    } else {
      const parts = current.split(',').map((p) => p.trim());
      if (!parts.includes(tag)) {
        tagsInputRef.current.value = `${current}, ${tag}`;
      }
    }
    tagsInputRef.current.focus();
  };

  // Quick word & char stats
  const wordCount = bodyDraft.trim() ? bodyDraft.trim().split(/\s+/).length : 0;
  const charCount = bodyDraft.length;

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#070c18] text-slate-800 dark:text-slate-100 py-6 sm:py-10 pb-20 sm:pb-16 px-3.5 sm:px-6 lg:px-8 selection:bg-blue-500 selection:text-white transition-colors duration-300 relative overflow-hidden">
      {/* Ambient Blue Background Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
        <div className="absolute -top-40 -left-40 w-96 sm:w-[500px] h-96 sm:h-[500px] bg-gradient-to-br from-blue-400/20 via-sky-300/10 to-transparent dark:from-blue-600/15 dark:via-cyan-500/10 dark:to-transparent rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-96 sm:w-[500px] h-96 sm:h-[500px] bg-gradient-to-bl from-cyan-400/20 via-blue-400/10 to-transparent dark:from-cyan-500/15 dark:via-blue-600/10 dark:to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-1/4 w-80 h-80 bg-blue-300/15 dark:bg-blue-900/10 rounded-full blur-3xl" />
      </div>

      <main className="max-w-2xl mx-auto space-y-7 sm:space-y-9 relative z-10">
        {/* Driftmark Brand Header */}
        <header className="border-b border-blue-100/80 dark:border-blue-950/80 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              {/* Stylish Driftmark Emblem (Wave & Stylus in Cobalt Blue) */}
              <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-blue-500 to-cyan-400 p-0.5 shadow-md shadow-blue-500/25 flex items-center justify-center text-white font-bold transition-transform duration-300 hover:scale-105 shrink-0 group">
                <div className="w-full h-full rounded-[14px] bg-gradient-to-tr from-blue-600 to-blue-500 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-5 h-5 sm:w-6 sm:h-6 text-white transition-transform duration-300 group-hover:-rotate-6"
                  >
                    <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 14.5l-4-2 2-4 4 2-2 4z" />
                    <path d="m14.5 9.5-5 5" />
                  </svg>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                    Driftmark
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] sm:text-xs font-semibold rounded-full bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/60 shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                    Noteapp
                  </span>
                </div>
                <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Your calm digital harbor for fleeting thoughts, daily notes & markdown ideas.
                </p>
              </div>
            </div>

            {/* Quick stats indicator */}
            <div className="hidden sm:flex items-center gap-2 self-start sm:self-center px-3 py-1.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 text-xs text-blue-700 dark:text-blue-300 font-medium">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
              </svg>
              <span>{notes.length} {notes.length === 1 ? 'note' : 'notes'} saved</span>
            </div>
          </div>
        </header>

        {/* Note Creation Form Card */}
        <section className="bg-white/85 dark:bg-slate-900/85 backdrop-blur-md p-5 sm:p-7 rounded-2xl sm:rounded-3xl border border-blue-100/90 dark:border-blue-900/50 shadow-sm transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/5 hover:border-blue-200 dark:hover:border-blue-800/80">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-blue-600 shadow-sm shadow-blue-500/50" />
                Capture a Note
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Organize your thoughts with titles, rich Markdown & tags.
              </p>
            </div>

            {/* Write vs Preview Mode Toggle */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200/80 dark:border-slate-700/80 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('write')}
                className={`px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${
                  activeTab === 'write'
                    ? 'bg-white dark:bg-blue-600 text-blue-700 dark:text-white shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Write
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${
                  activeTab === 'preview'
                    ? 'bg-white dark:bg-blue-600 text-blue-700 dark:text-white shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Preview
              </button>
            </div>
          </div>

          {/* Validation Alert */}
          {error && (
            <div
              role="alert"
              className="mb-5 p-3.5 sm:p-4 rounded-xl bg-blue-50/90 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/80 text-xs sm:text-sm text-blue-900 dark:text-blue-200 flex items-center justify-between transition-all duration-200 animate-in fade-in slide-in-from-top-1"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-5 h-5 rounded-full bg-blue-200/60 dark:bg-blue-900/80 flex items-center justify-center text-blue-700 dark:text-blue-300 shrink-0">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-3.5 h-3.5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <span className="font-semibold">{error}</span>
              </div>
              <button
                type="button"
                onClick={() => setError(null)}
                className="text-blue-600 hover:text-blue-800 dark:text-blue-300 dark:hover:text-white text-xs font-semibold ml-3 px-2 py-1 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors cursor-pointer shrink-0"
                aria-label="Dismiss error"
              >
                Dismiss
              </button>
            </div>
          )}

          <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
            {/* Title Input */}
            <div>
              <label
                htmlFor="note-title"
                className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Note Title <span className="text-blue-500">*</span>
              </label>
              <input
                id="note-title"
                name="title"
                type="text"
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                placeholder="e.g. Weekly Shopping, Team Sprint Notes, Bible Study..."
                className="w-full px-4 py-2.5 rounded-xl border border-blue-100 dark:border-blue-900/60 bg-blue-50/30 dark:bg-slate-800/40 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-base sm:text-sm transition-all duration-150 min-h-[44px]"
              />
            </div>

            {/* Body Input or Live Preview */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="note-body"
                  className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300"
                >
                  Markdown Content <span className="text-blue-500">*</span>
                </label>

                {/* Markdown Quick Toolbar */}
                {activeTab === 'write' && (
                  <div className="flex items-center gap-1 overflow-x-auto py-0.5">
                    <button
                      type="button"
                      onClick={() => insertMarkdown('# ')}
                      title="Insert Heading 1"
                      className="px-1.5 py-0.5 rounded text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-100 dark:hover:bg-blue-900 hover:text-blue-700 transition-colors cursor-pointer"
                    >
                      H1
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown('## ')}
                      title="Insert Heading 2"
                      className="px-1.5 py-0.5 rounded text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-100 dark:hover:bg-blue-900 hover:text-blue-700 transition-colors cursor-pointer"
                    >
                      H2
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown('**', '**')}
                      title="Bold Text"
                      className="px-1.5 py-0.5 rounded text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-100 dark:hover:bg-blue-900 hover:text-blue-700 transition-colors cursor-pointer"
                    >
                      B
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown('- ')}
                      title="Bullet List"
                      className="px-1.5 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-100 dark:hover:bg-blue-900 hover:text-blue-700 transition-colors cursor-pointer"
                    >
                      • List
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown('[', '](https://)')}
                      title="Link"
                      className="px-1.5 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-100 dark:hover:bg-blue-900 hover:text-blue-700 transition-colors cursor-pointer"
                    >
                      Link
                    </button>
                  </div>
                )}
              </div>

              {activeTab === 'write' ? (
                <textarea
                  ref={bodyTextareaRef}
                  id="note-body"
                  name="body"
                  rows={5}
                  value={bodyDraft}
                  onChange={(e) => setBodyDraft(e.target.value)}
                  placeholder="Write your note here... Use # for headings, **bold** for emphasis, - for bullet lists, or [links](url)."
                  className="w-full px-4 py-3 rounded-xl border border-blue-100 dark:border-blue-900/60 bg-blue-50/30 dark:bg-slate-800/40 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-base sm:text-sm resize-y font-mono transition-all duration-150 min-h-[130px] leading-relaxed"
                />
              ) : (
                <div className="w-full px-4 py-3 rounded-xl border border-blue-100 dark:border-blue-900/60 bg-white/60 dark:bg-slate-800/60 min-h-[130px] overflow-y-auto">
                  {bodyDraft.trim() ? (
                    <div className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed break-words">
                      <ReactMarkdown
                        components={{
                          h1: ({ children }) => (
                            <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-3 mb-1.5 first:mt-0 text-blue-900 dark:text-blue-200">
                              {children}
                            </h1>
                          ),
                          h2: ({ children }) => (
                            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-2.5 mb-1 first:mt-0 text-blue-800 dark:text-blue-300">
                              {children}
                            </h2>
                          ),
                          strong: ({ children }) => (
                            <strong className="font-semibold text-slate-950 dark:text-white">
                              {children}
                            </strong>
                          ),
                          ul: ({ children }) => (
                            <ul className="list-disc list-inside space-y-1 my-2 text-slate-700 dark:text-slate-300">
                              {children}
                            </ul>
                          ),
                          ol: ({ children }) => (
                            <ol className="list-decimal list-inside space-y-1 my-2 text-slate-700 dark:text-slate-300">
                              {children}
                            </ol>
                          ),
                          a: ({ href, children }) => (
                            <a
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 dark:text-blue-400 underline hover:text-blue-500"
                            >
                              {children}
                            </a>
                          ),
                        }}
                      >
                        {bodyDraft}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 dark:text-slate-500 italic py-6 text-center">
                      Markdown preview will appear here as you type...
                    </p>
                  )}
                </div>
              )}

              {/* Word & Char Count */}
              <div className="flex items-center justify-between mt-1 text-[11px] text-slate-400 dark:text-slate-500 px-1">
                <span>{wordCount} {wordCount === 1 ? 'word' : 'words'} · {charCount} chars</span>
                <span className="hidden sm:inline">Tip: # Heading · **Bold** · - List</span>
              </div>
            </div>

            {/* Tags Input */}
            <div>
              <label
                htmlFor="note-tags"
                className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >
                Tags <span className="text-xs font-normal text-slate-500 dark:text-slate-400">(comma-separated)</span>
              </label>
              <input
                ref={tagsInputRef}
                id="note-tags"
                name="tags"
                type="text"
                placeholder="e.g. work, church, ideas, home"
                className="w-full px-4 py-2.5 rounded-xl border border-blue-100 dark:border-blue-900/60 bg-blue-50/30 dark:bg-slate-800/40 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-base sm:text-sm transition-all duration-150 min-h-[44px]"
              />

              {/* Quick Tag suggestions */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="text-[11px] text-slate-400 dark:text-slate-500 mr-1">
                  Quick tags:
                </span>
                {['work', 'personal', 'church', 'ideas', 'reading'].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => addQuickTag(tag)}
                    className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40 transition-colors cursor-pointer"
                  >
                    +{tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isPending}
                className="w-full sm:w-auto px-7 py-3 sm:py-2.5 min-h-[44px] rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 hover:from-blue-700 hover:via-blue-600 hover:to-cyan-600 text-white font-semibold text-base sm:text-sm transition-all duration-200 shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/35 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
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
                    <span>Saving Note...</span>
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

        {/* Saved Notes Section */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Saved Notes</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100/80 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-semibold border border-blue-200/60 dark:border-blue-900/60">
                  {selectedTag || searchQuery ? `${filteredNotes.length} of ${notes.length}` : notes.length}
                </span>
              </h2>
              {selectedTag && (
                <span className="text-xs text-blue-700 dark:text-blue-300 font-semibold bg-blue-50 dark:bg-blue-950/80 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                  #{selectedTag}
                </span>
              )}
            </div>

            {/* Search Input Bar */}
            {notes.length > 0 && (
              <div className="relative w-full sm:w-64">
                <input
                  id="search-notes-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search title or body..."
                  className="w-full pl-9 pr-9 py-2 sm:py-1.5 min-h-[42px] sm:min-h-[38px] rounded-xl border border-blue-100 dark:border-blue-900/60 bg-white/90 dark:bg-slate-800/70 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-base sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 shadow-2xs transition-all duration-150"
                />
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4 text-blue-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-4.35-4.35M16.65 10.65a6 6 0 11-12 0 6 6 0 0112 0z"
                  />
                </svg>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 text-sm cursor-pointer transition-colors"
                    aria-label="Clear search"
                  >
                    ✕
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Tags Filter Bar */}
          {allTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 p-3 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-blue-100/90 dark:border-blue-900/50 shadow-2xs">
              <span className="text-xs font-semibold text-blue-900 dark:text-blue-300 mr-1 shrink-0 flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                Filter:
              </span>
              <button
                type="button"
                id="tag-filter-all"
                onClick={() => setSelectedTag(null)}
                className={`px-3 py-1.5 sm:py-1 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer min-h-[34px] sm:min-h-0 flex items-center ${
                  selectedTag === null
                    ? 'bg-blue-600 text-white shadow-xs font-semibold'
                    : 'bg-blue-50/70 text-blue-800 hover:bg-blue-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
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
                  className={`px-3 py-1.5 sm:py-1 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer flex items-center gap-1.5 min-h-[34px] sm:min-h-0 ${
                    selectedTag === tag
                      ? 'bg-blue-600 text-white shadow-xs font-semibold'
                      : 'bg-blue-50/70 text-blue-800 hover:bg-blue-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                  }`}
                >
                  <span>#{tag}</span>
                  {selectedTag === tag && (
                    <span className="text-[10px] opacity-80">✕</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Empty state: No notes created yet */}
          {notes.length === 0 ? (
            <div className="text-center py-12 sm:py-16 px-4 rounded-2xl sm:rounded-3xl border border-dashed border-blue-200 dark:border-blue-900/60 bg-blue-50/20 dark:bg-slate-900/30">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-100 to-cyan-50 dark:from-blue-950 dark:to-slate-800 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-3.5 shadow-sm border border-blue-200/50 dark:border-blue-800/50">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.8"
                  stroke="currentColor"
                  className="w-7 h-7"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                  />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
                Your notes list is clean and calm
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mx-auto mt-1">
                No notes in your harbor yet. Write your thoughts above and press &ldquo;Save Note&rdquo; to begin!
              </p>
            </div>
          ) : filteredNotes.length === 0 ? (
            /* Empty state: No notes match search or filter */
            <div className="text-center py-12 px-4 rounded-2xl sm:rounded-3xl border border-dashed border-blue-200 dark:border-blue-900/60 bg-blue-50/20 dark:bg-slate-900/30 space-y-3.5">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-blue-100/70 dark:bg-blue-950/80 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.8"
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-4.35-4.35M16.65 10.65a6 6 0 11-12 0 6 6 0 0112 0z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-slate-900 dark:text-white font-bold text-lg">
                  No notes match
                </p>
                <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1 max-w-md mx-auto">
                  {searchQuery && selectedTag
                    ? `No notes match "${searchQuery}" under tag #${selectedTag}.`
                    : searchQuery
                    ? `No notes match "${searchQuery}". Try searching for another keyword or phrase.`
                    : `No notes match tag #${selectedTag}.`}
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2 pt-1">
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="px-3.5 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-xs font-semibold shadow-xs transition-colors cursor-pointer min-h-[38px] flex items-center gap-1.5"
                  >
                    <span>Clear search</span>
                  </button>
                )}
                {selectedTag && (
                  <button
                    type="button"
                    onClick={() => setSelectedTag(null)}
                    className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer min-h-[38px] flex items-center gap-1.5"
                  >
                    <span>Show All notes</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Note Cards List */
            <div className="space-y-3.5 sm:space-y-4">
              {filteredNotes.map((note) => {
                const noteWordCount = note.body.trim() ? note.body.trim().split(/\s+/).length : 0;
                const readingMinutes = Math.max(1, Math.ceil(noteWordCount / 180));

                return (
                  <article
                    key={note.id}
                    className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-blue-100/90 dark:border-blue-900/50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs shadow-xs space-y-3 transition-all duration-200 hover:shadow-md hover:shadow-blue-500/5 hover:border-blue-300 dark:hover:border-blue-700/80 hover:-translate-y-0.5 overflow-hidden group"
                  >
                    {/* Note Card Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white break-words">
                          {note.title}
                        </h3>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                          <span>{readingMinutes} min read</span>
                          <span>•</span>
                          <span>{noteWordCount} {noteWordCount === 1 ? 'word' : 'words'}</span>
                        </div>
                      </div>

                      {/* Card Action Buttons: Copy & Delete */}
                      <div className="flex items-center gap-1 shrink-0">
                        {/* Copy Button */}
                        <button
                          type="button"
                          onClick={() => handleCopyNote(note)}
                          className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 p-2 sm:p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/60 transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
                          aria-label={`Copy note: ${note.title}`}
                          title={copiedId === note.id ? 'Copied to clipboard!' : 'Copy note content'}
                        >
                          {copiedId === note.id ? (
                            <span className="flex items-center text-[11px] font-semibold text-blue-600 dark:text-blue-400 gap-1 animate-in fade-in">
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              <span>Copied</span>
                            </span>
                          ) : (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="w-4 h-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth="1.8"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75"
                              />
                            </svg>
                          )}
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          id={`delete-note-${note.id}`}
                          onClick={() => handleDelete(note.id)}
                          className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 p-2 sm:p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
                          aria-label={`Delete note: ${note.title}`}
                          title="Delete note"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="1.8"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Markdown Formatted Body */}
                    <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed break-words overflow-x-auto border-t border-slate-100 dark:border-slate-800/80 pt-3">
                      <ReactMarkdown
                        components={{
                          h1: ({ children }) => (
                            <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-3 mb-1.5 first:mt-0 text-blue-900 dark:text-blue-200">
                              {children}
                            </h1>
                          ),
                          h2: ({ children }) => (
                            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-2.5 mb-1 first:mt-0 text-blue-800 dark:text-blue-300">
                              {children}
                            </h2>
                          ),
                          h3: ({ children }) => (
                            <h3 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white mt-2 mb-1 first:mt-0 text-blue-700 dark:text-blue-300">
                              {children}
                            </h3>
                          ),
                          p: ({ children }) => (
                            <p className="mb-2 last:mb-0 leading-relaxed">
                              {children}
                            </p>
                          ),
                          strong: ({ children }) => (
                            <strong className="font-semibold text-slate-950 dark:text-white">
                              {children}
                            </strong>
                          ),
                          ul: ({ children }) => (
                            <ul className="list-disc list-inside space-y-1 my-2 text-slate-700 dark:text-slate-300">
                              {children}
                            </ul>
                          ),
                          ol: ({ children }) => (
                            <ol className="list-decimal list-inside space-y-1 my-2 text-slate-700 dark:text-slate-300">
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
                              className="text-blue-600 dark:text-blue-400 underline hover:text-blue-500 transition-colors font-medium"
                            >
                              {children}
                            </a>
                          ),
                          blockquote: ({ children }) => (
                            <blockquote className="border-l-3 border-blue-500 pl-3.5 my-2.5 italic text-slate-600 dark:text-slate-400 bg-blue-50/40 dark:bg-blue-950/30 py-1 rounded-r-lg">
                              {children}
                            </blockquote>
                          ),
                          code: ({ children }) => (
                            <code className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-slate-800 text-xs font-mono text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-900/40">
                              {children}
                            </code>
                          ),
                        }}
                      >
                        {note.body}
                      </ReactMarkdown>
                    </div>

                    {/* Tags Pills */}
                    {note.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100/80 dark:border-slate-800/60">
                        {note.tags.map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer min-h-[28px] ${
                              selectedTag === tag
                                ? 'bg-blue-600 text-white border border-blue-600 shadow-xs'
                                : 'bg-blue-50/70 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 border border-blue-200/70 dark:border-blue-900/60'
                            }`}
                            title={`Filter notes by #${tag}`}
                          >
                            #{tag}
                          </button>
                        ))}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="pt-6 border-t border-blue-100/60 dark:border-blue-950/60 text-center text-xs text-slate-400 dark:text-slate-500">
          <p>Driftmark Noteapp · Crafted for seamless Markdown capture and instant tag discovery.</p>
        </footer>
      </main>
    </div>
  );
}
