const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  const roles = [
    { name: 'member', permissions: {} },
    { name: 'volunteer', permissions: {} },
    { name: 'moderator', permissions: {} },
    { name: 'administrator', permissions: {} },
  ]

  for (const role of roles) {
    await prisma.userRole.upsert({
      where: { name: role.name },
      update: {},
      create: {
        name: role.name,
        permissions: role.permissions,
      },
    })
  }

  console.log('Roles seeded successfully')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })