import { generatePixPayload } from "./src/lib/pix-utils";

function buildPix(pixKey: string, txIdVal: string) {
  function formatEMVField(id: string, value: string): string {
    const len = value.length.toString().padStart(2, "0");
    return `${id}${len}${value}`;
  }

  function calculateCRC16(payload: string): string {
    let crc = 0xffff;
    const polynomial = 0x1021;
    for (let i = 0; i < payload.length; i++) {
      const b = payload.charCodeAt(i);
      for (let j = 0; j < 8; j++) {
        const bit = ((b >> (7 - j)) & 1) === 1;
        const c15 = ((crc >> 15) & 1) === 1;
        crc <<= 1;
        if (c15 !== bit) {
          crc ^= polynomial;
        }
      }
    }
    crc &= 0xffff;
    return crc.toString(16).toUpperCase().padStart(4, "0");
  }

  let payload = formatEMVField("00", "01");
  const gui = formatEMVField("00", "br.gov.bcb.pix");
  const key = formatEMVField("01", pixKey);
  payload += formatEMVField("26", `${gui}${key}`);
  payload += formatEMVField("52", "0000");
  payload += formatEMVField("53", "986");
  payload += formatEMVField("54", "30.00");
  payload += formatEMVField("58", "BR");
  payload += formatEMVField("59", "LUCAS E GIOVANNA");
  payload += formatEMVField("60", "SAO PAULO");
  
  if (txIdVal) {
    const txIdField = formatEMVField("05", txIdVal);
    payload += formatEMVField("62", txIdField);
  }

  payload += "6304";
  const crc = calculateCRC16(payload);
  return payload + crc;
}

console.log("=== VAR A (+55, TxID '*'): ===");
console.log(buildPix("+5511967794744", "*"));

console.log("\n=== VAR B (+55, TxID '***'): ===");
console.log(buildPix("+5511967794744", "***"));

console.log("\n=== VAR C (+55, TxID 'MARRYAPP'): ===");
console.log(buildPix("+5511967794744", "MARRYAPP"));

console.log("\n=== VAR D (Plain 11967794744, TxID '***'): ===");
console.log(buildPix("11967794744", "***"));
