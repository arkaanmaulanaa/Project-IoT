import { pgTable, text, serial, integer, boolean, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const sensorReadings = pgTable("sensor_readings", {
  id: serial("id").primaryKey(),
  dhtTemperature: real("dht_temperature"),
  lm35Temperature: real("lm35_temperature"),
  ledLevel: integer("led_level").notNull().default(0),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertSensorReadingSchema = createInsertSchema(sensorReadings).omit({
  id: true,
  timestamp: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type SensorReading = typeof sensorReadings.$inferSelect;
export type InsertSensorReading = z.infer<typeof insertSensorReadingSchema>;
