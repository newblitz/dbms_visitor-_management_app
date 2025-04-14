import { useEffect, useState } from 'react';
import mqtt from 'mqtt'; // Import default export

interface MqttState {
  client: mqtt.MqttClient | null;
  status: 'connected' | 'disconnected' | 'connecting' | 'reconnecting' | 'error';
  error: Error | null;
}

interface UseMqttProps {
  uri: string;
  options?: mqtt.IClientOptions;
  topicsToSubscribe?: string[];
}

interface UseMqttReturn extends MqttState {
  subscribe: (topic: string) => void;
  unsubscribe: (topic: string) => void;
  publish: (topic: string, message: string) => void;
}

export function useMqtt({ uri, options, topicsToSubscribe = [] }: UseMqttProps): UseMqttReturn {
  const [state, setState] = useState<MqttState>({
    client: null,
    status: 'disconnected',
    error: null,
  });

  useEffect(() => {
    const client = mqtt.connect(uri, options);

    client.on('connect', () => {
      setState(prev => ({ ...prev, client, status: 'connected' }));
      
      // Subscribe to all topics in the list
      topicsToSubscribe.forEach(topic => {
        client.subscribe(topic);
      });
    });

    client.on('error', (error) => {
      console.error('MQTT error:', error);
      setState(prev => ({ ...prev, status: 'error', error }));
    });

    client.on('disconnect', () => {
      setState(prev => ({ ...prev, status: 'disconnected' }));
    });

    client.on('reconnect', () => {
      setState(prev => ({ ...prev, status: 'reconnecting' }));
    });

    return () => {
      if (client) {
        // Unsubscribe from all topics
        topicsToSubscribe.forEach(topic => {
          client.unsubscribe(topic);
        });
        client.end();
      }
    };
  }, [uri, options, JSON.stringify(topicsToSubscribe)]);

  const subscribe = (topic: string) => {
    if (state.client && state.status === 'connected') {
      state.client.subscribe(topic);
    }
  };

  const unsubscribe = (topic: string) => {
    if (state.client && state.status === 'connected') {
      state.client.unsubscribe(topic);
    }
  };

  const publish = (topic: string, message: string) => {
    if (state.client && state.status === 'connected') {
      state.client.publish(topic, message);
    }
  };

  return {
    ...state,
    subscribe,
    unsubscribe,
    publish,
  };
}

// Simplified version for components that only need to send commands
export function useMqttCommand() {
  const [client, setClient] = useState<mqtt.MqttClient | null>(null);

  useEffect(() => {
    const mqttClient = mqtt.connect('mqtt://localhost:1883', {
      clientId: `visitor-management-ui-${Math.random().toString(16).substr(2, 8)}`,
      clean: true,
    });

    mqttClient.on('connect', () => {
      setClient(mqttClient);
    });

    return () => {
      if (mqttClient) {
        mqttClient.end();
      }
    };
  }, []);

  const sendCommand = (deviceId: string, command: string, params: any = {}) => {
    if (!client) return false;
    
    const topic = `devices/${deviceId}/command`;
    const message = JSON.stringify({
      command,
      params,
      timestamp: new Date().toISOString(),
    });
    
    client.publish(topic, message);
    return true;
  };

  return {
    connected: !!client,
    sendCommand,
  };
}
