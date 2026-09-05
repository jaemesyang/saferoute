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

export const rescueRequests = pgTable(
  'rescue_requests',
  {
    id: serial('id').primaryKey(),
    assignedHotspotId: integer('assigned_hotspot_id').references(() => hotspots.location),
    people: integer('people').notNull().default(1),
    status: text('status').notNull(),
  }
)