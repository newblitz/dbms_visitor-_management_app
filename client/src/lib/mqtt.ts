import mqtt, { MqttClient } from 'mqtt';

class MqttService {
  private client: MqttClient | null = null;
  private subscribers: Map<string, Set<(message: any) => void>> = new Map();
  
  // Connect to MQTT broker
  connect(brokerUrl: string, options: mqtt.IClientOptions = {}) {
    if (this.client) {
      console.warn('MQTT client already connected. Disconnecting previous connection.');
      this.disconnect();
    }
    
    try {
      this.client = mqtt.connect(brokerUrl, {
        ...options,
        reconnectPeriod: 1000,
        connectTimeout: 30 * 1000
      });
      
      this.client.on('connect', () => {
        console.log('Connected to MQTT broker');
        
        // Resubscribe to all topics
        this.subscribers.forEach((_, topic) => {
          this.client?.subscribe(topic);
        });
      });
      
      this.client.on('message', (topic, message) => {
        const subscribers = this.subscribers.get(topic);
        if (subscribers) {
          try {
            const parsedMessage = JSON.parse(message.toString());
            subscribers.forEach(callback => callback(parsedMessage));
          } catch (error) {
            console.error('Error parsing MQTT message:', error);
            subscribers.forEach(callback => callback(message.toString()));
          }
        }
      });
      
      this.client.on('error', (error) => {
        console.error('MQTT connection error:', error);
      });
      
      this.client.on('offline', () => {
        console.warn('MQTT client offline');
      });
      
      this.client.on('reconnect', () => {
        console.log('MQTT client reconnecting');
      });
    } catch (error) {
      console.error('Failed to connect to MQTT broker:', error);
    }
  }
  
  // Disconnect from MQTT broker
  disconnect() {
    if (this.client) {
      this.client.end();
      this.client = null;
      console.log('Disconnected from MQTT broker');
    }
  }
  
  // Subscribe to a topic
  subscribe(topic: string, callback: (message: any) => void) {
    if (!this.subscribers.has(topic)) {
      this.subscribers.set(topic, new Set());
      
      // Subscribe to the topic if the client is connected
      if (this.client && this.client.connected) {
        this.client.subscribe(topic);
      }
    }
    
    const subscribers = this.subscribers.get(topic);
    if (subscribers) {
      subscribers.add(callback);
    }
    
    // Return an unsubscribe function
    return () => this.unsubscribe(topic, callback);
  }
  
  // Unsubscribe from a topic
  unsubscribe(topic: string, callback: (message: any) => void) {
    const subscribers = this.subscribers.get(topic);
    if (subscribers) {
      subscribers.delete(callback);
      
      if (subscribers.size === 0) {
        this.subscribers.delete(topic);
        
        // Unsubscribe from the topic if the client is connected
        if (this.client && this.client.connected) {
          this.client.unsubscribe(topic);
        }
      }
    }
  }
  
  // Publish a message to a topic
  publish(topic: string, message: any) {
    if (!this.client || !this.client.connected) {
      console.error('Cannot publish: MQTT client not connected');
      return false;
    }
    
    try {
      const messageString = typeof message === 'object' 
        ? JSON.stringify(message) 
        : message.toString();
      
      this.client.publish(topic, messageString);
      return true;
    } catch (error) {
      console.error('Error publishing MQTT message:', error);
      return false;
    }
  }
  
  // Check if the client is connected
  isConnected() {
    return this.client?.connected || false;
  }
}

export const mqttService = new MqttService();

// Hook for using MQTT in React components
export function useMqttSubscription(topic: string, callback: (message: any) => void) {
  // This would be implemented as a React hook in a real application
  // For now, we'll just return a simple wrapper
  return {
    subscribe: () => mqttService.subscribe(topic, callback),
    unsubscribe: () => mqttService.unsubscribe(topic, callback),
    publish: (message: any) => mqttService.publish(topic, message),
  };
}
