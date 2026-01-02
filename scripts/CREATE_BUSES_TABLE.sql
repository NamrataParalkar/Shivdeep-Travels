-- Create Buses Table for School Bus Management System
-- This table stores information about buses in the fleet

CREATE TABLE IF NOT EXISTS public.buses (
  id BIGSERIAL PRIMARY KEY,
  bus_number TEXT UNIQUE NOT NULL,
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  driver_id INTEGER REFERENCES public.drivers(id) ON DELETE SET NULL,
  status TEXT CHECK (status IN ('active', 'maintenance', 'inactive')) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_buses_status ON public.buses(status);
CREATE INDEX IF NOT EXISTS idx_buses_driver_id ON public.buses(driver_id);
CREATE INDEX IF NOT EXISTS idx_buses_bus_number ON public.buses(bus_number);

-- Enable Row Level Security
ALTER TABLE public.buses ENABLE ROW LEVEL SECURITY;
