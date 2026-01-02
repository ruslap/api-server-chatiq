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
        // 1. Ensure the site exists (SaaS logic: sites should be pre-registered, 
        // but for demo/testing we'll ensure it exists to avoid FK errors)
        let site = await this.prisma.site.findUnique({ where: { id: siteId } });

        if (!site) {
            console.log(`[ChatService] Site ${siteId} not found, creating a default one for testing...`);
            // Find any owner or create a dummy one if needed. 
            // For now, let's assume there is at least one user or we'll get another error.
            const user = await this.prisma.user.findFirst();
            if (user) {
                site = await this.prisma.site.create({
                    data: {
                        id: siteId,
                        name: 'Auto-created Test Site',
                        domain: 'localhost',
                        ownerId: user.id
                    }
                });
            } else {
                throw new Error("No users found in database to assign the new site to.");
            }
        }

        // 2. Find or create chat
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

    async clearChatMessages(chatId: string) {
        return this.prisma.message.deleteMany({
            where: { chatId }
        });
    }

    async deleteChat(chatId: string) {
        // First delete all messages due to FK constraints if not cascading
        await this.prisma.message.deleteMany({
            where: { chatId }
        });
        return this.prisma.chat.delete({
            where: { id: chatId }
        });
    }
}
