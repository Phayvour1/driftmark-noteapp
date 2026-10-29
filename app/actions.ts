'use server';

export type Note = {
  id: string;
  title: string;
  body: string;
  tags: string[];
  createdAt: string;
};

export type CheckNoteResult =
  | { error: string; note?: never }
  | { error?: never; note: Note };

/**
 * Validates a note submission.
 * Rejects empty title or body with an informative error message.
 * Trims, lowercases, and removes duplicate tags before returning the note.
 */
export async function checkNote(
  formData: FormData | { [key: string]: unknown }
): Promise<CheckNoteResult> {
  const getField = (key: string): string => {
    if (formData && typeof (formData as FormData).get === 'function') {
      const val = (formData as FormData).get(key);
      return typeof val === 'string' ? val : '';
    }
    if (formData && typeof formData === 'object') {
      const val = (formData as Record<string, unknown>)[key];
      return typeof val === 'string' ? val : '';
    }
    return '';
  };

  const title = getField('title').trim();
  const body = getField('body').trim();
  const tagsRaw = getField('tags');

  if (!title && !body) {
    return { error: 'Please provide both a title and a body.' };
  }
  if (!title) {
    return { error: 'Please provide a title.' };
  }
  if (!body) {
    return { error: 'Please provide a body.' };
  }

  // Clean tags: split on commas, trim, lowercase, remove empties, and deduplicate
  const tags = Array.from(
    new Set(
      tagsRaw
        .split(',')
        .map((tag) => tag.trim().toLowerCase())
        .filter((tag) => tag.length > 0)
    )
  );

  const note: Note = {
    id: crypto.randomUUID(),
    title,
    body,
    tags,
    createdAt: new Date().toISOString(),
  };

  return { note };
}
