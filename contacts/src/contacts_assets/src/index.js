import { contacts } from "../../declarations/contacts";

document.getElementById("clickMeBtn").addEventListener("click", async () => {
  const name = document.getElementById("name").value.toString();
  // Interact with contacts actor, calling the greet method
  const greeting = await contacts.greet(name);

  document.getElementById("greeting").innerText = greeting;
});
