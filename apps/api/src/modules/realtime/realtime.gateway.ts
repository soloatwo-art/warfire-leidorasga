import { Logger } from "@nestjs/common";
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { SOCKET_EVENTS, SocketEventName } from "@warfire/shared";

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
    credentials: true,
  },
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  server!: Server;

  handleConnection(client: Socket) {
    this.logger.debug(`Cliente conectado: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Cliente desconectado: ${client.id}`);
  }

  emit(event: SocketEventName, payload: unknown) {
    this.server?.emit(event, payload);
  }

  emitGuildEvent(payload: unknown) {
    this.emit(SOCKET_EVENTS.GUILD_EVENT, payload);
  }

  emitOverviewUpdated(payload: unknown) {
    this.emit(SOCKET_EVENTS.GUILD_OVERVIEW_UPDATED, payload);
  }

  emitNotification(payload: unknown) {
    this.emit(SOCKET_EVENTS.NOTIFICATION, payload);
  }
}
