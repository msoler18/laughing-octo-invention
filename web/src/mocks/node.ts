import { setupServer } from "msw/node";
import { handlers } from "./handlers.js";

// MSW server for Vitest (Node environment).
// Usage in tests:
//
//   import { server } from "@/mocks/node";
//   beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
//   afterEach(() => server.resetHandlers());
//   afterAll(() => server.close());
//
// Override a handler for a single test:
//   server.use(http.get("/api/v1/creators", () => HttpResponse.json([])));

export const server = setupServer(...handlers);
