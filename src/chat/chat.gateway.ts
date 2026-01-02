import {
    WebSocketGateway,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';

@WebSocketGateway({
    cors: {
        origin: '*',
    },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    constructor(private readonly chatService: ChatService) { }

    handleConnection(client: Socket) {
        console.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        console.log(`Client disconnected: ${client.id}`);
    }

    @SubscribeMessage('visitor:join')
    async handleVisitorJoin(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: { siteId: string; visitorId: string },
    ) {
        const { siteId, visitorId } = payload;
        // Join a room specific to this site and visitor conversation
        const roomName = `chat:${siteId}:${visitorId}`;
        client.join(roomName);
        console.log(`Visitor ${visitorId} joined room ${roomName}`);
        return { status: 'ok', room: roomName };
    }

    @SubscribeMessage('visitor:message')
    async handleVisitorMessage(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: { siteId: string; visitorId: string; text: string },
    ) {
        const { siteId, visitorId, text } = payload;

        // Persist message
        const message = await this.chatService.saveVisitorMessage(siteId, visitorId, text);

        const roomName = `chat:${siteId}:${visitorId}`;
        const adminRoom = `admin:${siteId}`;

        // Notify visitor (confirmation/sync across tabs)
        this.server.to(roomName).emit('chat:message', message);

        // Notify all admins of this site
        this.server.to(adminRoom).emit('chat:new_message', {
            ...message,
            visitorId,
        });

        return message;
    }

    @SubscribeMessage('admin:join')
    async handleAdminJoin(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: { siteId: string },
    ) {
        const { siteId } = payload;
        const adminRoom = `admin:${siteId}`;
        client.join(adminRoom);
        console.log(`Admin joined room ${adminRoom}`);
        return { status: 'ok' };
    }

    @SubscribeMessage('admin:message')
    async handleAdminMessage(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: { chatId: string; text: string; siteId: string },
    ) {
        const { chatId, text, siteId } = payload;

        // Persist message
        const message = await this.chatService.saveAdminMessage(chatId, text);

        // Get chat to find visitorId
        const chat = await this.chatService.getChatById(chatId);
        if (chat) {
            const visitorRoom = `chat:${siteId}:${chat.visitorId}`;

            // Notify visitor
            this.server.to(visitorRoom).emit('admin:message', {
                text: message.text,
                createdAt: message.createdAt,
            });

            // Sync other admins
            const adminRoom = `admin:${siteId}`;
            this.server.to(adminRoom).emit('chat:message', message);
        }

        return message;
    }
}
