const EVOLUTION_URL = "https://marryapp-whatsapp.onrender.com";
const EVOLUTION_KEY = "marryapp123";
const EVOLUTION_INSTANCE = "marryapp";

async function checkChats() {
  console.log("=== FETCHING RECENT CHATS FROM EVOLUTION API ===");
  const res = await fetch(`${EVOLUTION_URL}/chat/findChats/${EVOLUTION_INSTANCE}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: EVOLUTION_KEY,
    },
    body: JSON.stringify({
      take: 10,
    }),
  });

  const chats = await res.json();
  console.log("Chats found:", JSON.stringify(chats, null, 2));
}

checkChats();
