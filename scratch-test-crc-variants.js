function crc16ccittFalse(str) {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    crc ^= code << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return (crc & 0xffff).toString(16).toUpperCase().padStart(4, "0");
}

const payload = "00020126360014br.gov.bcb.pix0114+5511967794744520400005303986540530.005802BR5916LUCAS E GIOVANNA6009SAO PAULO62070503***6304";
console.log("CRC16 CCITT FALSE:", crc16ccittFalse(payload));
