const Router = {
  getCurrentPage() {
    const path = window.location.pathname;

    if (path.includes("dashboard")) return "dashboard";
    if (path.includes("documents")) return "documents";
    if (path.includes("inventory")) return "inventory";

    return "dashboard";
  }
};
