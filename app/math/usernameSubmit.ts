import type { SubmitFunction } from "react-router";

export const MAX_TAGS = 100;

export const handleUsernameSubmit =
  (
    submit: SubmitFunction,
    pub: string | null,
    username: string | null,
    id: string | null
  ) =>
  async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pub || !id || !username) {
      console.error("Keys not initialized");
      return;
    }

    const formData = new FormData();
    formData.append("formKey", "updateUsername");
    formData.append("userId", id);
    formData.append("username", username);

    submit(formData, { method: "post", action: "/" });
  };
