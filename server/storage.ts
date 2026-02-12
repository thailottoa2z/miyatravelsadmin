
import { 
  cashTransactions, flightBookings, vehicles, cabBookings, cabRuns, visaApplications,
  type InsertCashTransaction, type InsertFlightBooking, type InsertVehicle, type InsertCabBooking, type InsertCabRun, type InsertVisaApplication,
  type CashTransaction, type FlightBooking, type Vehicle, type CabBooking, type CabRun, type VisaApplication
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, ilike, or } from "drizzle-orm";

export interface IStorage {
  // Cash
  getCashTransactions(): Promise<CashTransaction[]>;
  createCashTransaction(data: InsertCashTransaction): Promise<CashTransaction>;
  getCashStats(): Promise<{ totalBalance: number; totalIn: number; totalOut: number }>;

  // Flights
  getFlightBookings(): Promise<FlightBooking[]>;
  createFlightBooking(data: InsertFlightBooking): Promise<FlightBooking>;
  deleteFlightBooking(id: number): Promise<void>;

  // Vehicles
  getVehicles(): Promise<Vehicle[]>;
  createVehicle(data: InsertVehicle): Promise<Vehicle>;
  
  // Cab Bookings
  getCabBookings(): Promise<(CabBooking & { vehicle: Vehicle | null })[]>;
  createCabBooking(data: InsertCabBooking): Promise<CabBooking>;
  updateCabBooking(id: number, data: Partial<InsertCabBooking>): Promise<CabBooking | undefined>;
  getCabBooking(id: number): Promise<CabBooking | undefined>;

  // Cab Runs
  getCabRuns(): Promise<CabRun[]>;
  createCabRun(data: InsertCabRun): Promise<CabRun>;
  
  // Visa
  getVisaApplications(search?: string): Promise<VisaApplication[]>;
  createVisaApplication(data: InsertVisaApplication): Promise<VisaApplication>;
  updateVisaApplication(id: number, data: Partial<InsertVisaApplication>): Promise<VisaApplication | undefined>;
  
  // Global Search
  searchGlobal(query: string): Promise<{ visa: VisaApplication[], flights: FlightBooking[], cabs: CabBooking[] }>;
}

export class DatabaseStorage implements IStorage {
  async getCashTransactions(): Promise<CashTransaction[]> {
    return await db.select().from(cashTransactions).orderBy(desc(cashTransactions.createdAt));
  }

  async createCashTransaction(data: InsertCashTransaction): Promise<CashTransaction> {
    const [transaction] = await db.insert(cashTransactions).values(data).returning();
    return transaction;
  }

  async getCashStats(): Promise<{ totalBalance: number; totalIn: number; totalOut: number }> {
    const transactions = await this.getCashTransactions();
    let totalIn = 0;
    let totalOut = 0;
    
    // Seed amount logic: The requirements say "Starting ₹4,50,000". 
    // We should treat this as the base.
    // If no transactions, balance is 450000.
    // Ideally we insert an initial transaction, but calculating on fly is fine too.
    
    // Let's assume the 450k is an initial "In" transaction we seed, or just a base constant.
    // For simpler logic, let's just sum In and Out.
    
    for (const t of transactions) {
      const amt = Number(t.amount);
      if (t.type === 'in') totalIn += amt;
      else totalOut += amt;
    }

    return { totalBalance: totalIn - totalOut, totalIn, totalOut };
  }

  async getFlightBookings(): Promise<FlightBooking[]> {
    return await db.select().from(flightBookings).orderBy(desc(flightBookings.createdAt));
  }

  async createFlightBooking(data: InsertFlightBooking): Promise<FlightBooking> {
    const [booking] = await db.insert(flightBookings).values(data).returning();
    return booking;
  }

  async deleteFlightBooking(id: number): Promise<void> {
    await db.delete(flightBookings).where(eq(flightBookings.id, id));
  }

  async getVehicles(): Promise<Vehicle[]> {
    return await db.select().from(vehicles);
  }

  async createVehicle(data: InsertVehicle): Promise<Vehicle> {
    const [vehicle] = await db.insert(vehicles).values(data).returning();
    return vehicle;
  }

  async getCabBookings(): Promise<(CabBooking & { vehicle: Vehicle | null })[]> {
    return await db.query.cabBookings.findMany({
      orderBy: [desc(cabBookings.createdAt)],
      with: {
        vehicle: true
      }
    });
  }

  async createCabBooking(data: InsertCabBooking): Promise<CabBooking> {
    const [booking] = await db.insert(cabBookings).values(data).returning();
    return booking;
  }

  async updateCabBooking(id: number, data: Partial<InsertCabBooking>): Promise<CabBooking | undefined> {
    const [updated] = await db.update(cabBookings).set(data).where(eq(cabBookings.id, id)).returning();
    return updated;
  }

  async getCabBooking(id: number): Promise<CabBooking | undefined> {
    return await db.query.cabBookings.findFirst({
      where: eq(cabBookings.id, id)
    });
  }

  async getCabRuns(): Promise<CabRun[]> {
    return await db.select().from(cabRuns).orderBy(desc(cabRuns.createdAt));
  }

  async createCabRun(data: InsertCabRun): Promise<CabRun> {
    const [run] = await db.insert(cabRuns).values(data).returning();
    return run;
  }

  async getVisaApplications(search?: string): Promise<VisaApplication[]> {
    if (!search) {
      return await db.select().from(visaApplications).orderBy(desc(visaApplications.createdAt));
    }
    const searchLower = `%${search.toLowerCase()}%`;
    return await db.select().from(visaApplications).where(
      or(
        ilike(visaApplications.clientName, searchLower),
        ilike(visaApplications.passportNumber, searchLower),
        ilike(visaApplications.phone, searchLower)
      )
    ).orderBy(desc(visaApplications.createdAt));
  }

  async createVisaApplication(data: InsertVisaApplication): Promise<VisaApplication> {
    const [app] = await db.insert(visaApplications).values(data).returning();
    return app;
  }

  async updateVisaApplication(id: number, data: Partial<InsertVisaApplication>): Promise<VisaApplication | undefined> {
    const [updated] = await db.update(visaApplications).set(data).where(eq(visaApplications.id, id)).returning();
    return updated;
  }

  async searchGlobal(query: string): Promise<{ visa: VisaApplication[], flights: FlightBooking[], cabs: CabBooking[] }> {
    const searchLower = `%${query.toLowerCase()}%`;
    
    const [visa, flights, cabs] = await Promise.all([
      db.select().from(visaApplications).where(
        or(
          ilike(visaApplications.clientName, searchLower),
          ilike(visaApplications.passportNumber, searchLower),
          ilike(visaApplications.phone, searchLower)
        )
      ).limit(5),
      db.select().from(flightBookings).where(
        or(
          ilike(flightBookings.clientName, searchLower),
          ilike(flightBookings.clientPhone, searchLower)
        )
      ).limit(5),
      db.select().from(cabBookings).where(
        or(
          ilike(cabBookings.clientName, searchLower),
          ilike(cabBookings.clientPhone, searchLower)
        )
      ).limit(5)
    ]);

    return { visa, flights, cabs };
  }
}

export const storage = new DatabaseStorage();
