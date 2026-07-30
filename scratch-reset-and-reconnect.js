const EVOLUTION_URL = "https://marryapp-whatsapp.onrender.com";
const EVOLUTION_KEY = "marryapp123";
const EVOLUTION_INSTANCE = "marryapp";

async function cleanReset() {
  console.log("=== 1. LOGGING OUT OLD SESSION ===");
  try {
    const resLogout = await fetch(`${EVOLUTION_URL}/instance/logout/${EVOLUTION_INSTANCE}`, {
      method: "DELETE",
      headers: { apikey: EVOLUTION_KEY },
    });
    console.log("Logout res:", await resLogout.text());
  } catch (e) {
    console.error("Logout error:", e);
  }

  console.log("\nWaiting 2 seconds...");
  await new Promise((r) => setTimeout(r, 2000));

  console.log("=== 2. CONNECTING TO GENERATE FRESH QR CODE ===");
  const resConn = await fetch(`${EVOLUTION_URL}/instance/connect/${EVOLUTION_INSTANCE}`, {
    headers: { apikey: EVOLUTION_KEY },
  });
  const data = await resConn.json();
  console.log("Connect result (has base64?):", !!data.base64 || !!data.code);
}

cleanReset();
