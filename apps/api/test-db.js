const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Testing connection...');
    const site = await prisma.site.findFirst();
    console.log('Connection successful!');
    console.log('Site keys:', Object.keys(site || {}));
    if (site && 'trendingTopics' in site) {
      console.log('✅ Field trendingTopics EXISTS in DB');
    } else {
      console.log('❌ Field trendingTopics MISSING in DB');
    }
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
