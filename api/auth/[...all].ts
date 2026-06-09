import { auth } from "../../src/lib/auth";
import { toHandler } from "better-auth/api";

export const config = {
  runtime: "edge",
};

export default toHandler(auth);
