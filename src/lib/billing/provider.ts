import "server-only";
import { workflow } from "./store";
import { authorize } from "./oblio";
export async function providerToken() {
  const c = await workflow<{ email: string; secret: string }>("credentials");
  return authorize(c.email, c.secret);
}
