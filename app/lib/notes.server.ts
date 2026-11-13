import { and, eq } from "drizzle-orm";
import { notes } from "~/db/schema";
import type { Db } from "~/lib/comments.server";

// ─── Notes ───
// A Student's own writing about a Lesson, private to them. One per Student per
// Lesson. See GLOSSARY.md for the language.
//
// Every function takes the database first, so tests can hand in an in-memory
// one. Uses positional parameters (project convention).

export const MAX_NOTE_LENGTH = 2000;

type Note = typeof notes.$inferSelect;

export type SaveNoteResult = { ok: true; note: Note } | { ok: false; error: string };

export function getNote(db: Db, userId: number, lessonId: number) {
  return db
    .select()
    .from(notes)
    .where(and(eq(notes.userId, userId), eq(notes.lessonId, lessonId)))
    .get();
}

/**
 * Saves the Student's Note on a Lesson. The body is trimmed; an empty or
 * over-long body is refused. Saving again replaces the body and moves
 * `updatedAt` on, leaving `createdAt` alone. The unique index on (user, lesson)
 * is what keeps it to one Note, even when two saves race.
 */
export function saveNote(
  db: Db,
  userId: number,
  lessonId: number,
  body: string,
  now: Date
): SaveNoteResult {
  const trimmed = body.trim();
  if (trimmed.length === 0) {
    return { ok: false, error: "Write something before saving your note" };
  }
  if (trimmed.length > MAX_NOTE_LENGTH) {
    return {
      ok: false,
      error: `Note must be ${MAX_NOTE_LENGTH} characters or fewer`,
    };
  }

  const timestamp = now.toISOString();
  const note = db
    .insert(notes)
    .values({
      userId,
      lessonId,
      body: trimmed,
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    .onConflictDoUpdate({
      target: [notes.userId, notes.lessonId],
      set: { body: trimmed, updatedAt: timestamp },
    })
    .returning()
    .get();

  return { ok: true, note };
}
