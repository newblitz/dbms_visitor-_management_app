import { 
  users, type User, type InsertUser,
  visitors, type Visitor, type InsertVisitor,
  devices, type Device, type InsertDevice,
  notifications, type Notification, type InsertNotification,
  accessLogs, type AccessLog, type InsertAccessLog,
  UserRoles, VisitorStatus, DeviceTypes, AccessActions
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  listUsers(): Promise<User[]>;
  listHostUsers(): Promise<User[]>;
  
  // Visitor operations
  getVisitor(id: number): Promise<Visitor | undefined>;
  createVisitor(visitor: InsertVisitor): Promise<Visitor>;
  updateVisitorStatus(id: number, status: string, comments?: string): Promise<Visitor | undefined>;
  updateVisitorCheckIn(id: number): Promise<Visitor | undefined>;
  updateVisitorCheckOut(id: number): Promise<Visitor | undefined>;
  listVisitors(): Promise<Visitor[]>;
  listVisitorsByHost(hostId: number): Promise<Visitor[]>;
  listPendingVisitorsByHost(hostId: number): Promise<Visitor[]>;
  listTodayVisitors(): Promise<Visitor[]>;

  // Device operations
  getDevice(id: number): Promise<Device | undefined>;
  getDeviceByDeviceId(deviceId: string): Promise<Device | undefined>;
  createDevice(device: InsertDevice): Promise<Device>;
  updateDevice(id: number, deviceData: Partial<Device>): Promise<Device | undefined>;
  listDevices(): Promise<Device[]>;
  
  // Notification operations
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<Notification | undefined>;
  listNotificationsByUser(userId: number): Promise<Notification[]>;
  
  // AccessLog operations
  createAccessLog(accessLog: InsertAccessLog): Promise<AccessLog>;
  listAccessLogsByVisitor(visitorId: number): Promise<AccessLog[]>;
  listRecentAccessLogs(limit: number): Promise<AccessLog[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private visitors: Map<number, Visitor>;
  private devices: Map<number, Device>;
  private notifications: Map<number, Notification>;
  private accessLogs: Map<number, AccessLog>;
  
  private userId: number;
  private visitorId: number;
  private deviceId: number;
  private notificationId: number;
  private accessLogId: number;

  constructor() {
    this.users = new Map();
    this.visitors = new Map();
    this.devices = new Map();
    this.notifications = new Map();
    this.accessLogs = new Map();
    
    this.userId = 1;
    this.visitorId = 1;
    this.deviceId = 1;
    this.notificationId = 1;
    this.accessLogId = 1;
    
    // Create default admin user
    this.createUser({
      username: "admin",
      password: "admin123",
      name: "System Admin",
      email: "admin@example.com",
      role: UserRoles.ADMIN,
      department: "IT",
      active: true
    });
    
    // Create default guard user
    this.createUser({
      username: "guard",
      password: "guard123",
      name: "Security Guard",
      email: "guard@example.com",
      role: UserRoles.GUARD,
      department: "Security",
      active: true
    });
    
    // Create default host user
    this.createUser({
      username: "host",
      password: "host123",
      name: "Department Host",
      email: "host@example.com",
      role: UserRoles.HOST,
      department: "Marketing",
      active: true
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(userData: InsertUser): Promise<User> {
    const id = this.userId++;
    const now = new Date();
    const user: User = { ...userData, id, createdAt: now };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async listUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  async listHostUsers(): Promise<User[]> {
    return Array.from(this.users.values())
      .filter(user => user.role === UserRoles.HOST && user.active);
  }

  // Visitor operations
  async getVisitor(id: number): Promise<Visitor | undefined> {
    return this.visitors.get(id);
  }

  async createVisitor(visitorData: InsertVisitor): Promise<Visitor> {
    const id = this.visitorId++;
    const now = new Date();
    const visitor: Visitor = { 
      ...visitorData, 
      id, 
      status: VisitorStatus.PENDING, 
      createdAt: now 
    };
    this.visitors.set(id, visitor);
    
    // Create notification for host
    await this.createNotification({
      userId: visitorData.hostId,
      title: "New Visitor",
      message: `${visitorData.name} is waiting for your approval`,
      relatedTo: "visitor",
      relatedId: id
    });
    
    return visitor;
  }

  async updateVisitorStatus(id: number, status: string, comments?: string): Promise<Visitor | undefined> {
    const visitor = this.visitors.get(id);
    if (!visitor) return undefined;
    
    const updatedVisitor = { 
      ...visitor, 
      status, 
      comments: comments || visitor.comments 
    };
    this.visitors.set(id, updatedVisitor);
    
    // Create notification for guard
    await this.createNotification({
      userId: visitor.createdBy,
      title: "Visitor Status Updated",
      message: `${visitor.name}'s visit has been ${status}`,
      relatedTo: "visitor",
      relatedId: id
    });
    
    return updatedVisitor;
  }

  async updateVisitorCheckIn(id: number): Promise<Visitor | undefined> {
    const visitor = this.visitors.get(id);
    if (!visitor) return undefined;
    
    const now = new Date();
    const updatedVisitor = { 
      ...visitor, 
      status: VisitorStatus.CHECKED_IN, 
      checkInTime: now 
    };
    this.visitors.set(id, updatedVisitor);
    
    // Create access log
    await this.createAccessLog({
      visitorId: id,
      action: AccessActions.CHECK_IN,
      details: `Checked in at ${now.toLocaleString()}`
    });
    
    return updatedVisitor;
  }

  async updateVisitorCheckOut(id: number): Promise<Visitor | undefined> {
    const visitor = this.visitors.get(id);
    if (!visitor) return undefined;
    
    const now = new Date();
    const updatedVisitor = { 
      ...visitor, 
      status: VisitorStatus.CHECKED_OUT, 
      checkOutTime: now 
    };
    this.visitors.set(id, updatedVisitor);
    
    // Create access log
    await this.createAccessLog({
      visitorId: id,
      action: AccessActions.CHECK_OUT,
      details: `Checked out at ${now.toLocaleString()}`
    });
    
    return updatedVisitor;
  }

  async listVisitors(): Promise<Visitor[]> {
    return Array.from(this.visitors.values());
  }
  
  async listVisitorsByHost(hostId: number): Promise<Visitor[]> {
    return Array.from(this.visitors.values())
      .filter(visitor => visitor.hostId === hostId);
  }
  
  async listPendingVisitorsByHost(hostId: number): Promise<Visitor[]> {
    return Array.from(this.visitors.values())
      .filter(visitor => 
        visitor.hostId === hostId && 
        visitor.status === VisitorStatus.PENDING
      );
  }
  
  async listTodayVisitors(): Promise<Visitor[]> {
    const today = new Date().toDateString();
    return Array.from(this.visitors.values())
      .filter(visitor => new Date(visitor.createdAt).toDateString() === today);
  }

  // Device operations
  async getDevice(id: number): Promise<Device | undefined> {
    return this.devices.get(id);
  }

  async getDeviceByDeviceId(deviceId: string): Promise<Device | undefined> {
    return Array.from(this.devices.values())
      .find(device => device.deviceId === deviceId);
  }

  async createDevice(deviceData: InsertDevice): Promise<Device> {
    const id = this.deviceId++;
    const now = new Date();
    const device: Device = { 
      ...deviceData, 
      id, 
      lastSeen: now, 
      createdAt: now 
    };
    this.devices.set(id, device);
    return device;
  }

  async updateDevice(id: number, deviceData: Partial<Device>): Promise<Device | undefined> {
    const device = this.devices.get(id);
    if (!device) return undefined;
    
    const updatedDevice = { ...device, ...deviceData };
    this.devices.set(id, updatedDevice);
    return updatedDevice;
  }

  async listDevices(): Promise<Device[]> {
    return Array.from(this.devices.values());
  }

  // Notification operations
  async createNotification(notificationData: InsertNotification): Promise<Notification> {
    const id = this.notificationId++;
    const now = new Date();
    const notification: Notification = { 
      ...notificationData, 
      id, 
      read: false, 
      createdAt: now 
    };
    this.notifications.set(id, notification);
    return notification;
  }

  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const notification = this.notifications.get(id);
    if (!notification) return undefined;
    
    const updatedNotification = { ...notification, read: true };
    this.notifications.set(id, updatedNotification);
    return updatedNotification;
  }

  async listNotificationsByUser(userId: number): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // AccessLog operations
  async createAccessLog(accessLogData: InsertAccessLog): Promise<AccessLog> {
    const id = this.accessLogId++;
    const now = new Date();
    const accessLog: AccessLog = { 
      ...accessLogData, 
      id, 
      timestamp: now 
    };
    this.accessLogs.set(id, accessLog);
    return accessLog;
  }

  async listAccessLogsByVisitor(visitorId: number): Promise<AccessLog[]> {
    return Array.from(this.accessLogs.values())
      .filter(log => log.visitorId === visitorId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
  
  async listRecentAccessLogs(limit: number): Promise<AccessLog[]> {
    return Array.from(this.accessLogs.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }
}

export const storage = new MemStorage();
