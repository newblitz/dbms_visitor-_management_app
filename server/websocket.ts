import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { log } from './vite';

// Message types for WebSocket communication
export enum MessageType {
  VISITOR_REGISTERED = 'visitor_registered',
  VISITOR_UPDATED = 'visitor_updated',
  VISITOR_CHECKED_IN = 'visitor_checked_in',
  VISITOR_CHECKED_OUT = 'visitor_checked_out',
  IOT_EVENT = 'iot_event',
  IOT_DEVICE_STATUS = 'iot_device_status',
  ERROR = 'error',
}

// Connection type for clients
export enum ConnectionType {
  ADMIN = 'admin',
  GUARD = 'guard',
  HOST = 'host',
  IOT_DEVICE = 'iot_device',
}

interface WebSocketClient extends WebSocket {
  id: string;
  connectionType?: ConnectionType;
  hostId?: number;
  deviceId?: string;
  isAlive: boolean;
}

// Class to manage WebSocket connections
export class SocketServer {
  private wss: WebSocketServer;
  private clients: Set<WebSocketClient> = new Set();
  
  constructor(server: HttpServer) {
    this.wss = new WebSocketServer({ server, path: '/ws' });
    this.init();
    this.setupPingPong();
  }
  
  private init() {
    this.wss.on('connection', (ws: WebSocket) => {
      const client = ws as WebSocketClient;
      client.id = Math.random().toString(36).substring(2, 15);
      client.isAlive = true;
      
      log(`WebSocket client connected: ${client.id}`, 'websocket');
      this.clients.add(client);
      
      client.on('message', (messageBuffer) => {
        try {
          const message = JSON.parse(messageBuffer.toString());
          this.handleMessage(client, message);
        } catch (error) {
          console.error('Error handling WebSocket message:', error);
          client.send(JSON.stringify({
            type: MessageType.ERROR,
            error: 'Invalid message format'
          }));
        }
      });
      
      client.on('close', () => {
        log(`WebSocket client disconnected: ${client.id}`, 'websocket');
        this.clients.delete(client);
      });
      
      client.on('pong', () => {
        client.isAlive = true;
      });
    });
    
    log('WebSocket server initialized', 'websocket');
  }
  
  private setupPingPong() {
    // Set up a ping interval to detect and clean up dead connections
    setInterval(() => {
      this.clients.forEach((client) => {
        if (client.isAlive === false) {
          log(`Terminating inactive connection: ${client.id}`, 'websocket');
          client.terminate();
          this.clients.delete(client);
          return;
        }
        
        client.isAlive = false;
        client.ping();
      });
    }, 30000); // Check every 30 seconds
  }
  
  private handleMessage(client: WebSocketClient, message: any) {
    // Handle different message types
    switch (message.type) {
      case 'register':
        // Register client type (admin, guard, host, iot_device)
        client.connectionType = message.connectionType;
        
        if (message.connectionType === ConnectionType.HOST) {
          client.hostId = message.hostId;
        } else if (message.connectionType === ConnectionType.IOT_DEVICE) {
          client.deviceId = message.deviceId;
        }
        
        log(`Client ${client.id} registered as ${message.connectionType}${message.hostId ? ` (hostId: ${message.hostId})` : ''}${message.deviceId ? ` (deviceId: ${message.deviceId})` : ''}`, 'websocket');
        
        // Acknowledge registration
        client.send(JSON.stringify({
          type: 'register_ack',
          connectionType: client.connectionType
        }));
        break;
        
      case 'ping':
        // Simple ping-pong for client-initiated heartbeat
        client.send(JSON.stringify({ type: 'pong' }));
        break;
        
      default:
        log(`Unknown message type: ${message.type}`, 'websocket');
        client.send(JSON.stringify({
          type: MessageType.ERROR,
          error: `Unknown message type: ${message.type}`
        }));
    }
  }
  
  // Broadcast a message to all connected clients
  public broadcast(message: any) {
    const messageStr = JSON.stringify(message);
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
  }
  
  // Send a message to clients of a specific type
  public broadcastToType(connectionType: ConnectionType, message: any) {
    const messageStr = JSON.stringify(message);
    this.clients.forEach((client) => {
      if (client.connectionType === connectionType && client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
  }
  
  // Send a message to a specific host
  public sendToHost(hostId: number, message: any) {
    const messageStr = JSON.stringify(message);
    this.clients.forEach((client) => {
      if (client.connectionType === ConnectionType.HOST && 
          client.hostId === hostId && 
          client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
  }
  
  // Send a message to a specific IoT device
  public sendToDevice(deviceId: string, message: any) {
    const messageStr = JSON.stringify(message);
    this.clients.forEach((client) => {
      if (client.connectionType === ConnectionType.IOT_DEVICE && 
          client.deviceId === deviceId &&
          client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
  }
}

// Export a function to create the WebSocket server
export function createSocketServer(server: HttpServer): SocketServer {
  return new SocketServer(server);
}