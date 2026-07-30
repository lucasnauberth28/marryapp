const EVOLUTION_URL = "https://marryapp-whatsapp.onrender.com";
const EVOLUTION_KEY = "marryapp123";
const EVOLUTION_INSTANCE = "marryapp";

async function deepDiag() {
  console.log("=== 1. CHECK INSTANCES & OWNER JID ===");
  const resInst = await fetch(`${EVOLUTION_URL}/instance/fetchInstances`, {
    headers: { apikey: EVOLUTION_KEY },
  });
  const instData = await resInst.json();
  console.log("Instance info:", JSON.stringify(instData, null, 2));

  const instanceObj = Array.isArray(instData) ? instData[0] : instData;
  console.log("\nOwner JID:", instanceObj?.ownerJid);
  console.log("Connection Status:", instanceObj?.connectionStatus);

  console.log("\n=== 2. TEST SEND TEXT TO GUEST ===");
  // Test sending to a known phone number
  const testNumber = "5511958681449"; // Giovanni Nespoli number
  const resSend = await fetch(`${EVOLUTION_URL}/message/sendText/${EVOLUTION_INSTANCE}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: EVOLUTION_KEY,
    },
    body: JSON.stringify({
      number: testNumber,
      text: "Teste Diagnostico MarryApp " + new Date().toISOString(),
    }),
  });

  console.log("Send Status Code:", resSend.status);
  const sendData = await resSend.json();
  console.log("Send Response Body:", JSON.stringify(sendData, null, 2));
}

deepDiag();
