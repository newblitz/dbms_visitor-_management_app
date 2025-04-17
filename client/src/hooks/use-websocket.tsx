import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/hooks/use-toast';

// WebSocket message types
export enum WebSocketMessageType {
  VISITOR_REGISTERED = 'visitor_registered',
  VISITOR_UPDATED = 'visitor_updated',
  VISITOR_CHECKED_IN = 'visitor_checked_in',
  VISITOR_CHECKED_OUT = 'visitor_checked_out',
  IOT_EVENT = 'iot_event',
  IOT_DEVICE_STATUS = 'iot_device_status',
}

interface UseWebSocketOptions {
  onVisitorRegistered?: (visitor: any) => void;
  onVisitorUpdated?: (visitor: any) => void;
  onVisitorCheckedIn?: (visitor: any) => void;
  onVisitorCheckedOut?: (visitor: any) => void;
  onIotEvent?: (event: any) => void;
  onIotDeviceStatus?: (device: any) => void;
  showToasts?: boolean;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Helper to show toast notifications
  const showToast = useCallback((title: string, message: string, type: 'default' | 'success' | 'error' = 'default') => {
    if (options.showToasts === false) return;
    
    toast({
      title,
      description: message,
      variant: type === 'error' ? 'destructive' : 'default',
    });
  }, [options.showToasts, toast]);
  
  // Message handler
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);
      console.log('WebSocket message received:', data);
      
      // Handle different message types
      switch (data.type) {
        case WebSocketMessageType.VISITOR_REGISTERED:
          if (options.onVisitorRegistered) {
            options.onVisitorRegistered(data.visitor);
          }
          showToast('New Visitor', `${data.visitor.name} is waiting for approval`, 'success');
          break;
          
        case WebSocketMessageType.VISITOR_UPDATED:
          if (options.onVisitorUpdated) {
            options.onVisitorUpdated(data.visitor);
          }
          showToast('Visitor Updated', `${data.visitor.name}'s status changed to ${data.visitor.status}`);
          break;
          
        case WebSocketMessageType.VISITOR_CHECKED_IN:
          if (options.onVisitorCheckedIn) {
            options.onVisitorCheckedIn(data.visitor);
          }
          showToast('Visitor Checked In', `${data.visitor.name} has arrived and checked in`, 'success');
          break;
          
        case WebSocketMessageType.VISITOR_CHECKED_OUT:
          if (options.onVisitorCheckedOut) {
            options.onVisitorCheckedOut(data.visitor);
          }
          showToast('Visitor Checked Out', `${data.visitor.name} has left the building`);
          break;
          
        case WebSocketMessageType.IOT_EVENT:
          if (options.onIotEvent) {
            options.onIotEvent(data.event);
          }
          break;
          
        case WebSocketMessageType.IOT_DEVICE_STATUS:
          if (options.onIotDeviceStatus) {
            options.onIotDeviceStatus(data.device);
          }
          break;
          
        default:
          console.log('Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }, [options, showToast]);
  
  // Connect to WebSocket server
  const connect = useCallback(() => {
    // Don't connect if there's no authenticated user
    if (!user) return;
    
    // Create WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    ws.current = new WebSocket(wsUrl);
    
    ws.current.onopen = () => {
      console.log('WebSocket connection established');
      setIsConnected(true);
      
      // Register with role and userId
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({
          type: 'register',
          role: user.role,
          userId: user.id
        }));
      }
    };
    
    ws.current.onmessage = handleMessage;
    
    ws.current.onclose = () => {
      console.log('WebSocket connection closed');
      setIsConnected(false);
      
      // Attempt to reconnect after a delay
      setTimeout(() => {
        if (user) {
          connect();
        }
      }, 5000);
    };
    
    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };
    
    // Cleanup on unmount
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [user, handleMessage]);
  
  // Connect when user changes
  useEffect(() => {
    connect();
    
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [user, connect]);
  
  // Send a message through the WebSocket
  const sendMessage = useCallback((message: any) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  }, []);
  
  return {
    isConnected,
    sendMessage
  };
}