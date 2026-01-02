-- Create Routes Table for School Bus Management System
-- This table stores information about bus routes

CREATE TABLE IF NOT EXISTS public.routes (
  id BIGSERIAL PRIMARY KEY,
  route_name TEXT NOT NULL,
  start_point TEXT NOT NULL,
  end_point TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_routes_is_active ON public.routes(is_active);
CREATE INDEX IF NOT EXISTS idx_routes_route_name ON public.routes(route_name);

-- Enable Row Level Security
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;
