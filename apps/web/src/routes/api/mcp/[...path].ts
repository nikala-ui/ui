import type { Transport, TransportSendOptions } from "@modelcontextprotocol/sdk/shared/transport.js";
import {
  type JSONRPCMessage,
  JSONRPCMessageSchema,
  type MessageExtraInfo,
} from "@modelcontextprotocol/sdk/types.js";
import { createNikalaMcpServer } from "@nikala-ui/mcp/server";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, mcp-session-id",
  "Access-Control-Expose-Headers": "mcp-session-id",
};

/**
 * Web Standards compliant SSE Server Transport for MCP.
 * Works across Node.js, Nitro, Bun, Cloudflare Workers, and standard Web Streams.
 */
class WebSSEServerTransport implements Transport {
  sessionId: string;
  onclose?: () => void;
  onerror?: (error: Error) => void;
  onmessage?: <T extends JSONRPCMessage>(message: T, extra?: MessageExtraInfo) => void;

  private controller: ReadableStreamDefaultController<Uint8Array>;
  private encoder = new TextEncoder();
  private isClosed = false;

  constructor(sessionId: string, controller: ReadableStreamDefaultController<Uint8Array>) {
    this.sessionId = sessionId;
    this.controller = controller;
  }

  async start(): Promise<void> {
    // Send the initial endpoint event as required by the MCP SSE specification:
    // Clients connect to GET /api/mcp/sse and use the endpoint event to determine where to POST messages.
    this.writeEvent("endpoint", `/api/mcp/messages?sessionId=${encodeURIComponent(this.sessionId)}`);
  }

  async send(message: JSONRPCMessage, _options?: TransportSendOptions): Promise<void> {
    if (this.isClosed) return;
    this.writeEvent("message", JSON.stringify(message));
  }

  writeComment(comment: string): void {
    if (this.isClosed) return;
    try {
      this.controller.enqueue(this.encoder.encode(`: ${comment}\n\n`));
    } catch {
      this.close();
    }
  }

  writeEvent(event: string, data: string): void {
    if (this.isClosed) return;
    try {
      this.controller.enqueue(this.encoder.encode(`event: ${event}\ndata: ${data}\n\n`));
    } catch {
      this.close();
    }
  }

  async handleMessage(rawMessage: unknown): Promise<void> {
    const parsed = JSONRPCMessageSchema.parse(rawMessage);
    this.onmessage?.(parsed);
  }

  async close(): Promise<void> {
    if (this.isClosed) return;
    this.isClosed = true;
    try {
      this.controller.close();
    } catch {
      // Stream may already be closed
    }
    this.onclose?.();
  }
}

const transports = new Map<string, WebSSEServerTransport>();

export async function GET(event: { request: Request }) {
  const url = new URL(event.request.url);
  const pathname = url.pathname.replace(/\/+$/, "");

  // Endpoint for SSE stream connection
  if (pathname === "/api/mcp/sse") {
    const sessionId = crypto.randomUUID();
    let transport: WebSSEServerTransport;
    let keepAliveTimer: ReturnType<typeof setInterval> | undefined;

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        transport = new WebSSEServerTransport(sessionId, controller);
        transports.set(sessionId, transport);

        const server = createNikalaMcpServer();
        await server.connect(transport);

        // Keep-alive heartbeat every 15s to prevent proxies from dropping idle connections
        keepAliveTimer = setInterval(() => {
          transport.writeComment("keepalive");
        }, 15000);
      },
      cancel() {
        if (keepAliveTimer) clearInterval(keepAliveTimer);
        transport?.close();
        transports.delete(sessionId);
      },
    });

    event.request.signal.addEventListener("abort", () => {
      if (keepAliveTimer) clearInterval(keepAliveTimer);
      transport?.close();
      transports.delete(sessionId);
    });

    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        ...corsHeaders,
      },
    });
  }

  return new Response(
    "Nikala UI Model Context Protocol (MCP) Server\n\nEndpoints:\n- SSE Stream: /api/mcp/sse\n- Messages: /api/mcp/messages?sessionId=<session_id>\n",
    {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        ...corsHeaders,
      },
    }
  );
}

export async function POST(event: { request: Request }) {
  const url = new URL(event.request.url);
  const pathname = url.pathname.replace(/\/+$/, "");

  if (pathname === "/api/mcp/messages") {
    const sessionId = url.searchParams.get("sessionId");
    if (!sessionId) {
      return new Response("Missing sessionId query parameter", {
        status: 400,
        headers: corsHeaders,
      });
    }

    const transport = transports.get(sessionId);
    if (!transport) {
      return new Response("Session not found", {
        status: 404,
        headers: corsHeaders,
      });
    }

    try {
      const body = await event.request.json();
      await transport.handleMessage(body);
      return new Response("Accepted", {
        status: 202,
        headers: corsHeaders,
      });
    } catch (err: any) {
      return new Response(`Invalid message format: ${err?.message || err}`, {
        status: 400,
        headers: corsHeaders,
      });
    }
  }

  return new Response("Not Found", {
    status: 404,
    headers: corsHeaders,
  });
}

export async function DELETE(event: { request: Request }) {
  const url = new URL(event.request.url);
  const sessionId = url.searchParams.get("sessionId");
  if (sessionId) {
    const transport = transports.get(sessionId);
    if (transport) {
      await transport.close();
      transports.delete(sessionId);
    }
  }
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}
