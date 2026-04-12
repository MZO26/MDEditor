import { editor } from "../../components/editor";
import type {
  CreateNotePayload,
  Note,
  UpdateNotePayload,
} from "../../shared/types";
import { getValue, removeValue, StorageKeys } from "../../utils/cache";

async function createNote(
  payload: CreateNotePayload,
): Promise<Note | undefined> {
  try {
    const result = await window.noteAPI.create(payload);
    if (!result.success) {
      console.warn("(create) Failed to create note: ", result.message);
      return undefined;
    }
    return result.data;
  } catch (error) {
    console.error(`Error creating note: `, error);
    return undefined;
  }
}

async function updateNote(note: UpdateNotePayload): Promise<Note | undefined> {
  try {
    const result = await window.noteAPI.update(note);
    if (!result.success) {
      console.warn(
        `(update): Note with ID ${note.id} not found: `,
        result.message,
      );
      return undefined;
    }
    return result.data;
  } catch (error) {
    console.error(`Error updating note with ID ${note.id}: `, error);
    return undefined;
  }
}

async function deleteNote(id: string, noteElement: HTMLElement): Promise<void> {
  try {
    const result = await window.noteAPI.delete(id);
    if (!result.success) {
      console.warn(`(delete): Note with ID ${id} not found: `, result.message);
      return;
    } else {
      noteElement.remove();
      const noteID = getValue(StorageKeys.NOTE_ID);
      if (noteID === id) {
        removeValue(StorageKeys.NOTE_ID);
        editor?.commands.clearContent();
      }
    }
  } catch (error) {
    console.error("Error deleting note: ", error);
    return;
  }
}

async function getAll(): Promise<Note[] | undefined> {
  try {
    const result = await window.noteAPI.getAll();
    if (!result.success) {
      console.warn(`(getAll): No notes found: `, result.message);
      return undefined;
    }
    return result.data;
  } catch (error) {
    console.error("Error fetching all notes: ", error);
    return undefined;
  }
}

async function getNoteById(id: string): Promise<Note | undefined> {
  try {
    const result = await window.noteAPI.getById(id);
    console.log("Get note by ID result: ", result);
    if (!result.success) {
      console.warn(`Note with ID ${id} not found.`);
      return undefined;
    }
    return result.data;
  } catch (error) {
    console.error(`Error fetching note with ID ${id}: `, error);
    return undefined;
  }
}

export { createNote, deleteNote, getAll, getNoteById, updateNote };
