const EVOLUTION_URL = "https://marryapp-whatsapp.onrender.com";
const EVOLUTION_KEY = "marryapp123";
const EVOLUTION_INSTANCE = "marryapp";

async function recreateInstance() {
  console.log("=== 1. DELETING STALE INSTANCE FROM DISK ===");
  try {
    const resDelete = await fetch(`${EVOLUTION_URL}/instance/delete/${EVOLUTION_INSTANCE}`, {
      method: "DELETE",
      headers: { apikey: EVOLUTION_KEY },
    });
    console.log("Delete result:", await resDelete.text());
  } catch (e) {
    console.error("Delete error:", e);
  }

  console.log("\nWaiting 3 seconds...");
  await new Promise((r) => setTimeout(r, 3000));

  console.log("\n=== 2. CREATING FRESH INSTANCE ===");
  try {
    const resCreate = await fetch(`${EVOLUTION_URL}/instance/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: EVOLUTION_KEY,
      },
      body: JSON.stringify({
        instanceName: EVOLUTION_INSTANCE,
        qrcode: true,
        integration: "WHATSAPP-BAILEYS",
      }),
    });
    console.log("Create result:", await resCreate.json());
  } catch (e) {
    console.error("Create error:", e);
  }

  console.log("\n=== 3. CONNECTING TO GENERATE FRESH QR CODE ===");
  try {
    const resConn = await fetch(`${EVOLUTION_URL}/instance/connect/${EVOLUTION_INSTANCE}`, {
      headers: { apikey: EVOLUTION_KEY },
    });
    const data = await resConn.json();
    console.log("Connect result (has base64?):", !!data.base64 || !!data.code);
  } catch (e) {
    console.error("Connect error:", e);
  }
}

recreateInstance();
