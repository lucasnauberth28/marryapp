import { generatePixPayload } from "./src/lib/pix-utils";

console.log("=== VARIATION 1: Phone with +55 ===");
console.log(generatePixPayload({ pixKey: "+5511967794744", merchantName: "LUCAS E GIOVANNA", merchantCity: "SAO PAULO", amount: 3000 }));

console.log("\n=== VARIATION 2: Phone plain 11967794744 ===");
console.log(generatePixPayload({ pixKey: "11967794744", merchantName: "LUCAS E GIOVANNA", merchantCity: "SAO PAULO", amount: 3000 }));

console.log("\n=== VARIATION 3: Email lucasnauberth@gmail.com ===");
console.log(generatePixPayload({ pixKey: "lucasnauberth@gmail.com", merchantName: "LUCAS E GIOVANNA", merchantCity: "SAO PAULO", amount: 3000 }));
