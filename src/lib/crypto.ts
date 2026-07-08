// E2E Encryption using Web Crypto API + IndexedDB for private key storage

const DB_NAME = "bruchat-keys";
const STORE_NAME = "private-keys";
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME, { keyPath: "userId" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function storePrivateKey(userId: string, key: CryptoKey): Promise<void> {
  const db = await openDB();
  const exported = await crypto.subtle.exportKey("pkcs8", key);
  const tx = db.transaction(STORE_NAME, "readwrite");
  tx.objectStore(STORE_NAME).put({ userId, key: new Uint8Array(exported) });
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getPrivateKey(userId: string): Promise<CryptoKey | null> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readonly");
  const req = tx.objectStore(STORE_NAME).get(userId);
  return new Promise((resolve) => {
    req.onsuccess = async () => {
      if (!req.result) { resolve(null); return; }
      try {
        const key = await crypto.subtle.importKey(
          "pkcs8",
          req.result.key.buffer,
          { name: "RSA-OAEP", hash: "SHA-256" },
          false,
          ["decrypt"]
        );
        resolve(key);
      } catch {
        resolve(null);
      }
    };
    req.onerror = () => resolve(null);
  });
}

export async function generateKeyPair(): Promise<{ publicKeyPem: string; privateKey: CryptoKey }> {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"]
  );
  const pubExported = await crypto.subtle.exportKey("spki", keyPair.publicKey);
  const pubBase64 = btoa(String.fromCharCode(...new Uint8Array(pubExported)));
  return { publicKeyPem: pubBase64, privateKey: keyPair.privateKey };
}

export async function encryptMessage(content: string, recipientPublicKeyPem: string): Promise<string> {
  try {
    const pubKeyBuf = Uint8Array.from(atob(recipientPublicKeyPem), c => c.charCodeAt(0));
    const pubKey = await crypto.subtle.importKey(
      "spki",
      pubKeyBuf.buffer,
      { name: "RSA-OAEP", hash: "SHA-256" },
      false,
      ["encrypt"]
    );
    const encoded = new TextEncoder().encode(content);
    // RSA-OAEP can only encrypt small data, so we use AES hybrid
    const aesKey = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encryptedContent = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, aesKey, encoded);
    const rawAesKey = await crypto.subtle.exportKey("raw", aesKey);
    const encryptedAesKey = await crypto.subtle.encrypt({ name: "RSA-OAEP" }, pubKey, rawAesKey);
    // Pack: [iv(12)] + [encAesKeyLen(4)] + [encAesKey] + [encContent]
    const encAesKeyArr = new Uint8Array(encryptedAesKey);
    const lenBuf = new Uint8Array(4);
    new DataView(lenBuf.buffer).setUint32(0, encAesKeyArr.length);
    const result = new Uint8Array(12 + 4 + encAesKeyArr.length + new Uint8Array(encryptedContent).length);
    result.set(iv, 0);
    result.set(lenBuf, 12);
    result.set(encAesKeyArr, 16);
    result.set(new Uint8Array(encryptedContent), 16 + encAesKeyArr.length);
    return btoa(String.fromCharCode(...result));
  } catch {
    return content; // Fallback to plaintext if encryption fails
  }
}

export async function decryptMessage(encryptedBase64: string, privateKey: CryptoKey): Promise<string> {
  try {
    const data = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
    const iv = data.slice(0, 12);
    const encAesKeyLen = new DataView(data.buffer, data.byteOffset).getUint32(12);
    const encAesKey = data.slice(16, 16 + encAesKeyLen);
    const encContent = data.slice(16 + encAesKeyLen);
    const rawAesKey = await crypto.subtle.decrypt({ name: "RSA-OAEP" }, privateKey, encAesKey);
    const aesKey = await crypto.subtle.importKey("raw", rawAesKey, { name: "AES-GCM" }, false, ["decrypt"]);
    const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, aesKey, encContent);
    return new TextDecoder().decode(decrypted);
  } catch {
    return encryptedBase64; // Return as-is if decryption fails
  }
}

export async function hasPrivateKey(userId: string): Promise<boolean> {
  const key = await getPrivateKey(userId);
  return key !== null;
}
