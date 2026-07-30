const EVOLUTION_URL = "https://marryapp-whatsapp.onrender.com";
const EVOLUTION_KEY = "marryapp123";
const EVOLUTION_INSTANCE = "marryapp";

async function testVariations() {
  console.log("=== 1. CHECKING JIDs FOR GUEST ===");
  const checkRes = await fetch(`${EVOLUTION_URL}/chat/whatsappNumbers/${EVOLUTION_INSTANCE}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: EVOLUTION_KEY,
    },
    body: JSON.stringify({
      numbers: ["5511958681449", "551158681449", "11958681449"],
    }),
  });
  console.log("JID check:", await checkRes.json());

  console.log("\n=== 2. SENDING TEST WITH CORRECT JID ===");
  const sendRes = await fetch(`${EVOLUTION_URL}/message/sendText/${EVOLUTION_INSTANCE}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: EVOLUTION_KEY,
    },
    body: JSON.stringify({
      number: "5511958681449",
      text: "Teste JID " + Date.now(),
    }),
  });
  const sendData = await sendRes.json();
  console.log("Send res key:", sendData.key);

  console.log("\nWaiting 3 seconds for MessageUpdate status...");
  await new Promise((r) => setTimeout(r, 3000));

  const findRes = await fetch(`${EVOLUTION_URL}/chat/findMessages/${EVOLUTION_INSTANCE}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: EVOLUTION_KEY,
    },
    body: JSON.stringify({
      where: {
        key: { id: sendData.key.id },
      },
    }),
  });
  const findData = await findRes.json();
  console.log("MessageStatus:", JSON.stringify(findData, null, 2));
}

testVariations();
