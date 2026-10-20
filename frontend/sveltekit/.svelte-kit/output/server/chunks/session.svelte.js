import "./api.js";
function readUser() {
  if (typeof localStorage === "undefined") return null;
  try {
    return JSON.parse(localStorage.getItem("pm.user") ?? "null");
  } catch {
    return null;
  }
}
const session = {
  user: readUser()
};
const cart = { subtotal: 0, items: [] };
export {
  cart as c,
  session as s
};
