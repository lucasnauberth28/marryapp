import { getPhoneVariations } from "./src/lib/guest-matching";
import { generatePixPayload } from "./src/lib/pix-utils";

function testMatching() {
  console.log("=== 1. TESTING PHONE VARIATIONS ALGORITHM ===");
  const test1 = getPhoneVariations("(11) 95730-5051");
  console.log("Variations for (11) 95730-5051:", test1);

  const test2 = getPhoneVariations("5511957305051");
  console.log("Variations for 5511957305051:", test2);

  const test3 = getPhoneVariations("1157305051");
  console.log("Variations for 1157305051 (without 9):", test3);
}

function testPix() {
  console.log("\n=== 2. TESTING EMV PIX PAYLOAD GENERATOR ===");
  const payload = generatePixPayload({
    pixKey: "lucasnauberth28@gmail.com",
    merchantName: "Lucas e Giovanna",
    merchantCity: "Sao Paulo",
    amount: 15000, // R$ 150,00
    description: "Jantar Romantico",
  });

  console.log("Generated EMV BR Code:", payload);
  console.log("Payload length:", payload.length);
  console.log("CRC16 Checksum (last 4 chars):", payload.substring(payload.length - 4));
}

testMatching();
testPix();
