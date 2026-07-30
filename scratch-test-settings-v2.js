const EVOLUTION_URL = "https://marryapp-whatsapp.onrender.com";
const EVOLUTION_KEY = "marryapp123";
const EVOLUTION_INSTANCE = "marryapp";

async function testSettings() {
  const res = await fetch(`${EVOLUTION_URL}/settings/find/${EVOLUTION_INSTANCE}`, {
    headers: { apikey: EVOLUTION_KEY },
  });
  console.log("Current settings:", await res.json());

  const resSet = await fetch(`${EVOLUTION_URL}/settings/set/${EVOLUTION_INSTANCE}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: EVOLUTION_KEY,
    },
    body: JSON.stringify({
      alwaysOnline: true,
    }),
  });
  console.log("Set status:", resSet.status, await resSet.json());
}

testSettings();
