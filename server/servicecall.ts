import { Request, Response } from "express";
import { storage } from "./storage";

/**
 * Helper function to get date in YYYY-MM-DD format
 */
function getDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Helper function to normalize date to YYYY-MM-DD format
 */
function normalizeDateString(date: any): string {
  if (typeof date === 'string') {
    return date.split('T')[0]; // Remove time portion if present
  }
  if (date instanceof Date) {
    return getDateString(date);
  }
  return date.toString().split('T')[0];
}

/**
 * Helper function to auto-update status based on service date
 */
function getAutoUpdatedStatus(callDate: string, currentStatus: string): string {
  const today = getDateString(new Date());
  const normalizedDate = normalizeDateString(callDate);
  
  // If service date is today and status is pending, auto-update to remainder
  if (normalizedDate === today && currentStatus === "pending") {
    return "remainder";
  }
  
  return currentStatus;
}

/**
 * Get all service calls
 */
export async function getServiceCalls(req: Request, res: Response) {
  try {
    const { status } = req.query;

    let calls = await storage.getServiceCalls();
    
    // Auto-update status for records where callDate is today
    const today = getDateString(new Date());
    calls = await Promise.all(
      calls.map(async (call: any) => {
        const callDateStr = normalizeDateString(call.callDate);
        
        // If date is today and status is pending, auto-update to remainder
        if (callDateStr === today && call.status === "pending") {
          return await storage.updateServiceCall(call.id, { status: "remainder" });
        }
        return call;
      })
    );
    
    if (status && status !== "all") {
      calls = calls.filter((call: any) => call.status === status);
    }

    res.status(200).json(calls);
  } catch (error) {
    console.error("Error fetching service calls:", error);
    res.status(500).json({
      message: "Failed to fetch service calls",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Get single service call
 */
export async function getServiceCall(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const call = await storage.getServiceCall(Number(id));
    if (!call) {
      return res.status(404).json({
        message: "Service call not found",
      });
    }

    res.status(200).json(call);
  } catch (error) {
    console.error("Error fetching service call:", error);
    res.status(500).json({
      message: "Failed to fetch service call",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Create service call
 */
export async function createServiceCall(req: Request, res: Response) {
  try {
    const { name, address, phoneNumber, callDate, notes, status, enquiredServiceType } = req.body;
    
    console.log("Creating Service Call with data:", {
      name,
      address,
      phoneNumber,
      callDate,
      enquiredServiceType,
      notes,
      status,
    });

    // Validation
    if (!name || !address || !phoneNumber || !callDate) {
      return res.status(400).json({
        message: "Name, address, phone number, and call date are required",
      });
    }

    // Auto-update status based on date
    const finalStatus = getAutoUpdatedStatus(callDate, status || "pending");

    const processedType = enquiredServiceType && enquiredServiceType.trim() ? enquiredServiceType : null;
    console.log("Processed enquiredServiceType:", processedType);

    const call = await storage.createServiceCall({
      name,
      address,
      phoneNumber,
      callDate,
      enquiredServiceType: processedType,
      notes: notes || "",
      status: finalStatus,
    } as any);

    console.log("Service Call Created:", call);
    res.status(201).json(call);
  } catch (error) {
    console.error("Error creating service call:", error);

    res.status(500).json({
      message: "Failed to create service call",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Update service call
 */
export async function updateServiceCall(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { name, address, phoneNumber, callDate, status, notes, enquiredServiceType } = req.body;

    console.log("Updating Service Call (ID:", id, ") with data:", {
      name,
      address,
      phoneNumber,
      callDate,
      enquiredServiceType,
      notes,
      status,
    });

    const updateData: Record<string, any> = {};

    if (name !== undefined) updateData.name = name;
    if (address !== undefined) updateData.address = address;
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
    if (callDate !== undefined) updateData.callDate = callDate;
    if (enquiredServiceType !== undefined) {
      const processedType = enquiredServiceType && enquiredServiceType.trim() ? enquiredServiceType : null;
      console.log("Processed enquiredServiceType for update:", processedType);
      updateData.enquiredServiceType = processedType;
    }
    if (notes !== undefined) updateData.notes = notes;
    
    // Auto-update status based on date
    if (status !== undefined || callDate !== undefined) {
      const currentCall = await storage.getServiceCall(Number(id));
      if (currentCall) {
        const dateToCheck = callDate || normalizeDateString(currentCall.callDate);
        const statusToCheck = status || currentCall.status;
        const finalStatus = getAutoUpdatedStatus(dateToCheck, statusToCheck);
        updateData.status = finalStatus;
      }
    }

    const call = await storage.updateServiceCall(Number(id), updateData as any);

    console.log("Service Call Updated:", call);

    if (!call) {
      return res.status(404).json({
        message: "Service call not found",
      });
    }

    res.status(200).json(call);
  } catch (error) {
    console.error("Error updating service call:", error);
    res.status(500).json({
      message: "Failed to update service call",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Delete service call
 */
export async function deleteServiceCall(req: Request, res: Response) {
  try {
    const { id } = req.params;

    await storage.deleteServiceCall(Number(id));

    res.status(200).json({
      message: "Service call deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting service call:", error);
    res.status(500).json({
      message: "Failed to delete service call",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Get service call statistics
 */
export async function getServiceCallStats(req: Request, res: Response) {
  try {
    const stats = await storage.getServiceCallStats();
    console.log("Stats API Response:", JSON.stringify(stats));
    res.status(200).json(stats);
  } catch (error) {
    console.error("Error fetching service call stats:", error);
    res.status(500).json({
      message: "Failed to fetch service call statistics",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
