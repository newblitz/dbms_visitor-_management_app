import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { 
  insertUserSchema, 
  insertVisitorSchema, 
  insertDeviceSchema, 
  loginSchema,
  deviceCommandSchema,
  VisitorStatus,
  UserRole
} from "@shared/schema";
import * as mqtt from "mqtt";
import { WebSocketServer, WebSocket } from 'ws';

// Extended WebSocket interface for our custom userData
interface ExtendedWebSocket extends WebSocket {
  userData?: {
    role: UserRole;
    userId: number;
  };
}

// Basic session type
interface SessionData {
  userId: number;
  username: string;
  role: UserRole;
}

declare global {
  namespace Express {
    interface Request {
      session?: SessionData;
    }
  }
}

// Create an MQTT client to communicate with IoT devices
const mqttClient = mqtt.connect('mqtt://localhost:1883', {
  clientId: 'visitor-management-server',
  clean: true,
  connectTimeout: 4000,
});

mqttClient.on('connect', () => {
  console.log('Connected to MQTT broker');
  mqttClient.subscribe('devices/+/status', { qos: 0 });
});

mqttClient.on('message', async (topic, message) => {
  // Handle incoming device messages
  const topicParts = topic.split('/');
  if (topicParts.length === 3 && topicParts[0] === 'devices' && topicParts[2] === 'status') {
    const deviceId = topicParts[1];
    try {
      // Update last seen timestamp for the device
      await storage.updateDeviceLastSeen(deviceId);
    } catch (error) {
      console.error(`Error updating device ${deviceId} status:`, error);
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Initialize WebSocket server for real-time updates
  const wsServer = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Handle WebSocket connections
  wsServer.on('connection', (socket: ExtendedWebSocket) => {
    console.log('WebSocket client connected');
    
    socket.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('Received message:', data);
        
        // Handle different message types
        switch (data.type) {
          case 'register':
            // Client registration with role
            socket.userData = {
              role: data.role,
              userId: data.userId
            };
            socket.send(JSON.stringify({ type: 'registered', success: true }));
            break;
            
          default:
            console.log('Unknown message type:', data.type);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });
    
    socket.on('close', () => {
      console.log('WebSocket client disconnected');
    });
  });

  // Middleware to authenticate user session
  const authenticate = (req: Request, res: Response, next: Function) => {
    if (!req.session) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  // Middleware to check user role
  const checkRole = (roles: UserRole[]) => {
    return (req: Request, res: Response, next: Function) => {
      if (!req.session || !roles.includes(req.session.role)) {
        return res.status(403).json({ message: "Forbidden" });
      }
      next();
    };
  };

  // Helper to handle validation errors
  const validateSchema = (schema: any, data: any) => {
    try {
      return schema.parse(data);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        throw new Error(validationError.message);
      }
      throw error;
    }
  };

  // Authentication routes
  app.post('/api/auth/login', async (req, res) => {
    try {
      const credentials = validateSchema(loginSchema, req.body);
      const user = await storage.getUserByUsername(credentials.username);
      
      if (!user || user.password !== credentials.password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      if (!user.active) {
        return res.status(403).json({ message: "Account is deactivated" });
      }

      // Store user info in session
      req.session = {
        userId: user.id,
        username: user.username,
        role: user.role as UserRole
      };

      return res.status(200).json({
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department
      });
    } catch (error) {
      return res.status(400).json({ message: (error as Error).message });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    req.session = undefined;
    res.status(200).json({ message: "Logged out successfully" });
  });

  app.get('/api/auth/me', authenticate, async (req, res) => {
    try {
      const user = await storage.getUser(req.session!.userId);
      if (!user) {
        req.session = undefined;
        return res.status(401).json({ message: "User not found" });
      }

      return res.status(200).json({
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department
      });
    } catch (error) {
      return res.status(500).json({ message: (error as Error).message });
    }
  });

  // User management routes (Admin only)
  app.get('/api/users', authenticate, checkRole([UserRole.ADMIN]), async (req, res) => {
    try {
      const users = await storage.listUsers();
      return res.status(200).json(users.map(user => ({
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        phone: user.phone,
        active: user.active
      })));
    } catch (error) {
      return res.status(500).json({ message: (error as Error).message });
    }
  });

  app.post('/api/users', authenticate, checkRole([UserRole.ADMIN]), async (req, res) => {
    try {
      const userData = validateSchema(insertUserSchema, req.body);
      const existingUser = await storage.getUserByUsername(userData.username);
      
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }

      const user = await storage.createUser(userData);
      return res.status(201).json({
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        phone: user.phone,
        active: user.active
      });
    } catch (error) {
      return res.status(400).json({ message: (error as Error).message });
    }
  });

  app.patch('/api/users/:id', authenticate, checkRole([UserRole.ADMIN]), async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const userData = req.body;
      
      const updatedUser = await storage.updateUser(userId, userData);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      return res.status(200).json({
        id: updatedUser.id,
        username: updatedUser.username,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        department: updatedUser.department,
        phone: updatedUser.phone,
        active: updatedUser.active
      });
    } catch (error) {
      return res.status(400).json({ message: (error as Error).message });
    }
  });

  app.delete('/api/users/:id', authenticate, checkRole([UserRole.ADMIN]), async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Prevent deleting yourself
      if (userId === req.session!.userId) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }

      const deleted = await storage.deleteUser(userId);
      if (!deleted) {
        return res.status(404).json({ message: "User not found" });
      }

      return res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
      return res.status(500).json({ message: (error as Error).message });
    }
  });

  // Host routes
  app.get('/api/hosts', authenticate, async (req, res) => {
    try {
      const users = await storage.listUsers();
      const hosts = users.filter(user => user.role === UserRole.HOST && user.active);
      
      return res.status(200).json(hosts.map(host => ({
        id: host.id,
        name: host.name,
        department: host.department,
        email: host.email,
        phone: host.phone
      })));
    } catch (error) {
      return res.status(500).json({ message: (error as Error).message });
    }
  });

  // Visitor routes
  app.get('/api/visitors', authenticate, async (req, res) => {
    try {
      let visitors = await storage.listVisitors();

      // If not admin, filter based on role
      if (req.session!.role !== UserRole.ADMIN) {
        if (req.session!.role === UserRole.HOST) {
          // Hosts can only see their own visitors
          visitors = visitors.filter(visitor => visitor.hostId === req.session!.userId);
        }
        // Guards can see all visitors
      }

      return res.status(200).json(visitors);
    } catch (error) {
      return res.status(500).json({ message: (error as Error).message });
    }
  });

  app.get('/api/visitors/pending', authenticate, async (req, res) => {
    try {
      let pendingVisitors;
      if (req.session!.role === UserRole.HOST) {
        // Hosts only see their pending visitors
        pendingVisitors = await storage.listPendingVisitors(req.session!.userId);
      } else {
        // Admins and guards see all pending visitors
        pendingVisitors = await storage.listPendingVisitors();
      }

      return res.status(200).json(pendingVisitors);
    } catch (error) {
      return res.status(500).json({ message: (error as Error).message });
    }
  });

  app.post('/api/visitors', authenticate, checkRole([UserRole.GUARD, UserRole.ADMIN]), async (req, res) => {
    try {
      const visitorData = validateSchema(insertVisitorSchema, req.body);
      
      // Check if host exists
      const host = await storage.getUser(visitorData.hostId);
      if (!host || host.role !== UserRole.HOST) {
        return res.status(400).json({ message: "Invalid host selected" });
      }

      const visitor = await storage.createVisitor(visitorData);
      
      // Send real-time notification via WebSocket
      wsServer.clients.forEach(function(client: ExtendedWebSocket) {
        if (client.readyState === WebSocket.OPEN && client.userData?.role === UserRole.HOST) {
          // Send notification to the specific host
          if (client.userData.userId === visitor.hostId) {
            client.send(JSON.stringify({
              type: 'visitor_registered',
              visitor: visitor
            }));
          }
        }
        
        // Broadcast to admin and guard clients
        if (client.readyState === WebSocket.OPEN && 
            (client.userData?.role === UserRole.ADMIN || client.userData?.role === UserRole.GUARD)) {
          client.send(JSON.stringify({
            type: 'visitor_registered',
            visitor: visitor
          }));
        }
      });
      
      // Log notification for development/debug
      console.log(`Notification to host ${host.email}: New visitor ${visitor.name} is waiting for your approval`);
      
      return res.status(201).json(visitor);
    } catch (error) {
      return res.status(400).json({ message: (error as Error).message });
    }
  });

  app.patch('/api/visitors/:id/status', authenticate, async (req, res) => {
    try {
      const visitorId = parseInt(req.params.id);
      const { status, notes } = req.body;
      
      if (!Object.values(VisitorStatus).includes(status as VisitorStatus)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const visitor = await storage.getVisitor(visitorId);
      if (!visitor) {
        return res.status(404).json({ message: "Visitor not found" });
      }

      // Only hosts can approve/reject their own visitors
      if (req.session!.role === UserRole.HOST && 
          (status === VisitorStatus.APPROVED || status === VisitorStatus.REJECTED)) {
        if (visitor.hostId !== req.session!.userId) {
          return res.status(403).json({ message: "You can only approve/reject your own visitors" });
        }
      }

      // Only guards/admin can check-in/check-out visitors
      if ((status === VisitorStatus.CHECKED_IN || status === VisitorStatus.CHECKED_OUT) && 
          req.session!.role !== UserRole.GUARD && req.session!.role !== UserRole.ADMIN) {
        return res.status(403).json({ message: "Only guards can check in or check out visitors" });
      }

      let updatedVisitor;
      if (status === VisitorStatus.CHECKED_IN) {
        updatedVisitor = await storage.checkInVisitor(visitorId);
      } else if (status === VisitorStatus.CHECKED_OUT) {
        updatedVisitor = await storage.checkOutVisitor(visitorId);
      } else {
        updatedVisitor = await storage.updateVisitorStatus(visitorId, status as VisitorStatus, notes);
      }

      if (!updatedVisitor) {
        return res.status(404).json({ message: "Failed to update visitor status" });
      }

      // If visitor was approved and there are devices, send a command to unlock the doors
      if (status === VisitorStatus.APPROVED) {
        const devices = await storage.listDevices();
        const entranceDoors = devices.filter(device => device.type === 'door' && device.active);
        
        for (const door of entranceDoors) {
          mqttClient.publish(`devices/${door.deviceId}/command`, JSON.stringify({
            command: 'unlock',
            visitorId: visitorId,
            visitorName: updatedVisitor.name
          }));
        }
      }
      
      // Send real-time update of visitor status via WebSocket
      wsServer.clients.forEach(function(client: ExtendedWebSocket) {
        if (client.readyState === WebSocket.OPEN) {
          const visitorUpdate = {
            type: status === VisitorStatus.CHECKED_IN ? 'visitor_checked_in' : 
                  status === VisitorStatus.CHECKED_OUT ? 'visitor_checked_out' : 
                  'visitor_updated',
            visitor: updatedVisitor
          };
          
          // Send to relevant clients based on role
          if (client.userData?.role === UserRole.HOST && client.userData.userId === updatedVisitor.hostId) {
            // Send to specific host
            client.send(JSON.stringify(visitorUpdate));
          } else if (client.userData?.role === UserRole.ADMIN || client.userData?.role === UserRole.GUARD) {
            // Send to all admins and guards
            client.send(JSON.stringify(visitorUpdate));
          }
        }
      });

      return res.status(200).json(updatedVisitor);
    } catch (error) {
      return res.status(400).json({ message: (error as Error).message });
    }
  });

  app.get('/api/visitors/:id', authenticate, async (req, res) => {
    try {
      const visitorId = parseInt(req.params.id);
      const visitor = await storage.getVisitor(visitorId);
      
      if (!visitor) {
        return res.status(404).json({ message: "Visitor not found" });
      }

      // Check permissions
      if (req.session!.role === UserRole.HOST && visitor.hostId !== req.session!.userId) {
        return res.status(403).json({ message: "You can only view your own visitors" });
      }

      return res.status(200).json(visitor);
    } catch (error) {
      return res.status(500).json({ message: (error as Error).message });
    }
  });

  // IoT Device routes (Admin only)
  app.get('/api/devices', authenticate, checkRole([UserRole.ADMIN]), async (req, res) => {
    try {
      const devices = await storage.listDevices();
      return res.status(200).json(devices);
    } catch (error) {
      return res.status(500).json({ message: (error as Error).message });
    }
  });

  app.post('/api/devices', authenticate, checkRole([UserRole.ADMIN]), async (req, res) => {
    try {
      const deviceData = validateSchema(insertDeviceSchema, req.body);
      
      const existingDevice = await storage.getDeviceByDeviceId(deviceData.deviceId);
      if (existingDevice) {
        return res.status(409).json({ message: "Device ID already exists" });
      }

      const device = await storage.createDevice(deviceData);
      return res.status(201).json(device);
    } catch (error) {
      return res.status(400).json({ message: (error as Error).message });
    }
  });

  app.patch('/api/devices/:id', authenticate, checkRole([UserRole.ADMIN]), async (req, res) => {
    try {
      const deviceId = parseInt(req.params.id);
      const deviceData = req.body;
      
      const updatedDevice = await storage.updateDevice(deviceId, deviceData);
      if (!updatedDevice) {
        return res.status(404).json({ message: "Device not found" });
      }

      return res.status(200).json(updatedDevice);
    } catch (error) {
      return res.status(400).json({ message: (error as Error).message });
    }
  });

  app.delete('/api/devices/:id', authenticate, checkRole([UserRole.ADMIN]), async (req, res) => {
    try {
      const deviceId = parseInt(req.params.id);
      const deleted = await storage.deleteDevice(deviceId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Device not found" });
      }

      return res.status(200).json({ message: "Device deleted successfully" });
    } catch (error) {
      return res.status(500).json({ message: (error as Error).message });
    }
  });

  app.post('/api/devices/command', authenticate, checkRole([UserRole.ADMIN, UserRole.GUARD]), async (req, res) => {
    try {
      const command = validateSchema(deviceCommandSchema, req.body);
      
      const device = await storage.getDeviceByDeviceId(command.deviceId);
      if (!device) {
        return res.status(404).json({ message: "Device not found" });
      }

      if (!device.active) {
        return res.status(400).json({ message: "Device is not active" });
      }

      // Publish command to device topic
      mqttClient.publish(`devices/${device.deviceId}/command`, JSON.stringify({
        command: command.command,
        params: command.params,
        source: {
          userId: req.session!.userId,
          username: req.session!.username,
          role: req.session!.role
        }
      }));

      return res.status(200).json({ 
        message: `Command ${command.command} sent to device ${device.name}`,
        success: true 
      });
    } catch (error) {
      return res.status(400).json({ message: (error as Error).message });
    }
  });

  // Dashboard statistics
  app.get('/api/stats', authenticate, async (req, res) => {
    try {
      const visitors = await storage.listVisitors();
      
      // Filter based on user role
      let filteredVisitors = visitors;
      if (req.session!.role === UserRole.HOST) {
        filteredVisitors = visitors.filter(visitor => visitor.hostId === req.session!.userId);
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const stats = {
        totalVisitors: filteredVisitors.length,
        checkedInToday: filteredVisitors.filter(v => 
          v.status === VisitorStatus.CHECKED_IN && 
          v.checkinTime && 
          new Date(v.checkinTime) >= today
        ).length,
        pendingApproval: filteredVisitors.filter(v => v.status === VisitorStatus.PENDING).length,
        averageDuration: calculateAverageDuration(filteredVisitors),
      };

      return res.status(200).json(stats);
    } catch (error) {
      return res.status(500).json({ message: (error as Error).message });
    }
  });

  // Helper function to calculate average visit duration
  function calculateAverageDuration(visitors: any[]): number {
    const completedVisits = visitors.filter(v => 
      v.status === VisitorStatus.CHECKED_OUT && 
      v.checkinTime && 
      v.checkoutTime
    );
    
    if (completedVisits.length === 0) return 0;
    
    const totalDuration = completedVisits.reduce((sum, v) => {
      const checkin = new Date(v.checkinTime).getTime();
      const checkout = new Date(v.checkoutTime).getTime();
      return sum + (checkout - checkin);
    }, 0);
    
    return Math.round(totalDuration / completedVisits.length / (1000 * 60)); // in minutes
  }

  return httpServer;
}
