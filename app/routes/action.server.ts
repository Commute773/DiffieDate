import { redirect, type ActionFunctionArgs } from "react-router";
import { serverRegister } from "~/actions/register.server";
import { serverLike } from "~/actions/like.server";

/**
 * Handles incoming form actions: "register" and "like".
 */
const sleep = async (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const action = formData.get("action") as string;

  switch (action) {
    case "register": {
      await serverRegister(JSON.parse(formData.get("payload") as string));
      await sleep(1000); // Simulate a delay for UI feedback
      break;
    }
    case "like": {
      await serverLike(JSON.parse(formData.get("payload") as string));
      break;
    }
    default:
      return { error: "Unknown action" };
  }

  return redirect("/");
};
