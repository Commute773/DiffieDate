import { useCallback, useState } from "react";
import { CATEGORIES } from "~/utils/constants";
import {
  generateAllLocalCryptos,
  getPublicCrypto,
  saveLocalCryptos,
} from "~/hooks/useLocalCrypto";
import type { RegisterPayload } from "~/actions/register";

export const RegisterForm = ({
  register,
}: {
  register: (registrations: RegisterPayload) => Promise<void>;
}) => {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (username) {
        setLoading(true);
        // Generate crypto for each category, save locally and register all
        const cryptos = generateAllLocalCryptos(username);
        saveLocalCryptos(cryptos);
        const registrations = CATEGORIES.map((category) => ({
          id: cryptos[category].myUserId,
          username,
          publicCrypto: getPublicCrypto(cryptos[category]),
          category,
        }));
        await register(registrations);
        setLoading(false);
      }
    },
    [username, register]
  );

  return (
    <form onSubmit={handleSubmit}>
      <h2>Register</h2>
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Enter your username"
        required
      />
      <button type="submit" disabled={loading || !username.trim()}>
        {"Register" + (loading ? "ing..." : "")}
      </button>
    </form>
  );
};
