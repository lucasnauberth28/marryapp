import { generatePixPayload } from "./src/lib/pix-utils";

function testPix() {
  console.log("=== TESTING EMV PIX WITH PHONE KEY 11967794744 ===");
  const payload = generatePixPayload({
    pixKey: "11967794744",
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
