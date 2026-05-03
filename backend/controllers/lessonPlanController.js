import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

import LessonPlanService from '../services/LessonPlanService.js';
import { processarTexto, validateTexto, extrairAlunosDoTexto } from '../services/gasLessonPlanner.js';


const __dirname = dirname(fileURLToPath(import.meta.url));
const LESSONS_PATH = join(__dirname, '../../shared/Lessons.json');

let lessonsCache;

function loadLessons() {
  if (!lessonsCache) {
    lessonsCache = JSON.parse(readFileSync(LESSONS_PATH, 'utf8'));
  }
  return lessonsCache;
}

const lessonPlanService = new LessonPlanService();

export const lessonPlanController = {
  async saveClassPlan(req, res, next) {
    try {
      const { title, alunos_json, output } = req.body;

      if (!alunos_json || !output) {
        return res.status(400).json({ error: 'alunos_json and output required' });
      }

      const plan = await lessonPlanService.createClassPlan(
        req.user.id,
        title || 'Plano Turma ' + new Date().toLocaleDateString(),
        alunos_json,
        output
      );

      res.status(201).json(plan);
    } catch (err) {
      next(err);
    }
  },

  async generatePlan(req, res, next) {

    try {
      const body = req.body && typeof req.body === 'object' ? req.body : {};
      const texto =
        typeof body.texto === 'string'
          ? body.texto
          : typeof body.rawInput === 'string'
            ? body.rawInput
            : typeof body.input === 'string'
              ? body.input
              : '';

      const horario =
        typeof body.horarioStr === 'string'
          ? body.horarioStr
          : typeof body.horario === 'string'
            ? body.horario
            : '';

      const objectivesVisible = body.objectivesVisible;

      console.log(`[LessonPlan] User ${req.user?.id || 'unauth'}, texto len: ${texto.length}, lines: ${texto.trim().split('\n').length}, horario: '${horario}'`);

      if (!texto.trim()) {
        return res.status(400).json({
          error: 'No input text. Paste tab-separated: Name\tBook\tLesson (Excel copy). Example: João\tNW2\t1'
        });
      }

      const linhas = texto.trim().split('\n');
      console.log(`[LessonPlan] First lines (${Math.min(3, linhas.length)}):`, linhas.slice(0,3).map(l=>`'${l}'`).join('; '));

      const output = await processarTexto(texto, horario, objectivesVisible, req.user.id);

      if (!output || !String(output).trim()) {
        return res.status(400).json({
          error: 'No valid plans generated. Check: 1) Book exists (NW2,NG,..), 2) Lesson in sequence, 3) Name/Book/Lesson TAB-separated.'
        });
      }

      // Auto-save if not duplicate
      let saved = false;
      if (req.user) {
        try {
          const recentPlans = await lessonPlanService.getLessonPlansByUser(req.user.id, 1);
          const isDuplicate = recentPlans.length > 0 && recentPlans[0].notes === output;
          if (!isDuplicate) {
            const title = 'Aula Turma ' + new Date().toLocaleDateString();
            const alunosData = {alunos: extrairAlunosDoTexto(texto)};
            const plan = await lessonPlanService.createClassPlan(req.user.id, title, JSON.stringify(alunosData), output);

            saved = true;
          }
        } catch (saveErr) {
          console.error('Auto-save failed:', saveErr);
        }
      }

      res.json({ output, saved });
    } catch (err) {
      next(err);
    }
  },


  async createLessonPlan(req, res, next) {
    try {
      const { studentName, book, lesson, objectives, checkTime, notes } = req.body;

      const nameOk = studentName != null && String(studentName).trim() !== '';
      const bookOk = book != null && String(book).trim() !== '';
      const lessonProvided =
        lesson !== undefined &&
        lesson !== null &&
        String(lesson).trim() !== '' &&
        !(typeof lesson === 'number' && Number.isNaN(lesson));

      if (!nameOk || !bookOk || !lessonProvided) {
        return res.status(400).json({ error: 'Missing required fields (studentName, book, lesson)' });
      }

      let lessonNum = typeof lesson === 'number' ? lesson : parseInt(String(lesson).trim(), 10);
      if (!Number.isFinite(lessonNum)) {
        return res.status(400).json({ error: 'Lesson must be a valid number' });
      }

      const plan = await lessonPlanService.createLessonPlan(
        req.user.id,
        String(studentName).trim(),
        String(book).trim(),
        lessonNum,
        objectives || [],
        typeof checkTime === 'string' ? checkTime : String(checkTime || ''),
        notes != null ? String(notes) : ''
      );

      res.status(201).json(plan);
    } catch (err) {
      next(err);
    }
  },

  async getLessonPlans(req, res, next) {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const offset = parseInt(req.query.offset) || 0;

      const plans = await lessonPlanService.getLessonPlansByUser(req.user.id, limit, offset);
      res.json(plans);
    } catch (err) {
      next(err);
    }
  },

  async getLessonPlan(req, res, next) {
    try {
      const { id } = req.params;
      const plan = await lessonPlanService.getLessonPlanById(id, req.user.id);

      if (!plan) {
        return res.status(404).json({ error: 'Lesson plan not found' });
      }

      res.json(plan);
    } catch (err) {
      next(err);
    }
  },

  async updateLessonPlan(req, res, next) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const result = await lessonPlanService.updateLessonPlan(id, req.user.id, updates);

      if (!result.updated) {
        return res.status(404).json({ error: 'Lesson plan not found' });
      }

      res.json({ message: 'Lesson plan updated', ...result });
    } catch (err) {
      next(err);
    }
  },

  async deleteLessonPlan(req, res, next) {
    try {
      const { id } = req.params;
      const result = await lessonPlanService.deleteLessonPlan(id, req.user.id);

      if (!result.deleted) {
        return res.status(404).json({ error: 'Lesson plan not found' });
      }

      res.json({ message: 'Lesson plan deleted' });
    } catch (err) {
      next(err);
    }
  },

  async getBooks(req, res, next) {
    try {
      const books = Object.keys(loadLessons()).sort();
      res.json({ books });
    } catch (err) {
      next(err);
    }
  },

  async getLessons(req, res, next) {
    try {
      const { book } = req.params;

      if (!book) {
        return res.status(400).json({ error: 'Book parameter is required' });
      }

      const lessons = loadLessons()[book.toUpperCase()];
      if (!lessons) {
        return res.status(404).json({ error: 'Unknown book' });
      }

      res.json({ book: book.toUpperCase(), lessons });
    } catch (err) {
      next(err);
    }
  }
};
