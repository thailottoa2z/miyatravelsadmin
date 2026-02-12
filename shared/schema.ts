
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
  paymentMode: text("payment_mode").default("Cash"), // Cash, Credit/Pay Later, etc.
  vendorId: integer("vendor_id"), // References vendors table
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
  paymentMode: text("payment_mode").default("Cash"),
  vendorId: integer("vendor_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// 5. Cab Runs (Round Trip / Driver calculations)
export const cabRuns = pgTable("cab_runs", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").references(() => cabBookings.id),
  clientName: text("client_name"),
  advanceAmount: numeric("advance_amount", { precision: 10, scale: 2 }).default("0"),
  
  // Trip Details
  startKm: integer("start_km"),
  closingKm: integer("closing_km"),
  
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
  
  paymentMode: text("payment_mode").default("Cash"),
  vendorId: integer("vendor_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// 7. Credit Cards
export const creditCards = pgTable("credit_cards", {
  id: serial("id").primaryKey(),
  cardName: text("card_name").notNull(),
  bankName: text("bank_name").notNull(),
  totalLimit: numeric("total_limit", { precision: 10, scale: 2 }).notNull(),
  usedAmount: numeric("used_amount", { precision: 10, scale: 2 }).default("0").notNull(),
  nextBillDate: date("next_bill_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// 8. Vendors
export const vendors = pgTable("vendors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  totalOwed: numeric("total_owed", { precision: 10, scale: 2 }).default("0").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// 9. Attestation Services
export const attestationServices = pgTable("attestation_services", {
  id: serial("id").primaryKey(),
  clientName: text("client_name").notNull(),
  phone: text("phone").notNull(),
  referenceName: text("reference_name"),
  referencePhone: text("reference_phone"),
  documentType: text("document_type").notNull(),
  targetCountry: text("target_country").notNull(),
  serviceCharge: numeric("service_charge", { precision: 10, scale: 2 }).notNull(),
  ourCost: numeric("our_cost", { precision: 10, scale: 2 }).default("0").notNull(),
  advanceReceived: numeric("advance_received", { precision: 10, scale: 2 }).default("0").notNull(),
  paymentMode: text("payment_mode").default("Cash"),
  vendorId: integer("vendor_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// 10. Vendor Payments
export const vendorPayments = pgTable("vendor_payments", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id").references(() => vendors.id).notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  paymentDate: date("payment_date").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// === RELATIONS ===
export const cabBookingsRelations = relations(cabBookings, ({ one, many }) => ({
  vehicle: one(vehicles, {
    fields: [cabBookings.vehicleId],
    references: [vehicles.id],
  }),
  runs: many(cabRuns),
  vendor: one(vendors, {
    fields: [cabBookings.vendorId],
    references: [vendors.id],
  }),
}));

export const flightBookingsRelations = relations(flightBookings, ({ one }) => ({
  vendor: one(vendors, {
    fields: [flightBookings.vendorId],
    references: [vendors.id],
  }),
}));

export const visaApplicationsRelations = relations(visaApplications, ({ one }) => ({
  vendor: one(vendors, {
    fields: [visaApplications.vendorId],
    references: [vendors.id],
  }),
}));

export const cabRunsRelations = relations(cabRuns, ({ one }) => ({
  booking: one(cabBookings, {
    fields: [cabRuns.bookingId],
    references: [cabBookings.id],
  }),
}));

export const vendorsRelations = relations(vendors, ({ many }) => ({
  payments: many(vendorPayments),
}));

export const attestationServicesRelations = relations(attestationServices, ({ one }) => ({
  vendor: one(vendors, {
    fields: [attestationServices.vendorId],
    references: [vendors.id],
  }),
}));

// === INSERTS ===
export const insertCashTransactionSchema = createInsertSchema(cashTransactions).omit({ id: true, createdAt: true });
export const insertFlightBookingSchema = createInsertSchema(flightBookings).omit({ id: true, createdAt: true });
export const insertVehicleSchema = createInsertSchema(vehicles).omit({ id: true, createdAt: true });
export const insertCabBookingSchema = createInsertSchema(cabBookings).omit({ id: true, createdAt: true });
export const insertCabRunSchema = createInsertSchema(cabRuns).omit({ id: true, createdAt: true });
export const insertVisaApplicationSchema = createInsertSchema(visaApplications).omit({ id: true, createdAt: true });
export const insertCreditCardSchema = createInsertSchema(creditCards).omit({ id: true, createdAt: true });
export const insertVendorSchema = createInsertSchema(vendors).omit({ id: true, createdAt: true });
export const insertVendorPaymentSchema = createInsertSchema(vendorPayments).omit({ id: true, createdAt: true });
export const insertAttestationServiceSchema = createInsertSchema(attestationServices).omit({ id: true, createdAt: true });

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
export type CreditCard = typeof creditCards.$inferSelect;
export type InsertCreditCard = z.infer<typeof insertCreditCardSchema>;
export type Vendor = typeof vendors.$inferSelect;
export type InsertVendor = z.infer<typeof insertVendorSchema>;
export type VendorPayment = typeof vendorPayments.$inferSelect;
export type InsertVendorPayment = z.infer<typeof insertVendorPaymentSchema>;
export type AttestationService = typeof attestationServices.$inferSelect;
export type InsertAttestationService = z.infer<typeof insertAttestationServiceSchema>;

export type CabBookingWithVehicle = CabBooking & { vehicle: Vehicle | null; vendor: Vendor | null };
