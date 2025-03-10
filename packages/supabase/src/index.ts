// Import clients and re-export with specific names
import { createClient as createClientSide } from "./clients/client";
import { createClient as createServerSide } from "./clients/server";
import { updateSession } from "./clients/middleware";
import { createServiceRoleClient } from "./service-client";

// Export clients with clear names
export {
  createClientSide,
  createServerSide,
  updateSession,
  createServiceRoleClient
};

// Re-export other utilities
export * from "./mutations";
export * from "./queries";
export * from "./types"; 