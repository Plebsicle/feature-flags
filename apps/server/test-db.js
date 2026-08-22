const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.$connect()
  .then(() => {
    console.log("Connected to DB successfully");
    process.exit(0);
  })
  .catch(e => {
    console.log("DB Connection Failed:", e.message);
    process.exit(1);
  });
