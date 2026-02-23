
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import cookieParser from "cookie-parser";
import {
  handleLogin,
  handleLogout,
  authMiddleware,
  requireAuth,
  handleGetSession,
} from "./auth";
import {
  getServiceCalls,
  getServiceCall,
  createServiceCall,
  updateServiceCall,
  deleteServiceCall,
  getServiceCallStats,
} from "./servicecall";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Middleware
  app.use(cookieParser());
  app.use(authMiddleware);

  // === AUTHENTICATION ===
  app.post("/api/auth/login", handleLogin);
  app.post("/api/auth/logout", handleLogout);
  app.get("/api/auth/session", handleGetSession);

  // === SERVICE CALLS ===
  app.get("/api/servicecalls", requireAuth, getServiceCalls);
  app.get("/api/servicecalls/:id", requireAuth, getServiceCall);
  app.post("/api/servicecalls", requireAuth, createServiceCall);
  app.put("/api/servicecalls/:id", requireAuth, updateServiceCall);
  app.delete("/api/servicecalls/:id", requireAuth, deleteServiceCall);
  app.get("/api/servicecalls/stats/all", requireAuth, getServiceCallStats);

  // === CASH ===
  app.get(api.cash.list.path, requireAuth, async (req, res) => {
    const transactions = await storage.getCashTransactions();
    res.json(transactions);
  });

  app.post(api.cash.create.path, requireAuth, async (req, res) => {
    try {
      const input = api.cash.create.input.parse(req.body);
      const transaction = await storage.createCashTransaction(input);
      res.status(201).json(transaction);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.get(api.cash.stats.path, requireAuth, async (req, res) => {
    const stats = await storage.getCashStats();
    res.json(stats);
  });

  // === FLIGHTS ===
  app.get(api.flights.list.path, requireAuth, async (req, res) => {
    const flights = await storage.getFlightBookings();
    res.json(flights);
  });

  app.post(api.flights.create.path, requireAuth, async (req, res) => {
    try {
      if (req.body.reminderDate === "") req.body.reminderDate = null;
      if (req.body.reminderNote === "") req.body.reminderNote = null;
      if (req.body.referenceName === "") req.body.referenceName = null;
      if (req.body.referencePhone === "") req.body.referencePhone = null;
      if (req.body.platformNotes === "") req.body.platformNotes = null;
      const input = api.flights.create.input.parse(req.body);
      const flight = await storage.createFlightBooking(input);
      res.status(201).json(flight);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.put(api.flights.update.path, requireAuth, async (req, res) => {
    try {
      if (req.body.reminderDate === "") req.body.reminderDate = null;
      if (req.body.reminderNote === "") req.body.reminderNote = null;
      if (req.body.referenceName === "") req.body.referenceName = null;
      if (req.body.referencePhone === "") req.body.referencePhone = null;
      if (req.body.platformNotes === "") req.body.platformNotes = null;
      const input = api.flights.update.input.parse(req.body);
      const flight = await storage.updateFlightBooking(Number(req.params.id), input);
      if (!flight) return res.status(404).json({ message: "Flight booking not found" });
      res.json(flight);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.delete(api.flights.delete.path, requireAuth, async (req, res) => {
    await storage.deleteFlightBooking(Number(req.params.id));
    res.sendStatus(204);
  });

  // === VEHICLES ===
  app.get(api.vehicles.list.path, requireAuth, async (req, res) => {
    const v = await storage.getVehicles();
    res.json(v);
  });

  app.post(api.vehicles.create.path, requireAuth, async (req, res) => {
    try {
      const input = api.vehicles.create.input.parse(req.body);
      const vehicle = await storage.createVehicle(input);
      res.status(201).json(vehicle);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(400).json({ message: "Duplicate car number or invalid data" });
    }
  });

  // === CAB BOOKINGS ===
  app.get(api.cabBookings.list.path, requireAuth, async (req, res) => {
    const bookings = await storage.getCabBookings();
    res.json(bookings);
  });

  app.post(api.cabBookings.create.path, requireAuth, async (req, res) => {
    try {
      if (req.body.reminderDate === "") req.body.reminderDate = null;
      if (req.body.reminderNote === "") req.body.reminderNote = null;
      if (req.body.referenceName === "") req.body.referenceName = null;
      if (req.body.referencePhone === "") req.body.referencePhone = null;
      const input = api.cabBookings.create.input.parse(req.body);
      const booking = await storage.createCabBooking(input);
      res.status(201).json(booking);
    } catch (err) {
      console.error("Cab booking create error:", err);
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.put(api.cabBookings.update.path, requireAuth, async (req, res) => {
    try {
      if (req.body.reminderDate === "") req.body.reminderDate = null;
      if (req.body.reminderNote === "") req.body.reminderNote = null;
      if (req.body.referenceName === "") req.body.referenceName = null;
      if (req.body.referencePhone === "") req.body.referencePhone = null;
      const input = api.cabBookings.update.input.parse(req.body);
      const booking = await storage.updateCabBooking(Number(req.params.id), input);
      if (!booking) return res.status(404).json({ message: "Booking not found" });
      res.json(booking);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // === CAB RUNS ===
  app.get(api.cabRuns.list.path, requireAuth, async (req, res) => {
    const runs = await storage.getCabRuns();
    res.json(runs);
  });

  app.post(api.cabRuns.create.path, requireAuth, async (req, res) => {
    try {
      const input = api.cabRuns.create.input.parse(req.body);
      const run = await storage.createCabRun(input);
      res.status(201).json(run);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.put(api.cabRuns.update.path, requireAuth, async (req, res) => {
    try {
      const input = api.cabRuns.update.input.parse(req.body);
      const run = await storage.updateCabRun(Number(req.params.id), input);
      if (!run) return res.status(404).json({ message: "Cab run not found" });
      res.json(run);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // === VISA ===
  app.get(api.visa.list.path, requireAuth, async (req, res) => {
    const search = req.query.search as string | undefined;
    const visas = await storage.getVisaApplications(search);
    res.json(visas);
  });

  app.post(api.visa.create.path, requireAuth, async (req, res) => {
    try {
      const input = api.visa.create.input.parse(req.body);
      const visa = await storage.createVisaApplication(input);
      res.status(201).json(visa);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.put(api.visa.update.path, requireAuth, async (req, res) => {
    try {
      const input = api.visa.update.input.parse(req.body);
      const visa = await storage.updateVisaApplication(Number(req.params.id), input);
      if (!visa) return res.status(404).json({ message: "Visa application not found" });
      res.json(visa);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.patch(api.visa.updateStatus.path, async (req, res) => {
    try {
      const input = api.visa.updateStatus.input.parse(req.body);
      const visa = await storage.updateVisaApplication(Number(req.params.id), input);
      if (!visa) return res.status(404).json({ message: "Visa application not found" });
      res.json(visa);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // === CREDIT CARDS ===
  app.get(api.creditCards.list.path, requireAuth, async (req, res) => {
    const cards = await storage.getCreditCards();
    res.json(cards);
  });

  app.post(api.creditCards.create.path, requireAuth, async (req, res) => {
    try {
      const input = api.creditCards.create.input.parse(req.body);
      const card = await storage.createCreditCard(input);
      res.status(201).json(card);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.put(api.creditCards.update.path, requireAuth, async (req, res) => {
    try {
      const input = api.creditCards.update.input.parse(req.body);
      const card = await storage.updateCreditCard(Number(req.params.id), input);
      if (!card) return res.status(404).json({ message: "Credit card not found" });
      res.json(card);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.post(api.creditCards.repay.path, requireAuth, async (req, res) => {
    try {
      const { amount } = api.creditCards.repay.input.parse(req.body);
      const card = await storage.repayCreditCard(Number(req.params.id), amount);
      if (!card) return res.status(404).json({ message: "Credit card not found" });
      res.json(card);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // === VENDORS ===
  app.get(api.vendors.list.path, requireAuth, async (req, res) => {
    const v = await storage.getVendors();
    res.json(v);
  });

  app.post(api.vendors.create.path, requireAuth, async (req, res) => {
    try {
      const input = api.vendors.create.input.parse(req.body);
      const vendor = await storage.createVendor(input);
      res.status(201).json(vendor);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(400).json({ message: "Duplicate vendor name or invalid data" });
    }
  });

  app.put(api.vendors.update.path, requireAuth, async (req, res) => {
    try {
      const input = api.vendors.update.input.parse(req.body);
      const vendor = await storage.updateVendor(Number(req.params.id), input);
      if (!vendor) return res.status(404).json({ message: "Vendor not found" });
      res.json(vendor);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.post(api.vendors.recordPayment.path, requireAuth, async (req, res) => {
    try {
      const input = api.vendors.recordPayment.input.parse(req.body);
      const payment = await storage.recordVendorPayment({
        ...input,
        vendorId: Number(req.params.id),
      });
      res.status(201).json(payment);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // === ATTESTATION SERVICES ===
  app.get(api.attestation.list.path, requireAuth, async (req, res) => {
    const services = await storage.getAttestationServices();
    res.json(services);
  });

  app.post(api.attestation.create.path, requireAuth, async (req, res) => {
    try {
      const input = api.attestation.create.input.parse(req.body);
      const service = await storage.createAttestationService(input);
      if (input.paymentMode === 'Cash' && Number(input.advanceReceived || 0) > 0) {
        await storage.createCashTransaction({
          type: 'in',
          personName: input.clientName,
          amount: String(input.advanceReceived || "0"),
          reason: `Attestation Advance - ${input.documentType} (${input.targetCountry})`,
        });
      }
      res.status(201).json(service);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.put(api.attestation.update.path, requireAuth, async (req, res) => {
    try {
      if (req.body.referenceName === "") req.body.referenceName = null;
      if (req.body.referencePhone === "") req.body.referencePhone = null;
      const input = api.attestation.update.input.parse(req.body);
      const service = await storage.updateAttestationService(Number(req.params.id), input);
      if (!service) return res.status(404).json({ message: "Attestation service not found" });
      res.json(service);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.delete(api.attestation.delete.path, requireAuth, async (req, res) => {
    await storage.deleteAttestationService(Number(req.params.id));
    res.sendStatus(204);
  });

  // === GLOBAL SEARCH ===
  app.get(api.globalSearch.search.path, requireAuth, async (req, res) => {
    const q = req.query.q as string;
    if (!q) return res.json({ visa: [], flights: [], cabs: [] });
    const results = await storage.searchGlobal(q);
    res.json(results);
  });

  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const transactions = await storage.getCashTransactions();
  if (transactions.length === 0) {
    await storage.createCashTransaction({ type: 'in', personName: 'System', amount: "450000", reason: 'Opening Balance' });
    await storage.createVehicle({ carNumber: 'AP39WK6292' });
    await storage.createVehicle({ carNumber: 'TS08UB1234' });
    await storage.createFlightBooking({ clientName: 'Rahul Sharma', clientPhone: '9876543210', sector: 'HYD-DEL', travelDate: '2025-03-15', airline: 'Indigo', platform: 'MakeMyTrip', totalAmount: "5400" });
    const v = (await storage.getVehicles())[0];
    await storage.createCabBooking({ clientName: 'Priya Verma', clientPhone: '9988776655', travelDate: '2025-02-20', pickupLocation: 'Airport', dropLocation: 'Banjara Hills', vehicleId: v.id, totalAmount: "1500", advanceAmount: "500" });
    await storage.createVendor({ name: 'RiyaB2B' });
    await storage.createVendor({ name: 'TravelPort' });
  }
}
