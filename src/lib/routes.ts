import { supabase } from "./supabaseClient";

export type Route = {
  id: number;
  route_name: string;
  start_point: string;
  end_point: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Stop = {
  id: number;
  route_id: number;
  stop_name: string;
  stop_order: number;
  created_at: string;
};

export type RouteWithStops = Route & { stops: Stop[] };

// Fetch all routes (admin)
export async function getRoutes() {
  try {
    const { data: routesData, error: routesError } = await supabase
      .from("routes")
      .select("*")
      .order("created_at", { ascending: false });

    if (routesError) return { data: undefined, error: routesError };
    const routes = (routesData || []) as Route[];
    if (routes.length === 0) return { data: routes as Route[] };

    const ids = routes.map((r) => r.id);
    const { data: stopsData, error: stopsError } = await supabase
      .from("route_stops")
      .select("*")
      .in("route_id", ids)
      .order("stop_order", { ascending: true });

    if (stopsError) return { data: undefined, error: stopsError };

    const stops = (stopsData || []) as Stop[];
    const stopsByRoute: Record<number, Stop[]> = {};
    for (const s of stops) {
      stopsByRoute[s.route_id] = stopsByRoute[s.route_id] || [];
      stopsByRoute[s.route_id].push(s);
    }

    const result: RouteWithStops[] = routes.map((r) => ({ ...r, stops: stopsByRoute[r.id] || [] }));
    return { data: result };
  } catch (err) {
    return { data: undefined, error: { message: String(err) } };
  }
}

// Fetch only active routes (for client-side display)
export async function getActiveRoutes() {
  try {
    const { data: routesData, error: routesError } = await supabase
      .from("routes")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (routesError) return { data: undefined, error: routesError };
    const routes = (routesData || []) as Route[];
    if (routes.length === 0) return { data: [] as RouteWithStops[] };

    const ids = routes.map((r) => r.id);
    const { data: stopsData, error: stopsError } = await supabase
      .from("route_stops")
      .select("*")
      .in("route_id", ids)
      .order("stop_order", { ascending: true });

    if (stopsError) return { data: undefined, error: stopsError };

    const stops = (stopsData || []) as Stop[];
    const stopsByRoute: Record<number, Stop[]> = {};
    for (const s of stops) {
      stopsByRoute[s.route_id] = stopsByRoute[s.route_id] || [];
      stopsByRoute[s.route_id].push(s);
    }

    const result: RouteWithStops[] = routes.map((r) => ({ ...r, stops: stopsByRoute[r.id] || [] }));
    return { data: result };
  } catch (err) {
    return { data: undefined, error: { message: String(err) } };
  }
}

// Create a new route (supports optional stops array via server-side function)
export async function createRoute(payload: {
  route_name: string;
  start_point?: string;
  end_point?: string;
  is_active?: boolean;
  stops?: { stop_name: string; stop_order: number }[];
}) {
  try {
    // If stops provided, call RPC function to ensure transactionality
    if (payload.stops && payload.stops.length > 0) {
      const { data, error } = await supabase.rpc("create_route_with_stops", {
        p_route_name: payload.route_name,
        p_start_point: payload.start_point || "",
        p_end_point: payload.end_point || "",
        p_is_active: payload.is_active !== false,
        p_stops: payload.stops,
      });
      if (error) return { data: undefined, error };
      if (!data || data.length === 0) return { data: undefined, error: { message: "Route creation returned no data" } };
      const created = data[0];
      const stopsWithIds = payload.stops.map((s, idx) => ({
        id: 0,
        route_id: created.id,
        stop_name: s.stop_name,
        stop_order: s.stop_order,
        created_at: new Date().toISOString(),
      }));
      return { data: { ...(created as Route), stops: stopsWithIds as Stop[] } };
    }

    const insertPayload = {
      route_name: payload.route_name,
      start_point: payload.start_point || "",
      end_point: payload.end_point || "",
      is_active: payload.is_active !== false,
    };

    const { data, error } = await supabase
      .from("routes")
      .insert(insertPayload)
      .select()
      .single();

    if (error) return { data: undefined, error };
    return { data: data as Route };
  } catch (err) {
    return { data: undefined, error: { message: String(err) } };
  }
}

// Update a route (supports replacing stops transactionally via server-side function)
export async function updateRoute(
  id: number,
  payload: Partial<{
    route_name: string;
    start_point: string;
    end_point: string;
    is_active: boolean;
    stops?: { stop_name: string; stop_order: number }[];
  }>
) {
  try {
    // If stops array is provided (even empty), use RPC for atomic transaction
    if (payload.stops !== undefined) {
      const { data, error } = await supabase.rpc("update_route_with_stops", {
        p_route_id: id,
        p_route_name: payload.route_name || null,
        p_start_point: payload.start_point || null,
        p_end_point: payload.end_point || null,
        p_is_active: payload.is_active !== undefined ? payload.is_active : null,
        p_stops: payload.stops,
      });
      if (error) return { data: undefined, error };
      if (!data || data.length === 0) return { data: undefined, error: { message: "Route update returned no data" } };
      const updated = data[0];
      const stopsWithIds = payload.stops.map((s, idx) => ({
        id: idx + 1,
        route_id: id,
        stop_name: s.stop_name,
        stop_order: s.stop_order,
        created_at: new Date().toISOString(),
      }));
      return { data: { ...(updated as Route), stops: stopsWithIds as Stop[] } };
    }

    // If no stops provided, just update the route fields
    const updateData: any = {};
    if (payload.route_name !== undefined) updateData.route_name = payload.route_name;
    if (payload.start_point !== undefined) updateData.start_point = payload.start_point;
    if (payload.end_point !== undefined) updateData.end_point = payload.end_point;
    if (payload.is_active !== undefined) updateData.is_active = payload.is_active;

    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("routes")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) return { data: undefined, error };
    return { data: data as Route };
  } catch (err) {
    return { data: undefined, error: { message: String(err) } };
  }
}

// Toggle route active status
export async function toggleRouteStatus(id: number, isActive: boolean) {
  try {
    const { data, error } = await supabase
      .from("routes")
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) return { data: undefined, error };
    return { data: data as Route };
  } catch (err) {
    return { data: undefined, error: { message: String(err) } };
  }
}

// Delete a route (hard delete - optional soft delete via is_active toggle)
export async function deleteRoute(id: number) {
  try {
    // Hard delete
    const { error } = await supabase.from("routes").delete().eq("id", id);

    if (error) return { success: false, error };
    return { success: true };
  } catch (err) {
    return { success: false, error: { message: String(err) } };
  }
}
