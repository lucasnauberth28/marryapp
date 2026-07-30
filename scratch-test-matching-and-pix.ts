import { generatePixPayload } from "./src/lib/pix-utils";

function testPix() {
  console.log("=== TESTING EMV PIX WITH KEY lucasnauberth@gmail.com ===");
  const payload = generatePixPayload({
    pixKey: "lucasnauberth@gmail.com",
    merchantName: "Lucas e Giovanna",
    merchantCity: "Sao Paulo",
    amount: 3000, // R$ 30,00
    description: "Geladeira topzera",
  });

  console.log("Generated EMV BR Code:\n", payload);
  console.log("Payload length:", payload.length);
  console.log("CRC16 Checksum (last 4 chars):", payload.substring(payload.length - 4));
}

testPix();
