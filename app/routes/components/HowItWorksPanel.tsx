import Latex from "react-latex-next";
import "katex/dist/katex.min.css";

export function HowItWorksPanel() {
  return (
    <section className="mb-12 p-4 rounded-xl shadow max-w-2xl mx-auto">
      <h2 className="text-lg font-semibold mb-4">
        How This App Works (Crypto Overview)
      </h2>
      <div className="prose prose-neutral prose-lg max-w-none">
        <p>
          <b>Goal:</b> Securely match pairs of users who "like" each other,
          without revealing likes to the server or non-mutual parties.
        </p>

        <div className="my-6">
          <b>1. Key Generation</b>
          <p>
            Each user generates a <b>private key</b> <Latex>$s$</Latex> and
            corresponding <b>public key</b> <br /> <br />
            <Latex>$P = g^s$</Latex> (using secp256k1).
            <br />
            <br />
            User ID is <Latex>{"$\\mathrm{sha256}(P)$"}</Latex>.
          </p>
        </div>

        <div className="my-6">
          <b>2. Self Token</b>
          <p>
            Each user computes a <b>self token</b>:
            <br />
            <Latex>{`$$S = H(P)^s$$`}</Latex>
            where <Latex>$H$</Latex> is a hash-to-curve function.
          </p>
        </div>

        <div className="my-6">
          <b>3. Liking Another User</b>
          <p>
            To "like" user B, user A computes the <b>like token</b>:
            <br />
            <Latex>{`$$L_{A \\to B} = P_B^{s_A}$$`}</Latex>
            <br />
            This is a Diffie-Hellman shared secret point:
            <br />
            <Latex>{`$$g^{s_A s_B}$$`}</Latex>
            (but as a curve point).
            <br />
            User A creates an encrypted payload (with category etc), using:
            <br />
            <Latex>{`$$K = \\mathrm{sha256}(L_{A \\to B})$$`}</Latex>
            as the AES-GCM key, and uploads <b>(token, cipher, iv)</b> to the
            server.
          </p>
        </div>

        <div className="my-6">
          <b>4. Mutual Match</b>
          <p>
            If both users like each other, the server detects two ciphers for
            the same token:
            <br />
            <Latex>{`$$L = L_{A \\to B} = L_{B \\to A}$$`}</Latex>
            (symmetry of DH).
            <br />
            Both parties can now use <Latex>$K$</Latex> to decrypt the other's
            payload, learning each other's user ID and category{" "}
            <b>only if the match is mutual</b>.
          </p>
        </div>

        <div className="my-6">
          <b>5. Payload Padding & Robust Validation</b>
          <ul>
            <li>
              Each payload is encoded as a fixed-length byte array (currently{" "}
              <Latex>{`${"192"}`}</Latex> bytes) and padded as needed for
              uniformity and resistance to traffic analysis.
            </li>
            <li>
              On decryption, <b>all parsing and validation</b> is done inside a
              try/catch: <br />
              – the payload is decoded as UTF-8, <br />
              – parsed as JSON, <br />– and checked for{" "}
              <Latex>{"$\\texttt{version} = 1$"}</Latex>.
            </li>
            <li>
              <b>Any</b> tampering, corruption, or version mismatch causes a
              thrown error and immediate rejection—ensuring the protocol never
              silently accepts garbage or malicious data.
            </li>
            <li>
              This hard failure property is standard in robust cryptographic
              protocols and prevents logic errors, downgrade attacks, and
              confusion from unexpected input.
            </li>
          </ul>
        </div>

        <div className="my-6">
          <b>6. Privacy Properties</b>
          <ul>
            <li>
              The server never learns private keys, match choices, or message
              content.
            </li>
            <li>
              Non-mutual likes remain confidential: only a successful DH
              handshake reveals any info.
            </li>
            <li>
              The like token is unlinkable to public keys by inspection and
              cannot be brute-forced unless the private key is compromised.
            </li>
            <li>
              <b>All payloads are validated and authenticated implicitly:</b>{" "}
              incorrect or tampered payloads always result in a hard error.
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
