// Main App Module
class App {
  static initialized = false;

  static startAuthenticatedApp() {
    if (this.initialized) return;
    this.initialized = true;

    window.Dashboard?.init?.();
    window.LessonPlanner?.init?.();
    window.Community?.init?.();
    window.Rewards?.init?.();
  }
}

window.App = App;
