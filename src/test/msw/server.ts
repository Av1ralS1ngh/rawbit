import { setupServer } from "msw/node";
import { handlers, clearSharedFlows, seedSharedFlow, apiHandlers } from "./handlers";

export const server = setupServer(...handlers);

export { apiHandlers, clearSharedFlows, seedSharedFlow };
