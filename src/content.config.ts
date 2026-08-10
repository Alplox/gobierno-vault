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
    svg_backup: z
      .object({
        // URL de la imagen original de la que se generó el respaldo ASCII
        fuente: z.string().url().optional(),
        // Opción A (recomendada para SVGs reales, que pesan MBs): ruta absoluta
        // del sitio a un archivo .svg en public/ (ej. /img-to-ascii/20260809-8-zanja.svg).
        // Se renderiza con <img>, sin set:html → sin superficie XSS.
        archivo: z.string().regex(/\.svg$/i, { message: 'svg_backup.archivo debe ser una ruta que termine en .svg' }).optional(),
        // Opción B (solo SVG artesanal pequeño): contenido inline pegado por el
        // usuario tras CONFIRMAR VISUALMENTE que se ve correcto. Nunca guardar un
        // SVG sin esa confirmación humana. Se renderiza con set:html en el body
        // del evento con una leyenda, por eso se rechazan vectores XSS.
        svg: z
          .string()
          .max(100_000, 'svg_backup.svg no puede exceder 100.000 caracteres')
          .refine((v) => /^\s*<svg/i.test(v), 'svg_backup.svg debe comenzar con <svg')
          .refine((v) => !/<script|\son\w+\s*=|javascript:/i.test(v), 'svg_backup.svg no puede contener código ejecutable')
          .optional(),
      })
      .superRefine((val, ctx) => {
        // Debe declarar archivo o svg (o ambos), nunca ninguno.
        if (val && !val.archivo && !val.svg) {
          ctx.addIssue({ code: 'custom', message: 'svg_backup debe declarar archivo (ruta en public/) o svg (inline)' });
        }
      })
      .optional(),
    creado: z.coerce.date(),
    actualizado: z.coerce.date(),
  }),
});

export const collections = { events };
