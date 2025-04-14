import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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
  hostId: integer("host_id").notNull(),
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

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true
});

export const insertVisitorSchema = createInsertSchema(visitors).omit({
  id: true,
  createdAt: true,
  checkinTime: true,
  checkoutTime: true
});

export const insertDeviceSchema = createInsertSchema(devices).omit({
  id: true,
  lastSeen: true
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Visitor = typeof visitors.$inferSelect;
export type InsertVisitor = z.infer<typeof insertVisitorSchema>;

export type Device = typeof devices.$inferSelect;
export type InsertDevice = z.infer<typeof insertDeviceSchema>;

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
