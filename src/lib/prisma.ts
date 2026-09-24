import type { PrismaClient } from "@prisma/client";
import mockDb from "./mock-db";

// Export mock database layer sebagai PrismaClient pengganti
// Berjalan 100% di memori / file JSON lokal tanpa butuh PostgreSQL atau Docker backend
export const prisma = mockDb as unknown as PrismaClient;

export default prisma;
