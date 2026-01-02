-- Create route_stops table to store ordered stops for routes

CREATE TABLE IF NOT EXISTS public.route_stops (
  id BIGSERIAL PRIMARY KEY,
  route_id BIGINT NOT NULL REFERENCES public.routes(id) ON DELETE CASCADE,
  stop_name TEXT NOT NULL,
  stop_order INT NOT NULL CHECK (stop_order > 0),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Unique constraint: (route_id, stop_order)
CREATE UNIQUE INDEX IF NOT EXISTS idx_route_stops_unique_order
  ON public.route_stops(route_id, stop_order);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_route_stops_route_id
  ON public.route_stops(route_id);

CREATE INDEX IF NOT EXISTS idx_route_stops_order
  ON public.route_stops(stop_order);

-- Enable Row Level Security
ALTER TABLE public.route_stops ENABLE ROW LEVEL SECURITY;
