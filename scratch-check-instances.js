const EVOLUTION_URL = "https://marryapp-whatsapp.onrender.com";
const EVOLUTION_KEY = "marryapp123";

async function run() {
  const res = await fetch(`${EVOLUTION_URL}/instance/fetchInstances`, {
    headers: { apikey: EVOLUTION_KEY },
  });
  console.log("Instances:", await res.json());
}

run();
