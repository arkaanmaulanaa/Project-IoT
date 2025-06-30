import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertSensorReadingSchema } from "@shared/schema";
import mqtt from "mqtt";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // WebSocket server for real-time communication with frontend
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Store WebSocket connections
  const wsConnections = new Set<WebSocket>();
  
  // MQTT Configuration
  const MQTT_CONFIG = {
    host: 'mqtt.revolusi-it.com',
    port: 1883,
    username: 'usm',
    password: 'usmjaya1',
    clientId: 'WebServer_' + Math.random().toString(16).substr(2, 8),
    topic: 'iot/G.231.22.0062'
  };

  // Initialize MQTT client
  const mqttClient = mqtt.connect(`mqtt://${MQTT_CONFIG.host}:${MQTT_CONFIG.port}`, {
    username: MQTT_CONFIG.username,
    password: MQTT_CONFIG.password,
    clientId: MQTT_CONFIG.clientId,
    keepalive: 60,
    clean: true,
    reconnectPeriod: 5000,
  });

  mqttClient.on('connect', () => {
    console.log('MQTT connected to', MQTT_CONFIG.host);
    mqttClient.subscribe(MQTT_CONFIG.topic, (err: any) => {
      if (err) {
        console.error('MQTT subscription error:', err);
      } else {
        console.log('Subscribed to topic:', MQTT_CONFIG.topic);
      }
    });
  });

  mqttClient.on('message', async (topic: string, message: Buffer) => {
    try {
      const data = JSON.parse(message.toString());
      console.log('Received MQTT data:', data);
      
      // Validate and store sensor reading
      const sensorReading = insertSensorReadingSchema.parse({
        dhtTemperature: data.suhuDHT,
        lm35Temperature: data.suhuLM35,
        ledLevel: data.LED
      });
      
      const storedReading = await storage.createSensorReading(sensorReading);
      
      // Broadcast to all WebSocket clients
      const broadcastData = {
        type: 'sensor_data',
        data: storedReading
      };
      
      wsConnections.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(broadcastData));
        }
      });
      
    } catch (error) {
      console.error('Error processing MQTT message:', error);
    }
  });

  mqttClient.on('error', (error: any) => {
    console.error('MQTT connection error:', error);
  });

  mqttClient.on('close', () => {
    console.log('MQTT connection closed');
  });

  // Handle WebSocket connections
  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    wsConnections.add(ws);
    
    // Send connection status
    ws.send(JSON.stringify({
      type: 'connection_status',
      status: 'connected'
    }));
    
    // Send latest sensor reading if available
    storage.getLatestSensorReading().then(reading => {
      if (reading) {
        ws.send(JSON.stringify({
          type: 'sensor_data',
          data: reading
        }));
      }
    });

    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      wsConnections.delete(ws);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      wsConnections.delete(ws);
    });
  });

  // API routes
  app.get('/api/readings/recent', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const readings = await storage.getRecentSensorReadings(limit);
      res.json(readings);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch readings' });
    }
  });

  app.get('/api/readings/latest', async (req, res) => {
    try {
      const reading = await storage.getLatestSensorReading();
      if (reading) {
        res.json(reading);
      } else {
        res.status(404).json({ error: 'No readings available' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch latest reading' });
    }
  });

  return httpServer;
}
