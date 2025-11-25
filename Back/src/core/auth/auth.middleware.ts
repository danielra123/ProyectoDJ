import { auth } from "./auth.config";
import Elysia from "elysia";

export const authMiddleware = new Elysia({ name: "auth" })
    .derive(async ({ request, set }) => {
        const session = await auth.api.getSession({ headers: request.headers });

        if (!session) {
            set.status = 401;
            throw new Error("No autorizado. Debes iniciar sesión.");
        }

        return {
            user: session.user,
            session: session.session
        };
    });

export type AuthContext = {
    user: {
        id: string;
        name: string;
        email: string;
        emailVerified: boolean;
        image?: string;
        createdAt: Date;
        updatedAt: Date;
    };
    session: {
        id: string;
        userId: string;
        expiresAt: Date;
        ipAddress?: string;
        userAgent?: string;
    };
};
