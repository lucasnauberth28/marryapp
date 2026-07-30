const EVOLUTION_URL = "https://marryapp-whatsapp.onrender.com";
const EVOLUTION_KEY = "marryapp123";
const EVOLUTION_INSTANCE = "marryapp";

async function testSendSelf() {
  console.log("=== SENDING TEST TO SELF (5511967794744) ===");
  const res = await fetch(`${EVOLUTION_URL}/message/sendText/${EVOLUTION_INSTANCE}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: EVOLUTION_KEY,
    },
    body: JSON.stringify({
      number: "5511967794744",
      text: "Teste de autoremetente MarryApp " + new Date().toLocaleTimeString(),
    }),
  });

  console.log("Status:", res.status);
  console.log("Body:", await res.json());
}

testSendSelf();
