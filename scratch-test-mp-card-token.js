const fetch = require("node-fetch");

async function testTokenizeMaster() {
  const mpToken = process.env.MERCADOPAGO_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN;
  if (!mpToken) {
    console.log("No token present");
    return;
  }

  try {
    const res = await fetch(`https://api.mercadopago.com/v1/card_tokens`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${mpToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        card_number: "5555073399889422",
        expiration_month: 1,
        expiration_year: 2035,
        security_code: "225",
        cardholder: {
          name: "GIOVANNA P SILVA"
        }
      })
    });

    const data = await res.json();
    console.log("Token Result:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Token error:", err);
  }
}

testTokenizeMaster();
