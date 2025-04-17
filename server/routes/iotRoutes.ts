import { Express, Request, Response } from "express";
import { iotService } from "../services/iotService";
import { deviceCommandSchema } from "@shared/schema";
import { z } from "zod";

export function registerIoTRoutes(app: Express) {
  // Register a new IoT device
  app.post("/api/iot/devices", async (req: Request, res: Response) => {
    try {
      const newDevice = await iotService.registerDevice(req.body);
      res.status(201).json(newDevice);
    } catch (error) {
      console.error("Error registering device:", error);
      res.status(500).json({ error: "Failed to register device" });
    }
  });

  // Get device status
  app.get("/api/iot/devices/:deviceId", async (req: Request, res: Response) => {
    try {
      const device = await db.select().from(devices).where(eq(devices.deviceId, req.params.deviceId));
      
      if (!device.length) {
        return res.status(404).json({ error: "Device not found" });
      }
      
      res.json(device[0]);
    } catch (error) {
      console.error("Error getting device:", error);
      res.status(500).json({ error: "Failed to get device" });
    }
  });

  // Update device status
  app.patch("/api/iot/devices/:deviceId/status", async (req: Request, res: Response) => {
    try {
      const { active } = req.body;
      
      if (typeof active !== "boolean") {
        return res.status(400).json({ error: "active must be a boolean" });
      }
      
      const success = await iotService.updateDeviceStatus(req.params.deviceId, active);
      
      if (!success) {
        return res.status(404).json({ error: "Device not found" });
      }
      
      res.json({ success: true, active });
    } catch (error) {
      console.error("Error updating device status:", error);
      res.status(500).json({ error: "Failed to update device status" });
    }
  });

  // Send command to device
  app.post("/api/iot/devices/:deviceId/command", async (req: Request, res: Response) => {
    try {
      const commandResult = deviceCommandSchema.safeParse(req.body);
      
      if (!commandResult.success) {
        return res.status(400).json({ error: "Invalid command format" });
      }
      
      const success = await iotService.sendCommand(req.params.deviceId, commandResult.data);
      
      if (!success) {
        return res.status(404).json({ error: "Device not found or inactive" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error sending command to device:", error);
      res.status(500).json({ error: "Failed to send command to device" });
    }
  });

  // Process door access with facial recognition
  app.post("/api/iot/access", async (req: Request, res: Response) => {
    try {
      const { deviceId, imageData } = req.body;
      
      if (!deviceId || !imageData) {
        return res.status(400).json({ error: "deviceId and imageData are required" });
      }
      
      const accessResult = await iotService.processDoorAccess(deviceId, imageData);
      
      res.json(accessResult);
    } catch (error) {
      console.error("Error processing door access:", error);
      res.status(500).json({ error: "Failed to process door access" });
    }
  });

  // Process visitor check-in with facial recognition
  app.post("/api/iot/checkin", async (req: Request, res: Response) => {
    try {
      const { imageData } = req.body;
      
      if (!imageData) {
        return res.status(400).json({ error: "imageData is required" });
      }
      
      const checkInResult = await iotService.processVisitorCheckIn(imageData);
      
      res.json(checkInResult);
    } catch (error) {
      console.error("Error processing visitor check-in:", error);
      res.status(500).json({ error: "Failed to process visitor check-in" });
    }
  });

  // Process visitor check-out
  app.post("/api/iot/checkout/:visitorId", async (req: Request, res: Response) => {
    try {
      const visitorId = parseInt(req.params.visitorId);
      
      if (isNaN(visitorId)) {
        return res.status(400).json({ error: "Invalid visitor ID" });
      }
      
      const checkOutResult = await iotService.processVisitorCheckOut(visitorId);
      
      res.json(checkOutResult);
    } catch (error) {
      console.error("Error processing visitor check-out:", error);
      res.status(500).json({ error: "Failed to process visitor check-out" });
    }
  });
}

// Import necessary dependencies
import { db } from "../db";
import { devices } from "@shared/schema";
import { eq } from "drizzle-orm";