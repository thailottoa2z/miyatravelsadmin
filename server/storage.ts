
import { 
  cashTransactions, flightBookings, vehicles, cabBookings, cabRuns, visaApplications,
  creditCards, vendors, vendorPayments, attestationServices, serviceCalls,
  type InsertCashTransaction, type InsertFlightBooking, type InsertVehicle, type InsertCabBooking, type InsertCabRun, type InsertVisaApplication,
  type InsertCreditCard, type InsertVendor, type InsertVendorPayment, type InsertAttestationService, type InsertServiceCall,
  type CashTransaction, type FlightBooking, type Vehicle, type CabBooking, type CabRun, type VisaApplication,
  type CreditCard, type Vendor, type VendorPayment, type AttestationService, type ServiceCall
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
  updateFlightBooking(id: number, data: Partial<InsertFlightBooking>): Promise<FlightBooking | undefined>;
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
  updateCabRun(id: number, data: Partial<InsertCabRun>): Promise<CabRun | undefined>;
  
  // Visa
  getVisaApplications(search?: string): Promise<VisaApplication[]>;
  createVisaApplication(data: InsertVisaApplication): Promise<VisaApplication>;
  updateVisaApplication(id: number, data: Partial<InsertVisaApplication>): Promise<VisaApplication | undefined>;

  // Credit Cards
  getCreditCards(): Promise<CreditCard[]>;
  createCreditCard(data: InsertCreditCard): Promise<CreditCard>;
  updateCreditCard(id: number, data: Partial<InsertCreditCard>): Promise<CreditCard | undefined>;
  repayCreditCard(id: number, amount: number): Promise<CreditCard | undefined>;

  // Vendors
  getVendors(): Promise<Vendor[]>;
  createVendor(data: InsertVendor): Promise<Vendor>;
  updateVendor(id: number, data: Partial<InsertVendor>): Promise<Vendor | undefined>;
  recordVendorPayment(data: InsertVendorPayment): Promise<VendorPayment>;
  updateVendorBalance(id: number, amount: number): Promise<void>;
  
  // Attestation Services
  getAttestationServices(): Promise<AttestationService[]>;
  createAttestationService(data: InsertAttestationService): Promise<AttestationService>;
  updateAttestationService(id: number, data: Partial<InsertAttestationService>): Promise<AttestationService | undefined>;
  deleteAttestationService(id: number): Promise<void>;

  // Service Calls
  getServiceCalls(status?: string): Promise<ServiceCall[]>;
  getServiceCall(id: number): Promise<ServiceCall | undefined>;
  createServiceCall(data: InsertServiceCall): Promise<ServiceCall>;
  updateServiceCall(id: number, data: Partial<InsertServiceCall>): Promise<ServiceCall | undefined>;
  deleteServiceCall(id: number): Promise<void>;
  getServiceCallStats(): Promise<{ total: number; pending: number; remainder: number; completed: number; cancelled: number }>;

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
    if (data.paymentMode === 'Credit/Pay Later' && data.vendorId) {
      await this.updateVendorBalance(data.vendorId, Number(data.totalAmount));
    }
    return booking;
  }

  async updateFlightBooking(id: number, data: Partial<InsertFlightBooking>): Promise<FlightBooking | undefined> {
    const [updated] = await db.update(flightBookings).set(data).where(eq(flightBookings.id, id)).returning();
    return updated;
  }

  async deleteFlightBooking(id: number): Promise<void> {
    await db.delete(flightBookings).where(eq(flightBookings.id, id));
  }

  async getVehicles(): Promise<Vehicle[]> {
    return await db.select().from(vehicles);
  }

  async createVehicle(data: InsertVehicle): Promise<Vehicle> {
    const [vehicle] = await db.insert(vehicles).values({ ...data, carNumber: data.carNumber.toUpperCase() }).returning();
    return vehicle;
  }

  async getCabBookings(): Promise<(CabBooking & { vehicle: Vehicle | null })[]> {
    return await db.query.cabBookings.findMany({
      orderBy: [desc(cabBookings.createdAt)],
      with: { vehicle: true }
    });
  }

  async createCabBooking(data: InsertCabBooking): Promise<CabBooking> {
    const [booking] = await db.insert(cabBookings).values(data).returning();
    if (data.paymentMode === 'Credit/Pay Later' && data.vendorId) {
      await this.updateVendorBalance(data.vendorId, Number(data.totalAmount));
    }
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

  async updateCabRun(id: number, data: Partial<InsertCabRun>): Promise<CabRun | undefined> {
    const [updated] = await db.update(cabRuns).set(data).where(eq(cabRuns.id, id)).returning();
    return updated;
  }

  async getVisaApplications(search?: string): Promise<VisaApplication[]> {
    if (!search) return await db.select().from(visaApplications).orderBy(desc(visaApplications.createdAt));
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
    if (data.paymentMode === 'Credit/Pay Later' && data.vendorId) {
      // Need a price for visa apps if we're tracking owed, let's assume totalAmount is 0 for now or handled elsewhere
    }
    return app;
  }

  async updateVisaApplication(id: number, data: Partial<InsertVisaApplication>): Promise<VisaApplication | undefined> {
    const [updated] = await db.update(visaApplications).set(data).where(eq(visaApplications.id, id)).returning();
    return updated;
  }

  async getCreditCards(): Promise<CreditCard[]> {
    return await db.select().from(creditCards).orderBy(desc(creditCards.createdAt));
  }

  async createCreditCard(data: InsertCreditCard): Promise<CreditCard> {
    const [card] = await db.insert(creditCards).values(data).returning();
    return card;
  }

  async updateCreditCard(id: number, data: Partial<InsertCreditCard>): Promise<CreditCard | undefined> {
    const [updated] = await db.update(creditCards).set(data).where(eq(creditCards.id, id)).returning();
    return updated;
  }

  async repayCreditCard(id: number, amount: number): Promise<CreditCard | undefined> {
    const [card] = await db.select().from(creditCards).where(eq(creditCards.id, id));
    if (!card) return undefined;
    const newUsed = Math.max(0, Number(card.usedAmount) - amount);
    const [updated] = await db.update(creditCards).set({ usedAmount: newUsed.toString() }).where(eq(creditCards.id, id)).returning();
    return updated;
  }

  async getVendors(): Promise<Vendor[]> {
    return await db.select().from(vendors).orderBy(desc(vendors.createdAt));
  }

  async createVendor(data: InsertVendor): Promise<Vendor> {
    const [vendor] = await db.insert(vendors).values(data).returning();
    return vendor;
  }

  async updateVendor(id: number, data: Partial<InsertVendor>): Promise<Vendor | undefined> {
    const [updated] = await db.update(vendors).set(data).where(eq(vendors.id, id)).returning();
    return updated;
  }

  async recordVendorPayment(data: InsertVendorPayment): Promise<VendorPayment> {
    const [payment] = await db.insert(vendorPayments).values(data).returning();
    await this.updateVendorBalance(data.vendorId, -Number(data.amount));
    return payment;
  }

  async updateVendorBalance(id: number, amount: number): Promise<void> {
    const [vendor] = await db.select().from(vendors).where(eq(vendors.id, id));
    if (vendor) {
      const newOwed = Number(vendor.totalOwed) + amount;
      await db.update(vendors).set({ totalOwed: newOwed.toString() }).where(eq(vendors.id, id));
    }
  }

  async getAttestationServices(): Promise<AttestationService[]> {
    return await db.select().from(attestationServices).orderBy(desc(attestationServices.createdAt));
  }

  async createAttestationService(data: InsertAttestationService): Promise<AttestationService> {
    const [service] = await db.insert(attestationServices).values(data).returning();
    if (data.paymentMode === 'Credit/Pay Later' && data.vendorId) {
      await this.updateVendorBalance(data.vendorId, Number(data.serviceCharge));
    }
    return service;
  }

  async updateAttestationService(id: number, data: Partial<InsertAttestationService>): Promise<AttestationService | undefined> {
    const [updated] = await db.update(attestationServices).set(data).where(eq(attestationServices.id, id)).returning();
    return updated;
  }

  async deleteAttestationService(id: number): Promise<void> {
    await db.delete(attestationServices).where(eq(attestationServices.id, id));
  }

  async getServiceCalls(status?: string): Promise<ServiceCall[]> {
    if (status && status !== "all") {
      return await db.select().from(serviceCalls).where(eq(serviceCalls.status, status)).orderBy(desc(serviceCalls.createdAt));
    }
    return await db.select().from(serviceCalls).orderBy(desc(serviceCalls.createdAt));
  }

  async getServiceCall(id: number): Promise<ServiceCall | undefined> {
    const [call] = await db.select().from(serviceCalls).where(eq(serviceCalls.id, id));
    return call;
  }

  async createServiceCall(data: InsertServiceCall): Promise<ServiceCall> {
    const [call] = await db.insert(serviceCalls).values(data).returning();
    return call;
  }

  async updateServiceCall(id: number, data: Partial<InsertServiceCall>): Promise<ServiceCall | undefined> {
    const [updated] = await db.update(serviceCalls).set({ ...data, updatedAt: new Date() }).where(eq(serviceCalls.id, id)).returning();
    return updated;
  }

  async deleteServiceCall(id: number): Promise<void> {
    await db.delete(serviceCalls).where(eq(serviceCalls.id, id));
  }

  async getServiceCallStats(): Promise<{ total: number; pending: number; remainder: number; completed: number; cancelled: number }> {
    console.log("\n=== STATS CALCULATION START ===");
    
    let calls = await db.select().from(serviceCalls);
    
    console.log("Step 1: Fetched", calls.length, "records from DB");
    calls.forEach(call => {
      console.log(`  - ID: ${call.id}, Status: '${call.status}', Date: ${call.callDate}`);
    });
    
    // Helper functions
    const getDateString = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    const normalizeDateString = (date: any): string => {
      if (typeof date === 'string') {
        return date.split('T')[0];
      }
      if (date instanceof Date) {
        return getDateString(date);
      }
      return date.toString().split('T')[0];
    };
    
    const today = getDateString(new Date());
    console.log("Step 2: Today's date:", today);
    
    // Auto-update pending records with today's date
    let updatedCount = 0;
    for (const call of calls) {
      const callDateStr = normalizeDateString(call.callDate);
      if (callDateStr === today && call.status === "pending") {
        console.log(`  Auto-updating ID ${call.id} from pending to remainder`);
        await this.updateServiceCall(call.id, { status: "remainder" });
        updatedCount++;
      }
    }
    console.log(`Step 3: Auto-updated ${updatedCount} records`);
    
    // RE-FETCH from database to get the updated values
    calls = await db.select().from(serviceCalls);
    
    console.log("Step 4: Re-fetched", calls.length, "records after updates");
    calls.forEach(call => {
      console.log(`  - ID: ${call.id}, Status: '${call.status}'`);
    });
    
    // Calculate stats
    const stats = {
      total: calls.length,
      pending: calls.filter(c => c.status === "pending").length,
      remainder: calls.filter(c => c.status === "remainder").length,
      completed: calls.filter(c => c.status === "completed").length,
      cancelled: calls.filter(c => c.status === "cancelled").length,
    };
    
    console.log("Step 5: Final stats:", JSON.stringify(stats));
    console.log("=== STATS CALCULATION END ===\n");
    
    return stats;
  }

  async searchGlobal(query: string): Promise<{ visa: VisaApplication[], flights: FlightBooking[], cabs: CabBooking[] }> {
    const searchLower = `%${query.toLowerCase()}%`;
    const [visa, flights, cabs] = await Promise.all([
      db.select().from(visaApplications).where(or(ilike(visaApplications.clientName, searchLower), ilike(visaApplications.passportNumber, searchLower), ilike(visaApplications.phone, searchLower))).limit(5),
      db.select().from(flightBookings).where(or(ilike(flightBookings.clientName, searchLower), ilike(flightBookings.clientPhone, searchLower))).limit(5),
      db.select().from(cabBookings).where(or(ilike(cabBookings.clientName, searchLower), ilike(cabBookings.clientPhone, searchLower))).limit(5)
    ]);
    return { visa, flights, cabs };
  }
}

export const storage = new DatabaseStorage();
