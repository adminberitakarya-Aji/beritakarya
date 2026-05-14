import { PrismaClient } from '@prisma/client'
import { argv } from 'process'

const prisma = new PrismaClient()

async function seedQuotas() {
  console.log('🌱 Seeding RoleQuota data...')

  const quotas = [
    {
      role: 'superadmin',
      dailyRequests: 999999,
      dailyTokens: 999999,
      monthlyBudget: 99999.00,
      allowedFeatures: JSON.stringify([
        'rewrite', 'expand', 'headline', 'seo', 
        'grammar', 'readability', 'layout', 'caption'
      ]),
      modelRestriction: null
    },
    {
      role: 'wapimred',
      dailyRequests: 500,
      dailyTokens: 100000,
      monthlyBudget: 500.00,
      allowedFeatures: JSON.stringify([
        'rewrite', 'expand', 'headline', 'seo',
        'grammar', 'readability', 'layout', 'caption'
      ]),
      modelRestriction: null
    },
    {
      role: 'editor',
      dailyRequests: 200,
      dailyTokens: 50000,
      monthlyBudget: 50.00,
      allowedFeatures: JSON.stringify([
        'rewrite', 'expand', 'headline', 'seo',
        'grammar', 'readability', 'layout', 'caption'
      ]),
      modelRestriction: null
    },
    {
      role: 'reporter',
      dailyRequests: 100,
      dailyTokens: 25000,
      monthlyBudget: 25.00,
      allowedFeatures: JSON.stringify([
        'rewrite', 'expand', 'grammar', 'readability', 'caption'
      ]),
      modelRestriction: 'gpt-3.5-turbo'
    },
    {
      role: 'reader',
      dailyRequests: 5,
      dailyTokens: 1000,
      monthlyBudget: 0.00,
      allowedFeatures: JSON.stringify([]),
      modelRestriction: null
    }
  ]

  for (const quota of quotas) {
    await prisma.roleQuota.upsert({
      where: { role: quota.role },
      update: quota,
      create: quota
    })
    console.log(`  ✅ Seeded quota for role: ${quota.role}`)
  }

  console.log('✅ RoleQuota seeding complete!')
}

async function updateExistingUsers() {
  console.log('\n🔄 Updating existing users with default quota fields...')
  
  const defaultQuota = {
    aiEnabled: true,
    aiDailyLimit: 50,
    aiMonthlyBudget: 10.00,
    aiFeaturesAllowed: JSON.stringify([
      'rewrite', 'expand', 'grammar', 'readability', 'caption'
    ]),
    aiQuotaResetDate: null,
    aiModelRestriction: null
  }

  const users = await prisma.user.findMany({
    select: { id: true, role: true }
  })

  let updated = 0
  for (const user of users) {
    await prisma.user.update({
      where: { id: user.id },
      data: defaultQuota
    })
    updated++
  }

  console.log(`  ✅ Updated ${updated} users with default quota fields`)
  console.log('✅ User quota initialization complete!')
}

seedQuotas()
  .then(() => updateExistingUsers())
  .catch((e) => {
    console.error('❌ Error seeding quotas:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })