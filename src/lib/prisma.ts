import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const prismaClientSingleton = () => {
  // Inicializa o Pooler do Postgres usando a nossa URL com porta 6543
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  
  // Cria o adaptador que o Prisma 7 exige
  const adapter = new PrismaPg(pool)
  
  // Instancia o Prisma usando o adaptador
  return new PrismaClient({ adapter })
}

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma