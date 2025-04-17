import { log } from "../vite";
import { smsService } from "./smsService";
import { facialRecognitionService } from "./facialRecognitionService";
import { Device, User, Visitor, VisitorStatus, DeviceCommand } from "@shared/schema";
import { db } from "../db";
import { eq } from "drizzle-orm";
import { devices, visitors, users } from "@shared/schema";

// Interface for IoT service operations
export interface IIoTService {
  // Register a new IoT device in the system
  registerDevice(deviceInfo: Omit<Device, "id" | "lastSeen" | "createdAt">): Promise<Device>;
  
  // Update a device's status (active/inactive)
  updateDeviceStatus(deviceId: string, active: boolean): Promise<boolean>;
  
  // Send a command to a specific device
  sendCommand(deviceId: string, command: DeviceCommand): Promise<boolean>;
  
  // Process door access request using facial recognition
  processDoorAccess(deviceId: string, imageData: string): Promise<{
    granted: boolean;
    visitor?: Visitor;
    message: string;
  }>;
  
  // Process visitor check-in using facial recognition
  processVisitorCheckIn(imageData: string): Promise<{
    success: boolean;
    visitor?: Visitor;
    message: string;
  }>;
  
  // Process visitor check-out
  processVisitorCheckOut(visitorId: number): Promise<{
    success: boolean;
    message: string;
  }>;
}

// Implementation of IoT service
export class IoTService implements IIoTService {
  async registerDevice(deviceInfo: Omit<Device, "id" | "lastSeen" | "createdAt">): Promise<Device> {
    try {
      // Insert the device into the database
      const [newDevice] = await db.insert(devices).values(deviceInfo).returning();
      
      log(`Registered new device: ${deviceInfo.name} (${deviceInfo.deviceId})`, "iot-service");
      
      return newDevice;
    } catch (error) {
      console.error("Error registering device:", error);
      throw error;
    }
  }
  
  async updateDeviceStatus(deviceId: string, active: boolean): Promise<boolean> {
    try {
      // Find the device first
      const [device] = await db.select().from(devices).where(eq(devices.deviceId, deviceId));
      
      if (!device) {
        log(`Device not found: ${deviceId}`, "iot-service");
        return false;
      }
      
      // Update the device status
      await db.update(devices)
        .set({ active, lastSeen: new Date() })
        .where(eq(devices.deviceId, deviceId));
      
      log(`Updated device status: ${deviceId} - ${active ? 'active' : 'inactive'}`, "iot-service");
      
      return true;
    } catch (error) {
      console.error("Error updating device status:", error);
      return false;
    }
  }
  
  async sendCommand(deviceId: string, command: DeviceCommand): Promise<boolean> {
    try {
      // Find the device first
      const [device] = await db.select().from(devices).where(eq(devices.deviceId, deviceId));
      
      if (!device) {
        log(`Device not found: ${deviceId}`, "iot-service");
        return false;
      }
      
      if (!device.active) {
        log(`Cannot send command to inactive device: ${deviceId}`, "iot-service");
        return false;
      }
      
      // In production, this would send the command to the actual device
      // For now, we'll just log it
      log(`Sending command to device ${deviceId}: ${command.command} ${JSON.stringify(command.params || {})}`, "iot-service");
      
      // Update the last seen timestamp
      await db.update(devices)
        .set({ lastSeen: new Date() })
        .where(eq(devices.deviceId, deviceId));
      
      return true;
    } catch (error) {
      console.error("Error sending command to device:", error);
      return false;
    }
  }
  
  async processDoorAccess(deviceId: string, imageData: string): Promise<{
    granted: boolean;
    visitor?: Visitor;
    message: string;
  }> {
    try {
      // Find the device
      const [device] = await db.select().from(devices).where(eq(devices.deviceId, deviceId));
      
      if (!device) {
        return {
          granted: false,
          message: `Unknown device: ${deviceId}`
        };
      }
      
      // Use facial recognition to identify the person
      const recognitionResult = await facialRecognitionService.recognizeFace(imageData);
      
      if (!recognitionResult.matched || !recognitionResult.personId) {
        log(`Access denied at ${device.name}: Face not recognized`, "iot-service");
        return {
          granted: false,
          message: "Face not recognized"
        };
      }
      
      // In a real system, we'd look up the visitor by the personId that matches their record
      // For this simulation, we'll look up a random checked-in visitor
      const [visitor] = await db.select()
        .from(visitors)
        .where(eq(visitors.status, VisitorStatus.CHECKED_IN));
      
      if (!visitor) {
        log(`Access denied at ${device.name}: No active visitor found`, "iot-service");
        return {
          granted: false,
          message: "No active visitor found"
        };
      }
      
      // Grant access
      log(`Access granted at ${device.name} for visitor: ${visitor.name}`, "iot-service");
      
      // In a real system, we would track this access in an access log
      
      return {
        granted: true,
        visitor,
        message: `Access granted for ${visitor.name}`
      };
    } catch (error) {
      console.error("Error processing door access:", error);
      return {
        granted: false,
        message: "Error processing access request"
      };
    }
  }
  
  async processVisitorCheckIn(imageData: string): Promise<{
    success: boolean;
    visitor?: Visitor;
    message: string;
  }> {
    try {
      // Use facial recognition to identify the person
      const recognitionResult = await facialRecognitionService.recognizeFace(imageData);
      
      // For demo purposes, we'll find a visitor that's in APPROVED status
      const [visitor] = await db.select()
        .from(visitors)
        .where(eq(visitors.status, VisitorStatus.APPROVED));
      
      if (!visitor) {
        log("Check-in failed: No approved visitor found", "iot-service");
        return {
          success: false,
          message: "No approved visitor found"
        };
      }
      
      // Update visitor status to CHECKED_IN
      const [updatedVisitor] = await db.update(visitors)
        .set({
          status: VisitorStatus.CHECKED_IN,
          checkinTime: new Date()
        })
        .where(eq(visitors.id, visitor.id))
        .returning();
      
      log(`Visitor checked in: ${visitor.name}`, "iot-service");
      
      // Send SMS notification to host
      const [host] = await db.select().from(users).where(eq(users.id, visitor.hostId));
      if (host && host.phone) {
        const checkInTime = new Date().toLocaleTimeString();
        await smsService.sendVisitorCheckin(
          host.phone,
          visitor.name,
          checkInTime
        );
      }
      
      return {
        success: true,
        visitor: updatedVisitor,
        message: `Successfully checked in ${visitor.name}`
      };
    } catch (error) {
      console.error("Error processing visitor check-in:", error);
      return {
        success: false,
        message: "Error processing check-in"
      };
    }
  }
  
  async processVisitorCheckOut(visitorId: number): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      // Find the visitor
      const [visitor] = await db.select().from(visitors).where(eq(visitors.id, visitorId));
      
      if (!visitor) {
        return {
          success: false,
          message: "Visitor not found"
        };
      }
      
      if (visitor.status !== VisitorStatus.CHECKED_IN) {
        return {
          success: false,
          message: `Visitor is not checked in (current status: ${visitor.status})`
        };
      }
      
      // Update visitor status to CHECKED_OUT
      await db.update(visitors)
        .set({
          status: VisitorStatus.CHECKED_OUT,
          checkoutTime: new Date()
        })
        .where(eq(visitors.id, visitorId));
      
      log(`Visitor checked out: ${visitor.name}`, "iot-service");
      
      return {
        success: true,
        message: `Successfully checked out ${visitor.name}`
      };
    } catch (error) {
      console.error("Error processing visitor check-out:", error);
      return {
        success: false,
        message: "Error processing check-out"
      };
    }
  }
}

// Create a singleton instance of the IoT service
export const iotService = new IoTService();