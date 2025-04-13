import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { Server as SocketServer } from "socket.io";
import multer from "multer";
import path from "path";
import fs from "fs";
import {
  insertUserSchema,
  insertVisitorSchema,
  insertDeviceSchema,
  insertNotificationSchema,
  insertAccessLogSchema,
  UserRoles,
  VisitorStatus
} from "@shared/schema";
import { z } from "zod";

const setupUploadDir = () => {
  const uploadDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  return uploadDir;
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up file uploads for visitor photos
  const uploadDir = setupUploadDir();
  const imageStorage = multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
    }
  });
  
  const upload = multer({ 
    storage: imageStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (_req, file, cb) => {
      const allowedMimeTypes = ["image/jpeg", "image/png", "image/jpg"];
      if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error("Invalid file type. Only JPEG, PNG, and JPG are allowed.") as any);
      }
    }
  });

  // Serve uploaded files statically
  app.use("/uploads", express.static(uploadDir));

  // User Authentication routes
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      if (user.password !== password) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      if (!user.active) {
        return res.status(403).json({ message: "Your account has been deactivated" });
      }
      
      // Don't return the password
      const { password: _, ...userWithoutPassword } = user;
      
      return res.status(200).json({ 
        message: "Login successful",
        user: userWithoutPassword
      });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  // User management routes
  app.get("/api/users", async (_req: Request, res: Response) => {
    try {
      const users = await storage.listUsers();
      // Don't return passwords
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      return res.status(200).json(usersWithoutPasswords);
    } catch (error) {
      console.error("Get users error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/users/hosts", async (_req: Request, res: Response) => {
    try {
      const hosts = await storage.listHostUsers();
      // Don't return passwords
      const hostsWithoutPasswords = hosts.map(({ password, ...host }) => host);
      return res.status(200).json(hostsWithoutPasswords);
    } catch (error) {
      console.error("Get hosts error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/users", async (req: Request, res: Response) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      const newUser = await storage.createUser(userData);
      
      // Don't return the password
      const { password, ...userWithoutPassword } = newUser;
      
      return res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      console.error("Create user error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.patch("/api/users/:id", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const existingUser = await storage.getUser(userId);
      if (!existingUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const updatedUser = await storage.updateUser(userId, req.body);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "Failed to update user" });
      }
      
      // Don't return the password
      const { password, ...userWithoutPassword } = updatedUser;
      
      return res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error("Update user error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Visitor management routes
  app.get("/api/visitors", async (_req: Request, res: Response) => {
    try {
      const visitors = await storage.listVisitors();
      return res.status(200).json(visitors);
    } catch (error) {
      console.error("Get visitors error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/visitors/today", async (_req: Request, res: Response) => {
    try {
      const visitors = await storage.listTodayVisitors();
      return res.status(200).json(visitors);
    } catch (error) {
      console.error("Get today's visitors error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/visitors/host/:hostId", async (req: Request, res: Response) => {
    try {
      const hostId = parseInt(req.params.hostId);
      
      if (isNaN(hostId)) {
        return res.status(400).json({ message: "Invalid host ID" });
      }
      
      const visitors = await storage.listVisitorsByHost(hostId);
      return res.status(200).json(visitors);
    } catch (error) {
      console.error("Get host visitors error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/visitors/pending/:hostId", async (req: Request, res: Response) => {
    try {
      const hostId = parseInt(req.params.hostId);
      
      if (isNaN(hostId)) {
        return res.status(400).json({ message: "Invalid host ID" });
      }
      
      const pendingVisitors = await storage.listPendingVisitorsByHost(hostId);
      return res.status(200).json(pendingVisitors);
    } catch (error) {
      console.error("Get pending visitors error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/visitors", upload.single("photo"), async (req: Request, res: Response) => {
    try {
      // Add photo URL if file was uploaded
      const visitorData = {
        ...req.body,
        photoUrl: req.file ? `/uploads/${req.file.filename}` : undefined,
        hostId: parseInt(req.body.hostId),
        createdBy: parseInt(req.body.createdBy)
      };
      
      const parsedData = insertVisitorSchema.parse(visitorData);
      const newVisitor = await storage.createVisitor(parsedData);
      
      // Emit socket event for real-time notifications
      io.to(`host-${newVisitor.hostId}`).emit("new-visitor", newVisitor);
      
      return res.status(201).json(newVisitor);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid visitor data", errors: error.errors });
      }
      console.error("Create visitor error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.patch("/api/visitors/:id/status", async (req: Request, res: Response) => {
    try {
      const visitorId = parseInt(req.params.id);
      const { status, comments } = req.body;
      
      if (isNaN(visitorId)) {
        return res.status(400).json({ message: "Invalid visitor ID" });
      }
      
      if (!status || !Object.values(VisitorStatus).includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const updatedVisitor = await storage.updateVisitorStatus(
        visitorId, 
        status, 
        comments
      );
      
      if (!updatedVisitor) {
        return res.status(404).json({ message: "Visitor not found" });
      }
      
      // Emit socket event for real-time updates
      io.emit("visitor-status-updated", updatedVisitor);
      
      return res.status(200).json(updatedVisitor);
    } catch (error) {
      console.error("Update visitor status error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.patch("/api/visitors/:id/checkin", async (req: Request, res: Response) => {
    try {
      const visitorId = parseInt(req.params.id);
      
      if (isNaN(visitorId)) {
        return res.status(400).json({ message: "Invalid visitor ID" });
      }
      
      const visitor = await storage.getVisitor(visitorId);
      
      if (!visitor) {
        return res.status(404).json({ message: "Visitor not found" });
      }
      
      if (visitor.status !== VisitorStatus.APPROVED) {
        return res.status(400).json({ message: "Visitor must be approved before check-in" });
      }
      
      const updatedVisitor = await storage.updateVisitorCheckIn(visitorId);
      
      if (!updatedVisitor) {
        return res.status(404).json({ message: "Failed to check in visitor" });
      }
      
      // Emit socket event for real-time updates
      io.emit("visitor-checked-in", updatedVisitor);
      
      return res.status(200).json(updatedVisitor);
    } catch (error) {
      console.error("Check in visitor error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.patch("/api/visitors/:id/checkout", async (req: Request, res: Response) => {
    try {
      const visitorId = parseInt(req.params.id);
      
      if (isNaN(visitorId)) {
        return res.status(400).json({ message: "Invalid visitor ID" });
      }
      
      const visitor = await storage.getVisitor(visitorId);
      
      if (!visitor) {
        return res.status(404).json({ message: "Visitor not found" });
      }
      
      if (visitor.status !== VisitorStatus.CHECKED_IN) {
        return res.status(400).json({ message: "Visitor must be checked in before check-out" });
      }
      
      const updatedVisitor = await storage.updateVisitorCheckOut(visitorId);
      
      if (!updatedVisitor) {
        return res.status(404).json({ message: "Failed to check out visitor" });
      }
      
      // Emit socket event for real-time updates
      io.emit("visitor-checked-out", updatedVisitor);
      
      return res.status(200).json(updatedVisitor);
    } catch (error) {
      console.error("Check out visitor error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Device management routes
  app.get("/api/devices", async (_req: Request, res: Response) => {
    try {
      const devices = await storage.listDevices();
      return res.status(200).json(devices);
    } catch (error) {
      console.error("Get devices error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/devices", async (req: Request, res: Response) => {
    try {
      const deviceData = insertDeviceSchema.parse(req.body);
      
      // Check if device ID already exists
      const existingDevice = await storage.getDeviceByDeviceId(deviceData.deviceId);
      if (existingDevice) {
        return res.status(400).json({ message: "Device ID already exists" });
      }
      
      const newDevice = await storage.createDevice(deviceData);
      return res.status(201).json(newDevice);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid device data", errors: error.errors });
      }
      console.error("Create device error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.patch("/api/devices/:id", async (req: Request, res: Response) => {
    try {
      const deviceId = parseInt(req.params.id);
      
      if (isNaN(deviceId)) {
        return res.status(400).json({ message: "Invalid device ID" });
      }
      
      const device = await storage.getDevice(deviceId);
      
      if (!device) {
        return res.status(404).json({ message: "Device not found" });
      }
      
      const updatedDevice = await storage.updateDevice(deviceId, req.body);
      
      if (!updatedDevice) {
        return res.status(404).json({ message: "Failed to update device" });
      }
      
      return res.status(200).json(updatedDevice);
    } catch (error) {
      console.error("Update device error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Notification routes
  app.get("/api/notifications/:userId", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const notifications = await storage.listNotificationsByUser(userId);
      return res.status(200).json(notifications);
    } catch (error) {
      console.error("Get notifications error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/notifications", async (req: Request, res: Response) => {
    try {
      const notificationData = insertNotificationSchema.parse(req.body);
      const newNotification = await storage.createNotification(notificationData);
      
      // Emit socket event for real-time notifications
      io.to(`user-${newNotification.userId}`).emit("new-notification", newNotification);
      
      return res.status(201).json(newNotification);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid notification data", errors: error.errors });
      }
      console.error("Create notification error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.patch("/api/notifications/:id/read", async (req: Request, res: Response) => {
    try {
      const notificationId = parseInt(req.params.id);
      
      if (isNaN(notificationId)) {
        return res.status(400).json({ message: "Invalid notification ID" });
      }
      
      const updatedNotification = await storage.markNotificationAsRead(notificationId);
      
      if (!updatedNotification) {
        return res.status(404).json({ message: "Notification not found" });
      }
      
      return res.status(200).json(updatedNotification);
    } catch (error) {
      console.error("Mark notification as read error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Access logs routes
  app.get("/api/access-logs/visitor/:visitorId", async (req: Request, res: Response) => {
    try {
      const visitorId = parseInt(req.params.visitorId);
      
      if (isNaN(visitorId)) {
        return res.status(400).json({ message: "Invalid visitor ID" });
      }
      
      const logs = await storage.listAccessLogsByVisitor(visitorId);
      return res.status(200).json(logs);
    } catch (error) {
      console.error("Get visitor access logs error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/access-logs/recent/:limit", async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.params.limit) || 10;
      const logs = await storage.listRecentAccessLogs(limit);
      return res.status(200).json(logs);
    } catch (error) {
      console.error("Get recent access logs error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/access-logs", async (req: Request, res: Response) => {
    try {
      const logData = insertAccessLogSchema.parse(req.body);
      const newLog = await storage.createAccessLog(logData);
      
      // Emit socket event for real-time updates
      io.emit("new-access-log", newLog);
      
      return res.status(201).json(newLog);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid access log data", errors: error.errors });
      }
      console.error("Create access log error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  // IoT device integration API
  app.post("/api/iot/access", async (req: Request, res: Response) => {
    try {
      const { deviceId, visitorId, action } = req.body;
      
      if (!deviceId || !visitorId || !action) {
        return res.status(400).json({ message: "Device ID, visitor ID, and action are required" });
      }
      
      const device = await storage.getDeviceByDeviceId(deviceId);
      
      if (!device) {
        return res.status(404).json({ message: "Device not found" });
      }
      
      if (!device.active) {
        return res.status(403).json({ message: "Device is inactive" });
      }
      
      const visitor = await storage.getVisitor(parseInt(visitorId));
      
      if (!visitor) {
        return res.status(404).json({ message: "Visitor not found" });
      }
      
      let accessGranted = false;
      let responseMessage = "";
      
      // Simple access control logic
      if (action === "entry" && visitor.status === VisitorStatus.APPROVED) {
        accessGranted = true;
        responseMessage = "Access granted for entry";
        await storage.updateVisitorCheckIn(visitor.id);
      } else if (action === "exit" && visitor.status === VisitorStatus.CHECKED_IN) {
        accessGranted = true;
        responseMessage = "Access granted for exit";
        await storage.updateVisitorCheckOut(visitor.id);
      } else {
        responseMessage = "Access denied";
      }
      
      // Create access log
      await storage.createAccessLog({
        visitorId: visitor.id,
        deviceId: device.id,
        action: accessGranted ? 
          (action === "entry" ? "check_in" : "check_out") : 
          "access_denied",
        details: responseMessage
      });
      
      // Update device last seen
      await storage.updateDevice(device.id, { lastSeen: new Date() });
      
      // Emit socket event for real-time updates
      io.emit("iot-access-event", {
        visitor,
        device,
        action,
        accessGranted,
        message: responseMessage
      });
      
      return res.status(200).json({
        success: true,
        accessGranted,
        message: responseMessage
      });
    } catch (error) {
      console.error("IoT access control error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Set up HTTP server for both Express and Socket.io
  const httpServer = createServer(app);
  
  // Set up Socket.io for real-time notifications
  const io = new SocketServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });
  
  // Socket.io connection handling
  io.on("connection", (socket) => {
    console.log("New client connected");
    
    socket.on("join-user-channel", (userId) => {
      socket.join(`user-${userId}`);
    });
    
    socket.on("join-host-channel", (hostId) => {
      socket.join(`host-${hostId}`);
    });
    
    socket.on("disconnect", () => {
      console.log("Client disconnected");
    });
  });

  return httpServer;
}
