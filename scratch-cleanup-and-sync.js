const EVOLUTION_URL = "https://marryapp-whatsapp.onrender.com";
const EVOLUTION_KEY = "marryapp123";

async function cleanupAndTest() {
  console.log("=== 1. DELETING UNCONNECTED INSTANCE marryapp-oficial ===");
  try {
    const resDel = await fetch(`${EVOLUTION_URL}/instance/delete/marryapp-oficial`, {
      method: "DELETE",
      headers: { apikey: EVOLUTION_KEY },
    });
    console.log("Delete marryapp-oficial result:", await resDel.text());
  } catch (e) {
    console.error("Error deleting marryapp-oficial:", e);
  }

  console.log("\n=== 2. CHECKING CONNECTED INSTANCE marryapp STATE ===");
  const resState = await fetch(`${EVOLUTION_URL}/instance/connectionState/marryapp`, {
    headers: { apikey: EVOLUTION_KEY },
  });
  console.log("marryapp connection state:", await resState.json());

  console.log("\n=== 3. FETCHING INSTANCES ===");
  const resInst = await fetch(`${EVOLUTION_URL}/instance/fetchInstances`, {
    headers: { apikey: EVOLUTION_KEY },
  });
  console.log("Active instances:", await resInst.json());
}

cleanupAndTest();
