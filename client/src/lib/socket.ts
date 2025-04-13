import { io, Socket } from 'socket.io-client';
import { useEffect, useState } from 'react';

let socket: Socket | null = null;

// Initialize the socket connection
export const initializeSocket = (): Socket => {
  if (!socket) {
    socket = io('/', {
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    
    socket.on('connect', () => {
      console.log('Socket connected');
    });
    
    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
    
    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });
  }
  
  return socket;
};

// Get the socket instance or initialize it
export const getSocket = (): Socket => {
  if (!socket) {
    return initializeSocket();
  }
  return socket;
};

// Disconnect the socket
export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Hook for using socket events in React components
export const useSocketEvent = <T>(
  event: string, 
  callback: (data: T) => void
): void => {
  useEffect(() => {
    const socket = getSocket();
    
    socket.on(event, callback);
    
    return () => {
      socket.off(event, callback);
    };
  }, [event, callback]);
};

// Hook for joining socket rooms
export const useSocketRoom = (room: string): void => {
  useEffect(() => {
    const socket = getSocket();
    
    if (room) {
      socket.emit('join-room', room);
    }
    
    return () => {
      if (room) {
        socket.emit('leave-room', room);
      }
    };
  }, [room]);
};

// Hook for joining user-specific channel
export const useUserChannel = (userId: number | null): void => {
  useEffect(() => {
    if (!userId) return;
    
    const socket = getSocket();
    socket.emit('join-user-channel', userId);
    
    return () => {
      socket.emit('leave-room', `user-${userId}`);
    };
  }, [userId]);
};

// Hook for joining host-specific channel
export const useHostChannel = (hostId: number | null): void => {
  useEffect(() => {
    if (!hostId) return;
    
    const socket = getSocket();
    socket.emit('join-host-channel', hostId);
    
    return () => {
      socket.emit('leave-room', `host-${hostId}`);
    };
  }, [hostId]);
};

// Hook for socket connection status
export const useSocketStatus = (): boolean => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  
  useEffect(() => {
    const socket = getSocket();
    
    const onConnect = () => {
      setIsConnected(true);
    };
    
    const onDisconnect = () => {
      setIsConnected(false);
    };
    
    // Initial status
    setIsConnected(socket.connected);
    
    // Event listeners
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);
  
  return isConnected;
};
