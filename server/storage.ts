import { 
  User, InsertUser, 
  Visitor, InsertVisitor, 
  Device, InsertDevice,
  VisitorStatus, UserRole
} from "@shared/schema";

// Storage interface
export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  listUsers(): Promise<User[]>;
  updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  
  // Visitor management
  getVisitor(id: number): Promise<Visitor | undefined>;
  createVisitor(visitor: InsertVisitor): Promise<Visitor>;
  listVisitors(): Promise<Visitor[]>;
  listPendingVisitors(hostId?: number): Promise<Visitor[]>;
  updateVisitorStatus(id: number, status: VisitorStatus, notes?: string): Promise<Visitor | undefined>;
  updateVisitor(id: number, data: Partial<InsertVisitor>): Promise<Visitor | undefined>;
  checkInVisitor(id: number): Promise<Visitor | undefined>;
  checkOutVisitor(id: number): Promise<Visitor | undefined>;
  
  // IoT device management
  getDevice(id: number): Promise<Device | undefined>;
  getDeviceByDeviceId(deviceId: string): Promise<Device | undefined>;
  createDevice(device: InsertDevice): Promise<Device>;
  listDevices(): Promise<Device[]>;
  updateDeviceStatus(id: number, active: boolean): Promise<Device | undefined>;
  updateDeviceLastSeen(deviceId: string): Promise<Device | undefined>;
  updateDevice(id: number, data: Partial<InsertDevice>): Promise<Device | undefined>;
  deleteDevice(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private visitors: Map<number, Visitor>;
  private devices: Map<number, Device>;
  private userIdCounter: number;
  private visitorIdCounter: number;
  private deviceIdCounter: number;

  constructor() {
    this.users = new Map();
    this.visitors = new Map();
    this.devices = new Map();
    this.userIdCounter = 1;
    this.visitorIdCounter = 1;
    this.deviceIdCounter = 1;

    // Add some default users
    this.initializeData();
  }

  private initializeData() {
    // Create default admin user
    this.createUser({
      username: "admin",
      password: "admin123",
      name: "Admin User",
      email: "admin@example.com",
      role: UserRole.ADMIN,
      department: "IT",
      phone: "1234567890",
      active: true
    });

    // Create default guard user
    this.createUser({
      username: "guard",
      password: "guard123",
      name: "Security Guard",
      email: "guard@example.com",
      role: UserRole.GUARD,
      department: "Security",
      phone: "9876543210",
      active: true
    });

    // Create default host user
    this.createUser({
      username: "host",
      password: "host123",
      name: "Meeting Host",
      email: "host@example.com",
      role: UserRole.HOST,
      department: "Management",
      phone: "5555555555",
      active: true
    });

    // Create a default device
    this.createDevice({
      name: "Main Entrance",
      type: "door",
      location: "Reception",
      deviceId: "door-001",
      active: true,
      config: {}
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    // Ensure we're using the proper UserRole enum type
    const user: User = { 
      ...insertUser, 
      id,
      role: insertUser.role as UserRole,
      department: insertUser.department || null,
      phone: insertUser.phone || null,
      active: insertUser.active !== undefined ? insertUser.active : true
    };
    this.users.set(id, user);
    return user;
  }

  async listUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    // Handle role to ensure it's the correct enum type
    const updatedUser: User = { 
      ...user,
      ...data,
      role: (data.role as UserRole) || user.role
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }

  // Visitor methods
  async getVisitor(id: number): Promise<Visitor | undefined> {
    return this.visitors.get(id);
  }

  async createVisitor(insertVisitor: InsertVisitor): Promise<Visitor> {
    const id = this.visitorIdCounter++;
    const now = new Date();
    
    const visitor: Visitor = { 
      ...insertVisitor, 
      id,
      createdAt: now,
      status: VisitorStatus.PENDING,
      email: insertVisitor.email || null,
      company: insertVisitor.company || null,
      photoUrl: insertVisitor.photoUrl || null,
      expectedDuration: insertVisitor.expectedDuration || null,
      notes: insertVisitor.notes || null,
      checkinTime: null,
      checkoutTime: null
    };
    
    this.visitors.set(id, visitor);
    return visitor;
  }

  async listVisitors(): Promise<Visitor[]> {
    return Array.from(this.visitors.values());
  }

  async listPendingVisitors(hostId?: number): Promise<Visitor[]> {
    return Array.from(this.visitors.values()).filter(visitor => {
      if (hostId) {
        return visitor.status === VisitorStatus.PENDING && visitor.hostId === hostId;
      }
      return visitor.status === VisitorStatus.PENDING;
    });
  }

  async updateVisitorStatus(id: number, status: VisitorStatus, notes?: string): Promise<Visitor | undefined> {
    const visitor = this.visitors.get(id);
    if (!visitor) return undefined;
    
    const updatedVisitor = { 
      ...visitor, 
      status,
      notes: notes ? (visitor.notes ? `${visitor.notes}\n${notes}` : notes) : visitor.notes
    };
    
    this.visitors.set(id, updatedVisitor);
    return updatedVisitor;
  }

  async updateVisitor(id: number, data: Partial<InsertVisitor>): Promise<Visitor | undefined> {
    const visitor = this.visitors.get(id);
    if (!visitor) return undefined;
    
    // Create a clean copy without the status field first
    const { status, ...cleanData } = data;
    
    // Then apply the typed status if it exists
    const statusUpdate = status ? { status: status as VisitorStatus } : {};
    
    const updatedVisitor: Visitor = { 
      ...visitor,
      ...cleanData,
      ...statusUpdate
    };
    
    this.visitors.set(id, updatedVisitor);
    return updatedVisitor;
  }

  async checkInVisitor(id: number): Promise<Visitor | undefined> {
    const visitor = this.visitors.get(id);
    if (!visitor) return undefined;
    
    const updatedVisitor = { 
      ...visitor, 
      status: VisitorStatus.CHECKED_IN,
      checkinTime: new Date()
    };
    
    this.visitors.set(id, updatedVisitor);
    return updatedVisitor;
  }

  async checkOutVisitor(id: number): Promise<Visitor | undefined> {
    const visitor = this.visitors.get(id);
    if (!visitor) return undefined;
    
    const updatedVisitor = { 
      ...visitor, 
      status: VisitorStatus.CHECKED_OUT,
      checkoutTime: new Date()
    };
    
    this.visitors.set(id, updatedVisitor);
    return updatedVisitor;
  }

  // Device methods
  async getDevice(id: number): Promise<Device | undefined> {
    return this.devices.get(id);
  }

  async getDeviceByDeviceId(deviceId: string): Promise<Device | undefined> {
    return Array.from(this.devices.values()).find(
      (device) => device.deviceId === deviceId
    );
  }

  async createDevice(insertDevice: InsertDevice): Promise<Device> {
    const id = this.deviceIdCounter++;
    const device: Device = { 
      ...insertDevice, 
      id,
      lastSeen: new Date(),
      active: insertDevice.active !== undefined ? insertDevice.active : true,
      config: insertDevice.config || {}
    };
    
    this.devices.set(id, device);
    return device;
  }

  async listDevices(): Promise<Device[]> {
    return Array.from(this.devices.values());
  }

  async updateDeviceStatus(id: number, active: boolean): Promise<Device | undefined> {
    const device = this.devices.get(id);
    if (!device) return undefined;
    
    const updatedDevice = { ...device, active };
    this.devices.set(id, updatedDevice);
    return updatedDevice;
  }

  async updateDeviceLastSeen(deviceId: string): Promise<Device | undefined> {
    const device = await this.getDeviceByDeviceId(deviceId);
    if (!device) return undefined;
    
    const updatedDevice = { ...device, lastSeen: new Date() };
    this.devices.set(device.id, updatedDevice);
    return updatedDevice;
  }

  async updateDevice(id: number, data: Partial<InsertDevice>): Promise<Device | undefined> {
    const device = this.devices.get(id);
    if (!device) return undefined;
    
    const updatedDevice = { ...device, ...data };
    this.devices.set(id, updatedDevice);
    return updatedDevice;
  }

  async deleteDevice(id: number): Promise<boolean> {
    return this.devices.delete(id);
  }
}

export const storage = new MemStorage();
