import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  const demoUser = await prisma.user.upsert({
    where: { email: "demo@example.com" },
    create: {
      email: "demo@example.com",
      name: "Demo User",
    },
    update: {},
  })
  console.log("Seeded demo user:", demoUser.email)

  // Optional: create a sample conversation with a few messages
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
