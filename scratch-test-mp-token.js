const fetch = require("node-fetch");

async function testTokenize() {
  const mpToken = process.env.MERCADOPAGO_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN;
  console.log("MP Token present:", !!mpToken);

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
        card_number: "4509950000000000",
        expiration_month: 12,
        expiration_year: 2028,
        security_code: "123",
        cardholder: {
          name: "LUCAS PROTASIO"
        }
      })
    });

    const data = await res.json();
    console.log("Card Token Result:", data);
  } catch (err) {
    console.error("Token error:", err);
  }
}

testTokenize();
