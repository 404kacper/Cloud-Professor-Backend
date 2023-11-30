const crypto = require("crypto");

module.exports = {
  generateKeyPair,
  encryptPrivateKey
};

async function generateKeyPair() {
    return new Promise((resolve, reject) => {
      crypto.generateKeyPair(
        "rsa",
        {
          modulusLength: 2048, // length in bits
          publicKeyEncoding: {
            type: "pkcs1", // Public Key Cryptography Standards 1
            format: "pem", // Most common formatting choice
          },
          privateKeyEncoding: {
            type: "pkcs1",
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
    // Generate a secure, random initialization vector
    const iv = crypto.randomBytes(16);

    // Generate a cipher key from the password
    const key = crypto.scryptSync(password, "salt", 32);

    // Create a cipher instance using aes-256-cbc algorithm
    const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);

    // Encrypt the private key
    let encrypted = cipher.update(privateKey, "utf8", "hex");
    encrypted += cipher.final("hex");

    // Return the encrypted data along with the IV
    return { encrypted, iv: iv.toString("hex") };
  }