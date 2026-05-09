import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  await prisma.site.upsert({
    where: { id: 'pusat' },
    update: {},
    create: { id: 'pusat', name: 'BeritaKarya Pusat', domain: 'beritakarya.co' }
  })

  const hash = await bcrypt.hash('6669PusatKarya', 10)

  await prisma.user.upsert({
    where: { email: 'sabdakarya77@gmail.com' },
    update: {
      passwordHash: hash
    },
    create: {
      email: 'sabdakarya77@gmail.com',
      name: 'Superadmin Sabdakarya',
      role: 'superadmin',
      siteId: null,
      passwordHash: hash
    }
  })

  console.log('Seed selesai. Gunakan akun superadmin untuk membuat user lainnya.')
}

main().catch(console.error).finally(() => prisma.$disconnect())