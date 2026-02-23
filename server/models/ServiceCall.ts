import { mongoose } from "../mongodb";
import { Schema, Document } from "mongoose";

export interface IServiceCall extends Document {
  name: string;
  address: string;
  phoneNumber: string;
  callDate: Date;
  enquiredServiceType?: "Flight Ticket" | "Cab" | "Passport / Visa" | "Medical";
  status: "pending" | "remainder" | "completed" | "cancelled";
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const serviceCallSchema = new Schema<IServiceCall>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
      match: [/^[0-9\-\+\(\)\s]+$/, "Invalid phone number format"],
    },
    callDate: {
      type: Date,
      required: [true, "Call date is required"],
    },
    enquiredServiceType: {
      type: String,
      enum: ["Flight Ticket", "Cab", "Passport / Visa", "Medical"],
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "remainder", "completed", "cancelled"],
      default: "pending",
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for better query performance
serviceCallSchema.index({ phoneNumber: 1 });
serviceCallSchema.index({ callDate: -1 });
serviceCallSchema.index({ status: 1 });

export const ServiceCall = mongoose.model<IServiceCall>(
  "ServiceCall",
  serviceCallSchema
);
