import {geometry, index, pgTable, serial, text, integer} from 'drizzle-orm/pg-core';

export const hotspots = pgTable(
  'hotspots',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    location: geometry('location', {type: 'point', mode: 'xy', srid: 4326}).notNull(),
    headcount: integer('headcount').notNull().default(0)
  },
  (t) => [
    index('spatial_index').using('gist', t.location),
  ]
);