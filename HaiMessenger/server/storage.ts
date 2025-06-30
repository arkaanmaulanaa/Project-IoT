import { users, sensorReadings, type User, type InsertUser, type SensorReading, type InsertSensorReading } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createSensorReading(reading: InsertSensorReading): Promise<SensorReading>;
  getRecentSensorReadings(limit: number): Promise<SensorReading[]>;
  getLatestSensorReading(): Promise<SensorReading | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private sensorReadings: Map<number, SensorReading>;
  private currentUserId: number;
  private currentReadingId: number;

  constructor() {
    this.users = new Map();
    this.sensorReadings = new Map();
    this.currentUserId = 1;
    this.currentReadingId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createSensorReading(insertReading: InsertSensorReading): Promise<SensorReading> {
    const id = this.currentReadingId++;
    const reading: SensorReading = {
      id,
      dhtTemperature: insertReading.dhtTemperature ?? null,
      lm35Temperature: insertReading.lm35Temperature ?? null,
      ledLevel: insertReading.ledLevel ?? 0,
      timestamp: new Date(),
    };
    this.sensorReadings.set(id, reading);
    return reading;
  }

  async getRecentSensorReadings(limit: number): Promise<SensorReading[]> {
    const readings = Array.from(this.sensorReadings.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
    return readings;
  }

  async getLatestSensorReading(): Promise<SensorReading | undefined> {
    const readings = Array.from(this.sensorReadings.values());
    if (readings.length === 0) return undefined;
    return readings.reduce((latest, current) => 
      current.timestamp.getTime() > latest.timestamp.getTime() ? current : latest
    );
  }
}

export const storage = new MemStorage();
