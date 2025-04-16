import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// User roles
export enum UserRole {
  ADMIN = "admin",
  GUARD = "guard",
  HOST = "host"
}

// User table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  role: text("role").$type<UserRole>().notNull(),
  department: text("department"),
  phone: text("phone"),
  active: boolean("active").notNull().default(true),
});

// Visitor status
export enum VisitorStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
  CHECKED_IN = "checked_in",
  CHECKED_OUT = "checked_out"
}

// Visitors table
export const visitors = pgTable("visitors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  aadharId: text("aadhar_id").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  company: text("company"),
  purpose: text("purpose").notNull(),
  photoUrl: text("photo_url"),
  hostId: integer("host_id").notNull().references(() => users.id),
  registeredById: integer("registered_by_id").references(() => users.id),
  status: text("status").$type<VisitorStatus>().notNull().default(VisitorStatus.PENDING),
  checkinTime: timestamp("checkin_time"),
  checkoutTime: timestamp("checkout_time"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  expectedDuration: integer("expected_duration"), // in minutes
  notes: text("notes"),
});

// IoT Devices table
export const devices = pgTable("devices", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // "door", "scanner", etc.
  location: text("location").notNull(),
  deviceId: text("device_id").notNull().unique(),
  active: boolean("active").notNull().default(true),
  lastSeen: timestamp("last_seen"),
  config: jsonb("config")
});

// Access logs table
export const accessLogs = pgTable("access_logs", {
  id: serial("id").primaryKey(),
  visitorId: integer("visitor_id").references(() => visitors.id),
  deviceId: integer("device_id").references(() => devices.id),
  action: text("action").notNull(), // "entry", "exit", etc.
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  notes: text("notes"),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  visitorsAsHost: many(visitors, { relationName: "host" }),
  visitorsRegistered: many(visitors, { relationName: "registeredBy" })
}));

export const visitorsRelations = relations(visitors, ({ one, many }) => ({
  host: one(users, {
    fields: [visitors.hostId],
    references: [users.id],
    relationName: "host"
  }),
  registeredBy: one(users, {
    fields: [visitors.registeredById],
    references: [users.id],
    relationName: "registeredBy"
  }),
  accessLogs: many(accessLogs)
}));

export const devicesRelations = relations(devices, ({ many }) => ({
  accessLogs: many(accessLogs)
}));

export const accessLogsRelations = relations(accessLogs, ({ one }) => ({
  visitor: one(visitors, {
    fields: [accessLogs.visitorId],
    references: [visitors.id]
  }),
  device: one(devices, {
    fields: [accessLogs.deviceId],
    references: [devices.id]
  })
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true
});

export const insertVisitorSchema = createInsertSchema(visitors).omit({
  id: true,
  createdAt: true,
  checkinTime: true,
  checkoutTime: true,
  registeredById: true
});

export const insertDeviceSchema = createInsertSchema(devices).omit({
  id: true,
  lastSeen: true
});

export const insertAccessLogSchema = createInsertSchema(accessLogs).omit({
  id: true,
  timestamp: true
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Visitor = typeof visitors.$inferSelect;
export type InsertVisitor = z.infer<typeof insertVisitorSchema>;

export type Device = typeof devices.$inferSelect;
export type InsertDevice = z.infer<typeof insertDeviceSchema>;

export type AccessLog = typeof accessLogs.$inferSelect;
export type InsertAccessLog = z.infer<typeof insertAccessLogSchema>;

// Extended schemas with validation
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const deviceCommandSchema = z.object({
  deviceId: z.string(),
  command: z.enum(["unlock", "lock", "reboot", "status"]),
  params: z.record(z.any()).optional(),
});

export type DeviceCommand = z.infer<typeof deviceCommandSchema>;
