import {geometry, index, pgTable, serial, text, integer} from 'drizzle-orm/pg-core';

export const hotspots = pgTable(
  'hotspots',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    location: geometry('location', {type: 'point', mode: 'xy', srid: 4326}).notNull(),
    assigned: integer('assigned').notNull().default(0),
    arrived: integer('arrived').notNull().default(0)
  },
  (t) => [
    index('spatial_index').using('gist', t.location),
  ]
);

export const rescueRequests = pgTable(
  'rescue_requests',
  {
    id: serial('id').primaryKey(),
    assignedHotspotId: integer('assigned_hotspot_id').references(() => hotspots.id),
    people: integer('people').notNull().default(1),
    status: text('status').notNull(),
  }
)
