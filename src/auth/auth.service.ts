import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) { }

    async validateGoogleUser(details: any) {
        let user = await this.prisma.user.findUnique({
            where: { email: details.email },
        });

        if (user) {
            // Update googleId if not present (transition from email/pass if it was there)
            if (!user.googleId) {
                user = await this.prisma.user.update({
                    where: { id: user.id },
                    data: { googleId: details.googleId, avatar: details.picture },
                });
            }
        } else {
            // Create new user (Owner by default for the first one, or just OWNER/OPERATOR logic)
            // For MVP, simplify: if it's the first user ever, make them OWNER.
            const userCount = await this.prisma.user.count();
            const role = userCount === 0 ? 'OWNER' : 'OPERATOR';

            user = await this.prisma.user.create({
                data: {
                    email: details.email,
                    name: `${details.firstName} ${details.lastName}`,
                    googleId: details.googleId,
                    avatar: details.picture,
                    role,
                },
            });
        }

        return user;
    }

    async login(user: any) {
        const payload = { email: user.email, sub: user.id, role: user.role };
        return {
            access_token: this.jwtService.sign(payload),
            user,
        };
    }
}
