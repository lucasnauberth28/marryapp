const EVOLUTION_URL = "https://marryapp-whatsapp.onrender.com";
const EVOLUTION_KEY = "marryapp123";
const EVOLUTION_INSTANCE = "marryapp";

async function restartAndSend() {
  console.log("=== 1. RESTARTING INSTANCE SOCKET ===");
  const resRestart = await fetch(`${EVOLUTION_URL}/instance/restart/${EVOLUTION_INSTANCE}`, {
    method: "PUT",
    headers: { apikey: EVOLUTION_KEY },
  });
  console.log("Restart result:", await resRestart.json());

  console.log("\nWaiting 5 seconds for socket connection...");
  await new Promise((r) => setTimeout(r, 5000));

  console.log("\n=== 2. CHECKING CONNECTION STATE ===");
  const resState = await fetch(`${EVOLUTION_URL}/instance/connectionState/${EVOLUTION_INSTANCE}`, {
    headers: { apikey: EVOLUTION_KEY },
  });
  console.log("State:", await resState.json());

  console.log("\n=== 3. SENDING TEST TEXT ===");
  const sendRes = await fetch(`${EVOLUTION_URL}/message/sendText/${EVOLUTION_INSTANCE}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: EVOLUTION_KEY,
    },
    body: JSON.stringify({
      number: "5511958681449",
      text: "Teste pós-restart Evolution API 💍",
    }),
  });
  console.log("Send status:", sendRes.status);
  console.log("Send body:", await sendRes.json());
}

restartAndSend();
