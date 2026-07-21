import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const dbUrl = process.env.DATABASE_URL || 'file:db/custom.db'

  // If it's a Turso URL (libsql://), use the libSQL adapter
  if (dbUrl.startsWith('libsql://')) {
    const libsql = createClient({
      url: dbUrl,
      authToken: process.env.TURSO_AUTH_TOKEN,
    })
    const adapter = new PrismaLibSql(libsql)
    return new PrismaClient({ adapter })
  }

  // Otherwise use local SQLite
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query'] : [],
  })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
