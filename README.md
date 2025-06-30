

# GarbleDate

A playful demo of how mutual interest can be privately and securely expressed using garbled circuits and elliptic curve cryptography—without a central authority learning who likes who.

This app is not a real dating app. It’s a math toy disguised as one.

---

## ✨ What It Does

Each user selects categories of interaction they’d be open to with others—e.g., “fight,” “date,” “co-op video game,” “have a child with.” Then they can express a private like (or not-like) for another user in any category. The twist:

* Likes are *cryptographically encoded* using garbled circuits.
* You only learn that someone liked you **if you also liked them back**.
* The server remains oblivious to the content of all preferences.

---

## 🔐 Core Idea

We use a **single garbled AND gate** to represent mutual liking:

```
A Likes B = a ∈ {0,1}
B Likes A = b ∈ {0,1}
Output = a AND b
```

This simple function allows us to compute mutual interest privately.

---

## 💡 Garbled Circuit Primer

The garbled circuit is a 2-input, 1-output AND gate, where:

* Each input wire (A, B) has two random *labels* (e.g., A0/A1).
* Each output wire has two labels (R0/R1), also random.
* The gate is garbled into 4 ciphertexts, one for each input pair (A0B0, A0B1, A1B0, A1B1), each decrypting to the correct output label.

Only the party with both correct input labels can decrypt one of the ciphertexts and obtain the correct output label.

---

## 🔁 Protocol Flow

**Step 1: Key Exchange (ECDH)**
Each user generates a persistent ECDSA keypair for each category.

* Public: Shared during registration.
* Private: Stored locally only.

**Step 2: Like Initialization (Alice → Bob)**

* Alice derives a shared secret `S` via ECDH.
* She deterministically derives:

  * Bob’s input wire labels: `B0`, `B1`
  * Output labels: `R0`, `R1`
* She creates a fresh garbled AND gate with these fixed labels.
* She selects her input label (`A0` or `A1`) based on whether she likes Bob.
* She sends the garbled table, her input label, and the output labels to the server.

**Step 3: Like Response (Bob → Server)**

* If Bob decides to respond, he:

  * Derives the same shared secret `S` from his private key and Alice’s public key.
  * Derives the same `B0` and `B1`.
  * Chooses the correct one based on whether he likes Alice.
  * Sends his input label (`B0` or `B1`) to the server.

**Step 4: Server Evaluation**

* Server now holds:

  * Garbled table
  * `aInputLabel` (from Alice)
  * `bInputLabel` (from Bob)

But the server:

* Can’t tell what bit either input represents
* Can’t decrypt the table
* Just *relays* the result label back to the client

**Step 5: Match Detection (Client)**

* The client who receives the result label compares it against `R0` and `R1`.
* If it matches `R1`, it means both parties liked each other (1 & 1 = 1).

---

## 🧮 Math Summary

* **Key exchange:**
  `S = ECDH(privA, pubB) = privA × pubB = privB × pubA`

* **Label derivation (HKDF):**
  `B0 = HKDF(S, "B0")`,
  `B1 = HKDF(S, "B1")`,
  `R0 = HKDF(S, "R0")`,
  `R1 = HKDF(S, "R1")`

* **Garbled row encryption:**
  Each row:
  `C = AES-GCM(key = A ⊕ B, value = R)`
  (in real schemes, you’d use a KDF or HMAC instead of XOR)

---

## 🤖 Server Blindness

The server never learns:

* Who liked whom (beyond from/to metadata)
* What the actual like value was (0 or 1)
* Whether a match occurred
* The meaning of any wire label

This ensures full privacy unless both parties like each other.

---

## 📦 Storage

* `users`: Stores public keys and usernames.
* `garbledLikes`: Each like attempt, including the garbled table, input labels, and output labels.

Everything sensitive is stored in base64-encoded JSON blobs, never revealing actual preference bits.

---

## 🧪 Test Coverage

See `app/protocol.test.ts` for:

* Mutual match success
* Mismatch failure
* Label indistinguishability
* Consistent structure for all messages

---

## 🛠️ Tech Stack

* **React Router v7** (server-side rendered)
* **Tailwind CSS** for UI
* **@noble/curves** for ECDH
* **WebCrypto (AES-GCM)** for encryption
* **LocalStorage / fs** for persistent storage
* **Remix-style loader/actions** for request handling

---
