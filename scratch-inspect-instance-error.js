const EVOLUTION_URL = "https://marryapp-whatsapp.onrender.com";
const EVOLUTION_KEY = "marryapp123";

async function inspectFull() {
  const res = await fetch(`${EVOLUTION_URL}/instance/fetchInstances`, {
    headers: { apikey: EVOLUTION_KEY },
  });
  const data = await res.json();
  console.log("Full Instance Data:", JSON.stringify(data, null, 2));
}

inspectFull();
