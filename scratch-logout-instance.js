const EVOLUTION_URL = "https://marryapp-whatsapp.onrender.com";
const EVOLUTION_KEY = "marryapp123";
const EVOLUTION_INSTANCE = "marryapp";

async function logoutInstance() {
  console.log("=== LOGGING OUT INSTANCE marryapp ===");
  try {
    const res = await fetch(`${EVOLUTION_URL}/instance/logout/${EVOLUTION_INSTANCE}`, {
      method: "DELETE",
      headers: { apikey: EVOLUTION_KEY },
    });
    console.log("Logout response:", await res.json());
  } catch (e) {
    console.error("Logout error:", e);
  }
}

logoutInstance();
