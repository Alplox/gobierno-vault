import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const commaArray = z.preprocess((val) => {
  if (typeof val === 'string') return val.split(',').map(s => s.trim()).filter(Boolean);
  if (val === undefined || val === null) return [];
  return val;
}, z.array(z.string()));

const events = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/events' }),
  schema: z.object({
    titulo: z.string(),
    fecha: z.coerce.date(),
    tipo: z.enum([
      'declaracion',
      'accion',
      'anuncio',
      'decreto',
      'proyecto',
      'ley',
      'votacion',
      'fallo_judicial',
      'entrevista',
      'publicacion',
      'documento',
      'investigacion',
      'reaccion',
      'resultado',
    ]),
    tema: commaArray,
    etiquetas: commaArray.optional().default([]),
    impacto: z
      .object({
        colectivos: commaArray.optional().default([]),
        sectores: commaArray.optional().default([]),
      })
      .optional()
      .default({}),
    relaciones: z
      .record(z.string(), z.union([z.string(), z.array(z.string())]))
      .optional()
      .default({}),
    creado: z.coerce.date(),
    actualizado: z.coerce.date(),
  }),
});

export const collections = { events };
