const crypto = require("crypto");

module.exports = {
  generateKeyPair,
  encryptPrivateKey,
};

async function generateKeyPair() {
  return new Promise((resolve, reject) => {
    crypto.generateKeyPair(
      "rsa",
      {
        modulusLength: 2048, // length in bits - standard for RSA keys
        publicKeyEncoding: {
          type: "spki", // Matching format for use with web crypto api
          format: "pem", // Most common formatting choice
        },
        privateKeyEncoding: {
          type: "pkcs8",
          format: "pem",
        },
      },
      (err, publicKey, privateKey) => {
        if (err) {
          reject(err);
        } else {
          resolve({ publicKey, privateKey });
        }
      }
    );
  });
}

function encryptPrivateKey(privateKey, password) {
  return new Promise((resolve, reject) => {
    const iv = crypto.randomBytes(16);
    const salt = Buffer.from("salt");

    crypto.pbkdf2(password, salt, 100000, 32, "sha256", (err, derivedKey) => {
      if (err) {
        reject(err);
      } else {
        const key = derivedKey;
        const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
        let encrypted = cipher.update(privateKey, "utf8", "hex");
        encrypted += cipher.final("hex");

        resolve({ encrypted, iv: iv.toString("hex") });
      }
    });
  });
}
