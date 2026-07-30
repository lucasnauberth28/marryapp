const EVOLUTION_URL = "https://marryapp-whatsapp.onrender.com";
const EVOLUTION_KEY = "marryapp123";
const EVOLUTION_INSTANCE = "marryapp";

async function superDiag() {
  console.log("=== 1. FETCH INSTANCE STATE & SETTINGS ===");
  const resInst = await fetch(`${EVOLUTION_URL}/instance/fetchInstances`, {
    headers: { apikey: EVOLUTION_KEY },
  });
  const instances = await resInst.json();
  console.log("Instance full details:", JSON.stringify(instances, null, 2));

  console.log("\n=== 2. TEST WHATSAPP NUMBER CHECK FOR GUEST ===");
  const testPhone = "5511958681449";
  const resCheck = await fetch(`${EVOLUTION_URL}/chat/whatsappNumbers/${EVOLUTION_INSTANCE}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: EVOLUTION_KEY,
    },
    body: JSON.stringify({
      numbers: [testPhone, "551158681449", "11958681449"],
    }),
  });
  const checkData = await resCheck.json();
  console.log("whatsappNumbers result:", JSON.stringify(checkData, null, 2));

  console.log("\n=== 3. SEND TEST WITH 9-DIGIT NUMBER ===");
  const send1 = await fetch(`${EVOLUTION_URL}/message/sendText/${EVOLUTION_INSTANCE}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: EVOLUTION_KEY,
    },
    body: JSON.stringify({
      number: "5511958681449",
      text: "Teste 9-digit: " + new Date().toISOString(),
    }),
  });
  console.log("Send 1 status:", send1.status, await send1.json());

  console.log("\n=== 4. SEND TEST WITH 8-DIGIT NUMBER (WITHOUT 9) ===");
  const send2 = await fetch(`${EVOLUTION_URL}/message/sendText/${EVOLUTION_INSTANCE}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: EVOLUTION_KEY,
    },
    body: JSON.stringify({
      number: "551158681449",
      text: "Teste 8-digit: " + new Date().toISOString(),
    }),
  });
  console.log("Send 2 status:", send2.status, await send2.json());
}

superDiag();
