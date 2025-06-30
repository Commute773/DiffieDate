import { DB } from "./db";

export const DBClient = new DB(
  (data: string) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("db", data);
      console.log("saving to local storage", data);
    } else {
      console.error("Local storage is not available in this environment.");
    }
  },
  () => {
    if (typeof window !== "undefined") {
      const data = window.localStorage.getItem("db");
      return data ? data : "{}";
    } else {
      console.error("Local storage is not available in this environment.");
      return "{}";
    }
  }
);
