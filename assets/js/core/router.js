const Router = {
  getCurrentPage() {
    const hash = window.location.hash.replace("#", "");

    if (!hash) return "dashboard";

    if (hash === "dashboard") return "dashboard";
    if (hash === "documents") return "documents";
    if (hash === "inventory") return "inventory";

    return "dashboard";
  }
};
