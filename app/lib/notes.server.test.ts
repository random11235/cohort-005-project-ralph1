import { describe, it, expect, beforeEach } from "vitest";
import { createTestDb, seedBaseData } from "~/test/setup";
import * as schema from "~/db/schema";
import { getNote, MAX_NOTE_LENGTH, saveNote } from "./notes.server";

type TestDb = ReturnType<typeof createTestDb>;

const NOW = new Date(2026, 9, 6, 12, 0, 0);
const LATER = new Date(2026, 9, 7, 9, 30, 0);

let db: TestDb;
let base: ReturnType<typeof seedBaseData>;
let lessonId: number;

beforeEach(() => {
  db = createTestDb();
  base = seedBaseData(db);

  const module = db
    .insert(schema.modules)
    .values({ courseId: base.course.id, title: "Basics", position: 1 })
    .returning()
    .get();

  lessonId = db
    .insert(schema.lessons)
    .values({ moduleId: module.id, title: "Lesson 1", position: 1 })
    .returning()
    .get().id;
});

describe("saving a note", () => {
  it("creates a Note with the body trimmed", () => {
    const result = saveNote(db, base.user.id, lessonId, "  Revisit this  ", NOW);

    expect(result).toMatchObject({
      ok: true,
      note: {
        userId: base.user.id,
        lessonId,
        body: "Revisit this",
        createdAt: NOW.toISOString(),
        updatedAt: NOW.toISOString(),
      },
    });
  });

  it("refuses a body that is only whitespace", () => {
    expect(saveNote(db, base.user.id, lessonId, "   ", NOW)).toEqual({
      ok: false,
      error: "Write something before saving your note",
    });
    expect(getNote(db, base.user.id, lessonId)).toBeUndefined();
  });

  it("accepts a body of exactly 2000 characters", () => {
    const result = saveNote(
      db,
      base.user.id,
      lessonId,
      "a".repeat(MAX_NOTE_LENGTH),
      NOW
    );

    expect(result.ok).toBe(true);
  });

  it("refuses a body over 2000 characters", () => {
    expect(
      saveNote(db, base.user.id, lessonId, "a".repeat(MAX_NOTE_LENGTH + 1), NOW)
    ).toEqual({ ok: false, error: "Note must be 2000 characters or fewer" });
  });

  it("replaces the body and moves the last-edited time on when saved again", () => {
    saveNote(db, base.user.id, lessonId, "First thought", NOW);
    saveNote(db, base.user.id, lessonId, "Second thought", LATER);

    expect(getNote(db, base.user.id, lessonId)).toMatchObject({
      body: "Second thought",
      createdAt: NOW.toISOString(),
      updatedAt: LATER.toISOString(),
    });
  });

  it("keeps one Note per Student per Lesson", () => {
    saveNote(db, base.user.id, lessonId, "First thought", NOW);
    saveNote(db, base.user.id, lessonId, "Second thought", LATER);

    const rows = db.select().from(schema.notes).all();
    expect(rows).toHaveLength(1);
  });

  it("keeps each Student's Note separate", () => {
    saveNote(db, base.user.id, lessonId, "Mine", NOW);
    saveNote(db, base.instructor.id, lessonId, "Theirs", NOW);

    expect(getNote(db, base.user.id, lessonId)?.body).toBe("Mine");
    expect(getNote(db, base.instructor.id, lessonId)?.body).toBe("Theirs");
  });
});
