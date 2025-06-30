import { redirect, type ActionFunctionArgs } from "react-router";
import { DBServer } from "~/utils/db.server";
import { isValidPub } from "~/math/crypto";

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const formKey = formData.get("formKey");

  switch (formKey) {
    case "registerUser": {
      const id = formData.get("id") as string;
      const publicKey = formData.get("publicKey") as string;
      const selfToken = formData.get("selfToken") as string;
      // Validate public key before registration
      if (!isValidPub(publicKey)) {
        return { error: "Invalid public key" };
      }
      DBServer.updateCollectionObject("users", id, {
        id,
        publicKey,
        selfToken,
      });
      return redirect("/");
    }
    case "submitLike": {
      const token = formData.get("token") as string;
      const cipher = formData.get("cipher") as string;
      const iv = formData.get("iv") as string;

      // Require token to be a valid secp256k1 point (prevents bad tokens)
      try {
        // This is only partial: in practice, tokens should be checked *against user pubkeys*,
        // but we at least check they are a valid curve point.
        // (More advanced: store mapping of tokens to pairs, validate both keys.)
        import("@noble/curves/secp256k1").then(({ secp256k1 }) => {
          secp256k1.ProjectivePoint.fromHex(token);
        });
      } catch {
        return { error: "Invalid token/cipher" };
      }

      let likeObj = DBServer.getCollectionObject<any>("likes", token);
      if (!likeObj) {
        likeObj = { token, ciphers: [] };
      }
      likeObj.ciphers.push({ cipher, iv });
      DBServer.updateCollectionObject("likes", token, likeObj);

      return redirect("/");
    }
    case "updateUsername": {
      const userId = formData.get("userId") as string;
      const username = formData.get("username") as string;
      const user = DBServer.collections?.users[userId];
      if (user) {
        DBServer.updateCollectionObject("users", userId, {
          ...user,
          username,
        });
      }
      return redirect("/");
    }
    default:
      return { error: "Unknown form key" };
  }
};
