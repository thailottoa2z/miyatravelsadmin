
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // === CASH ===
  app.get(api.cash.list.path, async (req, res) => {
    const transactions = await storage.getCashTransactions();
    res.json(transactions);
  });

  app.post(api.cash.create.path, async (req, res) => {
    try {
      const input = api.cash.create.input.parse(req.body);
      const transaction = await storage.createCashTransaction(input);
      res.status(201).json(transaction);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal Server Error" });
      }
    }
  });

  app.get(api.cash.stats.path, async (req, res) => {
    const stats = await storage.getCashStats();
    res.json(stats);
  });

  // === FLIGHTS ===
  app.get(api.flights.list.path, async (req, res) => {
    const flights = await storage.getFlightBookings();
    res.json(flights);
  });

  app.post(api.flights.create.path, async (req, res) => {
    try {
      const input = api.flights.create.input.parse(req.body);
      const flight = await storage.createFlightBooking(input);
      res.status(201).json(flight);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal Server Error" });
      }
    }
  });
  
  app.delete(api.flights.delete.path, async (req, res) => {
    await storage.deleteFlightBooking(Number(req.params.id));
    res.sendStatus(204);
  });

  // === VEHICLES ===
  app.get(api.vehicles.list.path, async (req, res) => {
    const vehicles = await storage.getVehicles();
    res.json(vehicles);
  });

  app.post(api.vehicles.create.path, async (req, res) => {
    try {
      const input = api.vehicles.create.input.parse(req.body);
      const vehicle = await storage.createVehicle(input);
      res.status(201).json(vehicle);
    } catch (err) {
       if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        // Handle duplicate car number error
        res.status(500).json({ message: "Internal Server Error or Duplicate Car Number" });
      }
    }
  });

  // === CAB BOOKINGS ===
  app.get(api.cabBookings.list.path, async (req, res) => {
    const bookings = await storage.getCabBookings();
    res.json(bookings);
  });

  app.post(api.cabBookings.create.path, async (req, res) => {
    try {
      const input = api.cabBookings.create.input.parse(req.body);
      const booking = await storage.createCabBooking(input);
      res.status(201).json(booking);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal Server Error" });
      }
    }
  });

  app.put(api.cabBookings.update.path, async (req, res) => {
    try {
      const input = api.cabBookings.update.input.parse(req.body);
      const booking = await storage.updateCabBooking(Number(req.params.id), input);
      if (!booking) return res.status(404).json({ message: "Booking not found" });
      res.json(booking);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal Server Error" });
      }
    }
  });

  // === CAB RUNS ===
  app.get(api.cabRuns.list.path, async (req, res) => {
    const runs = await storage.getCabRuns();
    res.json(runs);
  });

  app.post(api.cabRuns.create.path, async (req, res) => {
    try {
      const input = api.cabRuns.create.input.parse(req.body);
      const run = await storage.createCabRun(input);
      res.status(201).json(run);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal Server Error" });
      }
    }
  });

  // === VISA ===
  app.get(api.visa.list.path, async (req, res) => {
    const search = req.query.search as string | undefined;
    const visas = await storage.getVisaApplications(search);
    res.json(visas);
  });

  app.post(api.visa.create.path, async (req, res) => {
    try {
      const input = api.visa.create.input.parse(req.body);
      const visa = await storage.createVisaApplication(input);
      res.status(201).json(visa);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal Server Error" });
      }
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
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal Server Error" });
      }
    }
  });

  // === GLOBAL SEARCH ===
  app.get(api.globalSearch.search.path, async (req, res) => {
    const q = req.query.q as string;
    if (!q) return res.json({ visa: [], flights: [], cabs: [] });
    const results = await storage.searchGlobal(q);
    res.json(results);
  });
  
  // Seed initial data
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const transactions = await storage.getCashTransactions();
  if (transactions.length === 0) {
    // Initial Seed: 4,50,000 as requested
    await storage.createCashTransaction({
      type: 'in',
      personName: 'System',
      amount: "450000",
      reason: 'Opening Balance'
    });
    
    // Some sample data
    await storage.createVehicle({ carNumber: 'AP39WK6292' });
    await storage.createVehicle({ carNumber: 'TS08UB1234' });
    
    await storage.createFlightBooking({
      clientName: 'Rahul Sharma',
      clientPhone: '9876543210',
      sector: 'HYD-DEL',
      travelDate: '2025-03-15',
      airline: 'Indigo',
      platform: 'MakeMyTrip',
      totalAmount: "5400"
    });
    
    const v = (await storage.getVehicles())[0];
    await storage.createCabBooking({
      clientName: 'Priya Verma',
      clientPhone: '9988776655',
      travelDate: '2025-02-20',
      pickupLocation: 'Airport',
      dropLocation: 'Banjara Hills',
      vehicleId: v.id,
      totalAmount: "1500",
      advanceAmount: "500"
    });
  }
}
