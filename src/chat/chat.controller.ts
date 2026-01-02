import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('chats')
// @UseGuards(AuthGuard('jwt'))
export class ChatController {
    constructor(private readonly chatService: ChatService) { }

    @Get('site/:siteId')
    getSiteChats(@Param('siteId') siteId: string) {
        return this.chatService.getChatsBySite(siteId);
    }

    @Get(':chatId/history')
    async getChatMessages(@Param('chatId') chatId: string) {
        console.log(`[ChatController] Fetching history for chatId: "${chatId}"`);
        const messages = await this.chatService.getMessagesByChat(chatId);
        console.log(`[ChatController] Found ${messages.length} messages`);
        return messages;
    }
}
