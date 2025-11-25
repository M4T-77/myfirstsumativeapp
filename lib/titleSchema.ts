import { z } from 'zod';

export const titleSchema = z.string()
  .max(100, 'El título es demasiado largo (máximo 100 caracteres)');
