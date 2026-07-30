const EVOLUTION_URL = "https://marryapp-whatsapp.onrender.com";
const EVOLUTION_KEY = "marryapp123";
const EVOLUTION_INSTANCE = "marryapp";

async function testSendReal() {
  console.log("Checking whatsappNumbers for Giovanni Nespoli (11958681449)...");
  const checkRes = await fetch(`${EVOLUTION_URL}/chat/whatsappNumbers/${EVOLUTION_INSTANCE}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: EVOLUTION_KEY,
    },
    body: JSON.stringify({
      numbers: ["5511958681449", "11958681449", "5511957305051"],
    }),
  });

  const checkData = await checkRes.json();
  console.log("Check result:", JSON.stringify(checkData, null, 2));

  console.log("\nSending test message to 5511958681449...");
  const sendRes = await fetch(`${EVOLUTION_URL}/message/sendText/${EVOLUTION_INSTANCE}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: EVOLUTION_KEY,
    },
    body: JSON.stringify({
      number: "5511958681449",
      text: "Teste de envio real MarryApp - Convite de Casamento 💍",
    }),
  });

  console.log("Status:", sendRes.status);
  console.log("Body:", await sendRes.json());
}

testSendReal();
