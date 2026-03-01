import { PrismaClient } from "@prisma/client"
import * as bcrypt from "bcrypt"

const prisma = new PrismaClient()

const SALT_ROUNDS = 12

async function main() {
  const demoHash = await bcrypt.hash("demo", SALT_ROUNDS)
  const adminHash = await bcrypt.hash("admin", SALT_ROUNDS)

  const demoUser = await prisma.user.upsert({
    where: { email: "demo@example.com" },
    create: {
      email: "demo@example.com",
      name: "Demo User",
      password: demoHash,
      role: "user",
    },
    update: { password: demoHash },
  })
  console.log("Seeded demo user:", demoUser.email)

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    create: {
      email: "admin@example.com",
      name: "Admin User",
      password: adminHash,
      role: "admin",
    },
    update: { password: adminHash },
  })
  console.log("Seeded admin user:", adminUser.email)

  const existing = await prisma.conversation.findFirst({
    where: { title: "Sample design chat" },
  })
  if (!existing) {
    const convo = await prisma.conversation.create({
      data: {
        title: "Sample design chat",
        userId: demoUser.id,
        messages: {
          create: [
            { role: "user", content: "I want to redesign my living room in a minimalist style." },
            { role: "assistant", content: "I've noted your interest in a minimalist living room. Do you have a budget or color preferences?" },
            { role: "user", content: "Around $5k, and I like warm neutrals." },
          ],
        },
      },
      include: { messages: true },
    })
    console.log("Seeded sample conversation:", convo.id, "with", convo.messages.length, "messages")
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e)
    prisma.$disconnect()
    process.exit(1)
  })
