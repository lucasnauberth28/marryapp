const EVOLUTION_URL = "https://marryapp-whatsapp.onrender.com";
const EVOLUTION_KEY = "marryapp123";
const EVOLUTION_INSTANCE = "marryapp";

async function testSendConnected() {
  console.log("=== SENDING TEST TEXT ON CONNECTED INSTANCE (marryapp) ===");
  const resSend = await fetch(`${EVOLUTION_URL}/message/sendText/${EVOLUTION_INSTANCE}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: EVOLUTION_KEY,
    },
    body: JSON.stringify({
      number: "5511958681449",
      text: "Teste no formato correto na instancia conectada marryapp 💍",
    }),
  });

  console.log("Status:", resSend.status);
  const data = await resSend.json();
  console.log("Response:", JSON.stringify(data, null, 2));
}

testSendConnected();
