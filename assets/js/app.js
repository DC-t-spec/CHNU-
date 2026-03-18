console.log("CHNU app loaded");
document.addEventListener("DOMContentLoaded", () => {
  console.log("CHNU iniciado");

  const app = document.getElementById("app");

  const currentPage = Router.getCurrentPage();

  console.log("Página atual:", currentPage);

  renderPage(app, currentPage);
});

function renderPage(app, page) {
  switch (page) {
    case "dashboard":
      app.innerHTML = "<h1>Dashboard CHNU</h1>";
      break;

    case "documents":
      app.innerHTML = "<h1>Documents CHNU</h1>";
      break;

    case "inventory":
      app.innerHTML = "<h1>Inventory CHNU</h1>";
      break;

    default:
      app.innerHTML = "<h1>CHNU</h1>";
  }
}
