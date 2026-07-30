const EVOLUTION_URL = "https://marryapp-whatsapp.onrender.com";
const EVOLUTION_KEY = "marryapp123";
const EVOLUTION_INSTANCE = "marryapp";

async function testBoth() {
  console.log("=== Sending to Owner (5511967794744) ===");
  const resOwner = await fetch(`${EVOLUTION_URL}/message/sendText/${EVOLUTION_INSTANCE}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: EVOLUTION_KEY,
    },
    body: JSON.stringify({
      number: "5511967794744",
      text: "Teste MarryApp para o próprio remetente 💍",
    }),
  });
  console.log("Owner send result:", await resOwner.json());

  console.log("\n=== Sending to Giovanni Nespoli (5511958681449) ===");
  const resGuest = await fetch(`${EVOLUTION_URL}/message/sendText/${EVOLUTION_INSTANCE}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: EVOLUTION_KEY,
    },
    body: JSON.stringify({
      number: "5511958681449",
      text: "Teste MarryApp para o Convidado Giovanni Nespoli 💍",
    }),
  });
  console.log("Guest send result:", await resGuest.json());
}

testBoth();
