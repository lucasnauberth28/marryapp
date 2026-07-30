const { Pool } = require("pg");
const pool = new Pool({
  connectionString: "postgresql://postgres.zkweiqewsmphpvofnwrv:zwhYIBJEXtvIR383@aws-1-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true",
  ssl: { rejectUnauthorized: false }
});

async function run() {
  const res = await pool.query(`SELECT id, name, phone, "hasReceivedMessage", "rsvpStatus" FROM guests ORDER BY "createdAt" DESC LIMIT 10;`);
  console.log("Guests in Database:", res.rows);
  await pool.end();
}

run().catch(console.error);
