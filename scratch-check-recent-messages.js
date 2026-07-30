const EVOLUTION_URL = "https://marryapp-whatsapp.onrender.com";
const EVOLUTION_KEY = "marryapp123";
const EVOLUTION_INSTANCE = "marryapp";

async function checkSent() {
  console.log("=== Searching recent messages for 5511958681449 ===");
  const res = await fetch(`${EVOLUTION_URL}/chat/findMessages/${EVOLUTION_INSTANCE}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: EVOLUTION_KEY,
    },
    body: JSON.stringify({
      where: {
        key: {
          remoteJid: "5511958681449@s.whatsapp.net",
        },
      },
      take: 5,
    }),
  });

  console.log("findMessages status:", res.status);
  const data = await res.json();
  console.log("Messages found:", JSON.stringify(data, null, 2));
}

checkSent();
