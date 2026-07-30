const EVOLUTION_URL = "https://marryapp-whatsapp.onrender.com";
const EVOLUTION_KEY = "marryapp123";
const EVOLUTION_INSTANCE = "marryapp";

async function revertSettings() {
  console.log("=== REVERTING READ MESSAGES SETTING ===");
  const resSet = await fetch(`${EVOLUTION_URL}/settings/set/${EVOLUTION_INSTANCE}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: EVOLUTION_KEY,
    },
    body: JSON.stringify({
      rejectCall: false,
      msgCall: "",
      groupsIgnore: false,
      alwaysOnline: false,
      readMessages: false,
      readStatus: false,
      syncFullHistory: false,
      wavoipToken: "",
    }),
  });
  console.log("Revert settings status:", resSet.status, await resSet.json());
}

revertSettings();
