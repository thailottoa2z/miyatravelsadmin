
import { pgTable, text, serial, integer, boolean, timestamp, numeric, date, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === ENUMS ===
export const transactionTypeEnum = pgEnum("transaction_type", ["in", "out"]);
export const medicalStatusEnum = pgEnum("medical_status", ["pending", "fit", "unfit"]);
export const processStatusEnum = pgEnum("process_status", ["locked", "pending", "completed"]);

// === TABLE DEFINITIONS ===

// 1. Agency Cash Ledger
export const cashTransactions = pgTable("cash_transactions", {
  id: serial("id").primaryKey(),
  type: transactionTypeEnum("type").notNull(), // 'in' or 'out'
  personName: text("person_name").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  reason: text("reason").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// 2. Flight Bookings
export const flightBookings = pgTable("flight_bookings", {
  id: serial("id").primaryKey(),
  clientName: text("client_name").notNull(),
  clientPhone: text("client_phone").notNull(),
  sector: text("sector").notNull(),
  travelDate: date("travel_date").notNull(),
  airline: text("airline").notNull(),
  platform: text("platform").notNull(), // Dropdown value
  platformNotes: text("platform_notes"), // If platform is 'Others'
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// 3. Vehicles
export const vehicles = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  carNumber: text("car_number").notNull().unique(), // Uppercase enforced in API/Frontend
  createdAt: timestamp("created_at").defaultNow(),
});

// 4. Cab Bookings
export const cabBookings = pgTable("cab_bookings", {
  id: serial("id").primaryKey(),
  clientName: text("client_name").notNull(),
  clientPhone: text("client_phone").notNull(),
  travelDate: date("travel_date").notNull(),
  pickupLocation: text("pickup_location").notNull(),
  dropLocation: text("drop_location").notNull(),
  vehicleId: integer("vehicle_id").references(() => vehicles.id),
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
  advanceAmount: numeric("advance_amount", { precision: 10, scale: 2 }).default("0").notNull(),
  // Pending amount is calculated: Total - Advance
  createdAt: timestamp("created_at").defaultNow(),
});

// 5. Cab Runs (Round Trip / Driver calculations)
export const cabRuns = pgTable("cab_runs", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").references(() => cabBookings.id).notNull(),
  
  // Return Trip Details
  isReturnTrip: boolean("is_return_trip").default(false),
  returnDate: date("return_date"),
  returnPassengers: integer("return_passengers"),
  returnClientName: text("return_client_name"),

  // Financials
  returnAdvance: numeric("return_advance", { precision: 10, scale: 2 }).default("0"),
  driverCollection: numeric("driver_collection", { precision: 10, scale: 2 }).default("0"),
  
  // Expenses
  expenseDiesel: numeric("expense_diesel", { precision: 10, scale: 2 }).default("0"),
  expenseToll: numeric("expense_toll", { precision: 10, scale: 2 }).default("0"),
  expenseParking: numeric("expense_parking", { precision: 10, scale: 2 }).default("0"),
  expenseOthers: numeric("expense_others", { precision: 10, scale: 2 }).default("0"),
  driverSalary: numeric("driver_salary", { precision: 10, scale: 2 }).default("0"),

  createdAt: timestamp("created_at").defaultNow(),
});

// 6. Work Visa & Assets
export const visaApplications = pgTable("visa_applications", {
  id: serial("id").primaryKey(),
  clientName: text("client_name").notNull(),
  passportNumber: text("passport_number").notNull(),
  phone: text("phone").notNull(),
  visaType: text("visa_type").notNull(),
  
  // Workflow Status
  medicalStatus: medicalStatusEnum("medical_status").default("pending").notNull(),
  pccStatus: processStatusEnum("pcc_status").default("locked").notNull(),
  stampingStatus: processStatusEnum("stamping_status").default("locked").notNull(),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// === RELATIONS ===
export const cabBookingsRelations = relations(cabBookings, ({ one, many }) => ({
  vehicle: one(vehicles, {
    fields: [cabBookings.vehicleId],
    references: [vehicles.id],
  }),
  runs: many(cabRuns),
}));

export const cabRunsRelations = relations(cabRuns, ({ one }) => ({
  booking: one(cabBookings, {
    fields: [cabRuns.bookingId],
    references: [cabBookings.id],
  }),
}));

// === INSERTS ===
export const insertCashTransactionSchema = createInsertSchema(cashTransactions).omit({ id: true, createdAt: true });
export const insertFlightBookingSchema = createInsertSchema(flightBookings).omit({ id: true, createdAt: true });
export const insertVehicleSchema = createInsertSchema(vehicles).omit({ id: true, createdAt: true });
export const insertCabBookingSchema = createInsertSchema(cabBookings).omit({ id: true, createdAt: true });
export const insertCabRunSchema = createInsertSchema(cabRuns).omit({ id: true, createdAt: true });
export const insertVisaApplicationSchema = createInsertSchema(visaApplications).omit({ id: true, createdAt: true });

// === EXPLICIT TYPES ===
export type CashTransaction = typeof cashTransactions.$inferSelect;
export type InsertCashTransaction = z.infer<typeof insertCashTransactionSchema>;

export type FlightBooking = typeof flightBookings.$inferSelect;
export type InsertFlightBooking = z.infer<typeof insertFlightBookingSchema>;

export type Vehicle = typeof vehicles.$inferSelect;
export type InsertVehicle = z.infer<typeof insertVehicleSchema>;

export type CabBooking = typeof cabBookings.$inferSelect;
export type InsertCabBooking = z.infer<typeof insertCabBookingSchema>;

export type CabRun = typeof cabRuns.$inferSelect;
export type InsertCabRun = z.infer<typeof insertCabRunSchema>;

export type VisaApplication = typeof visaApplications.$inferSelect;
export type InsertVisaApplication = z.infer<typeof insertVisaApplicationSchema>;

// Derived Types for responses
export type CabBookingWithVehicle = CabBooking & { vehicle: Vehicle | null };
