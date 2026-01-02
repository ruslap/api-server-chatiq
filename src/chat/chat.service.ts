import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
    constructor(private prisma: PrismaService) { }

    async getChatById(chatId: string) {
        return this.prisma.chat.findUnique({
            where: { id: chatId },
        });
    }

    async saveVisitorMessage(siteId: string, visitorId: string, text: string) {
        // Find or create chat
        let chat = await this.prisma.chat.findFirst({
            where: {
                siteId,
                visitorId,
                status: 'open',
            },
        });

        if (!chat) {
            chat = await this.prisma.chat.create({
                data: {
                    siteId,
                    visitorId,
                },
            });
        }

        return this.prisma.message.create({
            data: {
                chatId: chat.id,
                from: 'visitor',
                text,
            },
        });
    }

    async saveAdminMessage(chatId: string, text: string) {
        return this.prisma.message.create({
            data: {
                chatId,
                from: 'admin',
                text,
            },
        });
    }

    async getChatsBySite(siteId: string) {
        return this.prisma.chat.findMany({
            where: { siteId },
            orderBy: { createdAt: 'desc' },
            include: {
                messages: {
                    take: 1,
                    orderBy: { createdAt: 'desc' }
                }
            }
        });
    }

    async getMessagesByChat(chatId: string) {
        return this.prisma.message.findMany({
            where: { chatId },
            orderBy: { createdAt: 'asc' },
        });
    }
}
