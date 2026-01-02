-- SQL functions to create/update routes along with their ordered stops in a transaction

-- Function: create_route_with_stops(route_name text, start_point text, end_point text, is_active boolean, stops jsonb)
-- stops: jsonb array of objects [{"stop_name": "A", "stop_order": 1}, ...]

CREATE OR REPLACE FUNCTION public.create_route_with_stops(
  p_route_name text,
  p_start_point text,
  p_end_point text,
  p_is_active boolean DEFAULT true,
  p_stops jsonb DEFAULT '[]'::jsonb
)
RETURNS TABLE(id bigint, route_name text, start_point text, end_point text, is_active boolean, created_at timestamptz) AS $$
DECLARE
  r RECORD;
  stop_record jsonb;
BEGIN
  -- Start transaction block (PL/pgSQL runs in transaction)
  INSERT INTO public.routes(route_name, start_point, end_point, is_active)
  VALUES (p_route_name, p_start_point, p_end_point, p_is_active)
  RETURNING * INTO r;

  -- Insert stops if provided
  IF jsonb_array_length(p_stops) > 0 THEN
    FOR stop_record IN SELECT jsonb_array_elements(p_stops)
    LOOP
      INSERT INTO public.route_stops(route_id, stop_name, stop_order)
      VALUES (r.id, stop_record->>'stop_name', (stop_record->>'stop_order')::int);
    END LOOP;
  END IF;

  RETURN QUERY SELECT r.id, r.route_name, r.start_point, r.end_point, r.is_active, r.created_at;
END; $$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: update_route_with_stops(route_id bigint, route_name text, start_point text, end_point text, is_active boolean, stops jsonb)
-- This updates route fields and replaces stops atomically

CREATE OR REPLACE FUNCTION public.update_route_with_stops(
  p_route_id bigint,
  p_route_name text DEFAULT NULL,
  p_start_point text DEFAULT NULL,
  p_end_point text DEFAULT NULL,
  p_is_active boolean DEFAULT NULL,
  p_stops jsonb DEFAULT '[]'::jsonb
)
RETURNS TABLE(id bigint, route_name text, start_point text, end_point text, is_active boolean, updated_at timestamptz) AS $$
DECLARE
  v_updated_route public.routes%ROWTYPE;
  stop_record jsonb;
BEGIN
  -- Update the route
  UPDATE public.routes
  SET route_name = COALESCE(p_route_name, routes.route_name),
      start_point = COALESCE(p_start_point, routes.start_point),
      end_point = COALESCE(p_end_point, routes.end_point),
      is_active = COALESCE(p_is_active, routes.is_active),
      updated_at = now()
  WHERE routes.id = p_route_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Route with id % not found', p_route_id;
  END IF;

  -- Delete existing stops for this route
  DELETE FROM public.route_stops WHERE public.route_stops.route_id = p_route_id;

  -- Insert new stops if provided
  IF jsonb_array_length(p_stops) > 0 THEN
    FOR stop_record IN SELECT jsonb_array_elements(p_stops)
    LOOP
      INSERT INTO public.route_stops(route_id, stop_name, stop_order)
      VALUES (p_route_id, stop_record->>'stop_name', (stop_record->>'stop_order')::int);
    END LOOP;
  END IF;

  -- Fetch the updated route and return it
  SELECT public.routes.id, public.routes.route_name, public.routes.start_point, 
         public.routes.end_point, public.routes.is_active, public.routes.updated_at
  INTO v_updated_route.id, v_updated_route.route_name, v_updated_route.start_point,
       v_updated_route.end_point, v_updated_route.is_active, v_updated_route.updated_at
  FROM public.routes
  WHERE public.routes.id = p_route_id;

  RETURN QUERY SELECT v_updated_route.id, v_updated_route.route_name, v_updated_route.start_point,
                       v_updated_route.end_point, v_updated_route.is_active, v_updated_route.updated_at;
END; $$ LANGUAGE plpgsql SECURITY DEFINER;
