// packages/gateway/src/feed.ts
import { DurableObject } from 'cloudflare:workers';
import type { GatewayEnv } from './index';

/**
 * MissionFeed Durable Object
 * Manages WebSocket connections for real-time mission updates.
 */
export class MissionFeed extends DurableObject {
  private sessions = new Set<WebSocket>();

  constructor(state: DurableObjectState, env: GatewayEnv) {
    super(state, env);
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // Endpoint to upgrade to WebSocket
    if (url.pathname === '/ws') {
      if (request.headers.get('Upgrade') !== 'websocket') {
        return new Response('Expected WebSocket', { status: 426 });
      }

      const pair = (new WebSocketPair() as any);
      const client = pair[0];
      const server = pair[1];
      await this.handleSession(server);

      return new Response(null, { status: 101, webSocket: client });
    }

    // Endpoint to broadcast messages
    if (url.pathname === '/broadcast' && request.method === 'POST') {
      const message = await request.text();
      this.broadcast(message);
      return new Response('Broadcasted', { status: 200 });
    }

    return new Response('Not Found', { status: 404 });
  }

  private async handleSession(ws: WebSocket) {
    ws.accept();
    this.sessions.add(ws);

    ws.addEventListener('message', async (event) => {
      // For now, we don't expect messages from the client
      // but we can handle them here if needed (e.g. ping/pong)
      console.log('Received message from client:', event.data);
    });

    ws.addEventListener('close', () => {
      this.sessions.delete(ws);
    });

    ws.addEventListener('error', () => {
      this.sessions.delete(ws);
    });
  }

  private broadcast(message: string) {
    for (const session of this.sessions) {
      try {
        session.send(message);
      } catch (e) {
        console.error('Failed to send message to session, removing:', e);
        this.sessions.delete(session);
      }
    }
  }
}
