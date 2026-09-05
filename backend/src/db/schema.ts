import { geometry, index, pgTable, serial, text } from 'drizzle-orm/pg-core';

export const hotspots = pgTable(
    'hotspots',
    {
        id: serial('id').primaryKey(),
        name: text('name').notNull(),
        location: geometry('location', { type: 'point', mode: 'xy', srid: 4326 }).notNull(),
    },
    (t) => [
        index('spatial_index').using('gist', t.location),
    ]
);
