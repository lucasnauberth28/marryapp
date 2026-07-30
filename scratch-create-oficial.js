const EVOLUTION_URL = "https://marryapp-whatsapp.onrender.com";
const EVOLUTION_KEY = "marryapp123";
const NEW_INSTANCE = "marryapp-oficial";

async function createOficial() {
  console.log("=== 1. CREATING BRAND NEW INSTANCE: marryapp-oficial ===");
  try {
    const resCreate = await fetch(`${EVOLUTION_URL}/instance/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: EVOLUTION_KEY,
      },
      body: JSON.stringify({
        instanceName: NEW_INSTANCE,
        qrcode: true,
        integration: "WHATSAPP-BAILEYS",
      }),
    });
    console.log("Create response:", await resCreate.json());
  } catch (e) {
    console.error("Create error:", e);
  }

  console.log("\n=== 2. FETCHING FRESH QR CODE FOR marryapp-oficial ===");
  try {
    const resConn = await fetch(`${EVOLUTION_URL}/instance/connect/${NEW_INSTANCE}`, {
      headers: { apikey: EVOLUTION_KEY },
    });
    const data = await resConn.json();
    console.log("Has base64 QR?", !!data.base64 || !!data.code);
  } catch (e) {
    console.error("Connect error:", e);
  }
}

createOficial();
