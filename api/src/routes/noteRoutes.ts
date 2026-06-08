import { Router } from 'express';
import { requireAuth } from '../middleware/currentUser.js';
import {
  createNote,
  updateNote,
  deleteNote,
  getMyNotes,
  getLessonNotes,
  exportCourseNotes,
} from '../controllers/NoteController.js';

const router = Router();

router.post('/', requireAuth, createNote);
router.put('/:noteId', requireAuth, updateNote);
router.delete('/:noteId', requireAuth, deleteNote);
router.get('/', requireAuth, getMyNotes);
router.get('/lessons/:lessonId/notes', requireAuth, getLessonNotes);
router.get('/export/:courseId', requireAuth, exportCourseNotes);

export default router;
