const EVOLUTION_URL = "https://marryapp-whatsapp.onrender.com";
const EVOLUTION_KEY = "marryapp123";
const EVOLUTION_INSTANCE = "marryapp";

async function testWithPresence() {
  console.log("=== SENDING WITH DELAY & PRESENCE ===");
  const res = await fetch(`${EVOLUTION_URL}/message/sendText/${EVOLUTION_INSTANCE}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: EVOLUTION_KEY,
    },
    body: JSON.stringify({
      number: "5511958681449",
      text: "Teste com delay 1200ms e simulador de digitando MarryApp 💍",
      delay: 1200,
      linkPreview: true,
    }),
  });

  console.log("Status:", res.status);
  console.log("Response:", await res.json());
}

testWithPresence();
