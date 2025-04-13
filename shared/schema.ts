import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  role: text("role").notNull(), // "admin", "guard", "host"
  department: text("department"),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

// Visitor model
export const visitors = pgTable("visitors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  aadharId: text("aadhar_id").notNull(),
  mobile: text("mobile"),
  email: text("email"),
  purpose: text("purpose").notNull(),
  hostId: integer("host_id").notNull(),
  photoUrl: text("photo_url"),
  status: text("status").notNull().default("pending"), // "pending", "approved", "rejected", "checked_in", "checked_out"
  checkInTime: timestamp("check_in_time"),
  checkOutTime: timestamp("check_out_time"),
  comments: text("comments"),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: integer("created_by").notNull(), // Guard who created
});

export const insertVisitorSchema = createInsertSchema(visitors).omit({
  id: true,
  status: true,
  checkInTime: true,
  checkOutTime: true,
  createdAt: true,
});

// IoT Devices model
export const devices = pgTable("devices", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  deviceId: text("device_id").notNull().unique(),
  type: text("type").notNull(), // "entry", "exit", "access"
  location: text("location").notNull(),
  active: boolean("active").default(true),
  lastSeen: timestamp("last_seen"),
  config: jsonb("config"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDeviceSchema = createInsertSchema(devices).omit({
  id: true,
  lastSeen: true,
  createdAt: true,
});

// Notifications model
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  read: boolean("read").default(false),
  relatedTo: text("related_to"), // "visitor", "device"
  relatedId: integer("related_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  read: true,
  createdAt: true,
});

// Access Logs model
export const accessLogs = pgTable("access_logs", {
  id: serial("id").primaryKey(),
  visitorId: integer("visitor_id").notNull(),
  deviceId: integer("device_id"),
  action: text("action").notNull(), // "check_in", "check_out", "access_granted", "access_denied"
  timestamp: timestamp("timestamp").defaultNow(),
  details: text("details"),
});

export const insertAccessLogSchema = createInsertSchema(accessLogs).omit({
  id: true,
  timestamp: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Visitor = typeof visitors.$inferSelect;
export type InsertVisitor = z.infer<typeof insertVisitorSchema>;

export type Device = typeof devices.$inferSelect;
export type InsertDevice = z.infer<typeof insertDeviceSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

export type AccessLog = typeof accessLogs.$inferSelect;
export type InsertAccessLog = z.infer<typeof insertAccessLogSchema>;

// Enums for better type safety
export const UserRoles = {
  ADMIN: "admin",
  GUARD: "guard",
  HOST: "host"
} as const;

export const VisitorStatus = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  CHECKED_IN: "checked_in",
  CHECKED_OUT: "checked_out"
} as const;

export const DeviceTypes = {
  ENTRY: "entry",
  EXIT: "exit",
  ACCESS: "access"
} as const;

export const AccessActions = {
  CHECK_IN: "check_in",
  CHECK_OUT: "check_out",
  ACCESS_GRANTED: "access_granted",
  ACCESS_DENIED: "access_denied"
} as const;
