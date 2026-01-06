import bcrypt from "bcrypt";

const hash = await bcrypt.hash("1234", 10);
console.log(hash);