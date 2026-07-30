const EVOLUTION_URL = "https://marryapp-whatsapp.onrender.com";
const EVOLUTION_KEY = "marryapp123";
const EVOLUTION_INSTANCE = "marryapp";

async function enableSettings() {
  console.log("=== ENABLING ALWAYS ONLINE & READ MESSAGES ===");
  const res = await fetch(`${EVOLUTION_URL}/settings/set/${EVOLUTION_INSTANCE}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: EVOLUTION_KEY,
    },
    body: JSON.stringify({
      alwaysOnline: true,
      readMessages: true,
      readStatus: true,
      rejectCall: false,
      groupsIgnore: false,
    }),
  });

  console.log("Settings status:", res.status);
  console.log("Settings response:", await res.json());
}

enableSettings();
