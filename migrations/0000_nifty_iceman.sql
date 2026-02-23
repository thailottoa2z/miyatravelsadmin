CREATE TYPE "public"."enquired_service_type" AS ENUM('Flight Ticket', 'Cab', 'Passport / Visa', 'Medical');--> statement-breakpoint
CREATE TYPE "public"."medical_status" AS ENUM('pending', 'fit', 'unfit');--> statement-breakpoint
CREATE TYPE "public"."process_status" AS ENUM('locked', 'pending', 'completed');--> statement-breakpoint
CREATE TYPE "public"."transaction_type" AS ENUM('in', 'out');--> statement-breakpoint
CREATE TABLE "attestation_services" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_name" text NOT NULL,
	"phone" text NOT NULL,
	"reference_name" text,
	"reference_phone" text,
	"document_type" text NOT NULL,
	"target_country" text NOT NULL,
	"service_charge" numeric(10, 2) NOT NULL,
	"our_cost" numeric(10, 2) DEFAULT '0' NOT NULL,
	"advance_received" numeric(10, 2) DEFAULT '0' NOT NULL,
	"payment_mode" text DEFAULT 'Cash',
	"vendor_id" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "cab_bookings" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_name" text NOT NULL,
	"client_phone" text NOT NULL,
	"reference_name" text,
	"reference_phone" text,
	"travel_date" date NOT NULL,
	"pickup_location" text NOT NULL,
	"drop_location" text NOT NULL,
	"vehicle_id" integer,
	"total_amount" numeric(10, 2) NOT NULL,
	"advance_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"payment_mode" text DEFAULT 'Cash',
	"vendor_id" integer,
	"reminder_date" date,
	"reminder_note" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "cab_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"booking_id" integer,
	"client_name" text,
	"advance_amount" numeric(10, 2) DEFAULT '0',
	"reference_name" text,
	"reference_phone" text,
	"members" jsonb DEFAULT '[]'::jsonb,
	"start_km" integer,
	"closing_km" integer,
	"total_price" numeric(10, 2) DEFAULT '0',
	"pending_amount" numeric(10, 2) DEFAULT '0',
	"is_return_trip" boolean DEFAULT false,
	"return_date" date,
	"return_members" jsonb DEFAULT '[]'::jsonb,
	"return_advance" numeric(10, 2) DEFAULT '0',
	"driver_collection" numeric(10, 2) DEFAULT '0',
	"expense_diesel" numeric(10, 2) DEFAULT '0',
	"expense_toll" numeric(10, 2) DEFAULT '0',
	"expense_parking" numeric(10, 2) DEFAULT '0',
	"expense_others" numeric(10, 2) DEFAULT '0',
	"driver_salary" numeric(10, 2) DEFAULT '0',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "cash_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" "transaction_type" NOT NULL,
	"person_name" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"reason" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "credit_cards" (
	"id" serial PRIMARY KEY NOT NULL,
	"card_name" text NOT NULL,
	"bank_name" text NOT NULL,
	"total_limit" numeric(10, 2) NOT NULL,
	"used_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"next_bill_date" date NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "flight_bookings" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_name" text NOT NULL,
	"client_phone" text NOT NULL,
	"reference_name" text,
	"reference_phone" text,
	"sector" text NOT NULL,
	"travel_date" date NOT NULL,
	"airline" text NOT NULL,
	"platform" text NOT NULL,
	"platform_notes" text,
	"total_amount" numeric(10, 2) NOT NULL,
	"advance_paid" numeric(10, 2) DEFAULT '0',
	"payment_mode" text DEFAULT 'Cash',
	"vendor_id" integer,
	"reminder_date" date,
	"reminder_note" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "service_calls" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"address" text NOT NULL,
	"phone_number" text NOT NULL,
	"call_date" date NOT NULL,
	"enquired_service_type" "enquired_service_type",
	"status" text DEFAULT 'pending' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "vehicles" (
	"id" serial PRIMARY KEY NOT NULL,
	"car_number" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "vehicles_car_number_unique" UNIQUE("car_number")
);
--> statement-breakpoint
CREATE TABLE "vendor_payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"vendor_id" integer NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"payment_date" date NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "vendors" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"total_owed" numeric(10, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "vendors_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "visa_applications" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_name" text NOT NULL,
	"passport_number" text NOT NULL,
	"phone" text NOT NULL,
	"visa_type" text NOT NULL,
	"medical_status" "medical_status" DEFAULT 'pending' NOT NULL,
	"pcc_status" "process_status" DEFAULT 'locked' NOT NULL,
	"stamping_status" "process_status" DEFAULT 'locked' NOT NULL,
	"payment_mode" text DEFAULT 'Cash',
	"vendor_id" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "cab_bookings" ADD CONSTRAINT "cab_bookings_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cab_runs" ADD CONSTRAINT "cab_runs_booking_id_cab_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."cab_bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_payments" ADD CONSTRAINT "vendor_payments_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;