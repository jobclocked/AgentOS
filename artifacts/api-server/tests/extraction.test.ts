import { describe, expect, it, vi } from "vitest";
import request from "supertest";
vi.mock("@workspace/db", () => ({
  db: {}, agentsTable: {}, deploymentsTable: {}, runsTable: {}, toolsTable: {},
}));
import app from "../src/app";

describe("Standalone AgentOS source boundary", () => {
  it("serves the API health endpoint without database calls", async () => {
    await request(app).get("/api/healthz").expect(200, { status: "ok" });
  });
  it("does not include unrelated application endpoints", async () => {
    for (const path of ["/api/jo/sessions", "/api/me", "/api/products", "/api/recordings", "/api/content", "/api/storage/upload-url", "/api/pipeline-config"]) {
      await request(app).get(path).expect(404, { error: "Not found" });
    }
  });
  it("preserves request validation before writes", async () => {
    for (const path of ["/api/agents", "/api/runs", "/api/deployments"]) {
      const result = await request(app).post(path).send({}).expect(400);
      expect(result.body.error).toBeTruthy();
    }
  });
});
