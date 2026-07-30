process.env.DATABASE_URL = "postgresql://postgres.zkweiqewsmphpvofnwrv:zwhYIBJEXtvIR383@aws-1-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true";
process.env.DIRECT_URL = "postgresql://postgres.zkweiqewsmphpvofnwrv:zwhYIBJEXtvIR383@aws-1-us-west-2.pooler.supabase.com:5432/postgres";

import prisma from "./src/lib/prisma";

async function checkGuests() {
  console.log("=== GUESTS IN DATABASE ===");
  const guests = await prisma.guest.findMany({
    take: 10,
    orderBy: { createdAt: "desc" },
  });
  console.log(JSON.stringify(guests, null, 2));
}

checkGuests().finally(() => prisma.$disconnect());
