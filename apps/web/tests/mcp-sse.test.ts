import { describe, it, expect } from "vitest";
import { GET, POST, OPTIONS, DELETE } from "../src/routes/api/mcp/[...path].js";

describe("MCP SSE and HTTP Transport", () => {
  it("should establish SSE stream on GET /api/mcp/sse and send endpoint event", async () => {
    const getReq = new Request("https://nikala.dev/api/mcp/sse", {
      method: "GET",
      headers: { Accept: "text/event-stream" },
    });

    const getRes = await GET({ request: getReq });
    expect(getRes.status).toBe(200);
    expect(getRes.headers.get("content-type")).toBe("text/event-stream");
    expect(getRes.headers.get("access-control-allow-origin")).toBe("*");

    const reader = getRes.body!.getReader();
    const decoder = new TextDecoder();

    const { value } = await reader.read();
    const text = decoder.decode(value);
    expect(text).toContain("event: endpoint");
    expect(text).toContain("/api/mcp/messages?sessionId=");

    const sessionIdMatch = text.match(/sessionId=([a-zA-Z0-9_-]+)/);
    expect(sessionIdMatch).toBeTruthy();
    const sessionId = sessionIdMatch![1];

    // Send initialize message over POST
    const postReq = new Request(`https://nikala.dev/api/mcp/messages?sessionId=${sessionId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          capabilities: {},
          clientInfo: { name: "vitest-client", version: "1.0.0" },
        },
      }),
    });

    const postRes = await POST({ request: postReq });
    expect(postRes.status).toBe(202);

    // Read initialize response from SSE stream
    const initChunk = await reader.read();
    const initText = decoder.decode(initChunk.value);
    expect(initText).toContain("event: message");
    expect(initText).toContain("nikala-ui-mcp");

    // Send tools/list message
    const toolsReq = new Request(`https://nikala.dev/api/mcp/messages?sessionId=${sessionId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 2,
        method: "tools/list",
        params: {},
      }),
    });

    const toolsRes = await POST({ request: toolsReq });
    expect(toolsRes.status).toBe(202);

    const toolsChunk = await reader.read();
    const toolsText = decoder.decode(toolsChunk.value);
    expect(toolsText).toContain("list_components");
    expect(toolsText).toContain("install_component");

    await reader.cancel();
  });

  it("should handle OPTIONS requests for CORS preflight", async () => {
    const res = await OPTIONS();
    expect(res.status).toBe(204);
    expect(res.headers.get("access-control-allow-origin")).toBe("*");
    expect(res.headers.get("access-control-allow-methods")).toContain("POST");
  });

  it("should return 400 when sessionId is missing in POST /api/mcp/messages", async () => {
    const postReq = new Request("https://nikala.dev/api/mcp/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    const postRes = await POST({ request: postReq });
    expect(postRes.status).toBe(400);
  });

  it("should return 404 when sessionId is not found in POST /api/mcp/messages", async () => {
    const postReq = new Request("https://nikala.dev/api/mcp/messages?sessionId=non-existent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    const postRes = await POST({ request: postReq });
    expect(postRes.status).toBe(404);
  });
});
