function App() {
  // TODO: Toggle this state when user opens contact details panel
  const showRightPanel = false;

  return (
    <div className={`app-grid ${showRightPanel ? "with-right-panel" : ""}`}>
      {/* Left Menu Column - Fixed 64px */}
      <div className="bg-sidebar border-r border-sidebar-border">
        {/* Menu component goes here */}
        Menu
      </div>

      {/* Chat List Panel - 300-400px */}
      <div className="bg-background border-r border-border overflow-hidden">
        {/* Chat list content goes here */}
        Chat List
      </div>

      {/* Main Chat Panel - Takes remaining space */}
      <div className="bg-chat overflow-hidden">
        {/* Chat content goes here */}
        Main Chat
      </div>

      {/* Right Panel (Contact Details) - Conditional */}
      {showRightPanel && (
        <div className="bg-background border-l border-border overflow-hidden">
          {/* Contact details go here */}
          Contact Details
        </div>
      )}
    </div>
  );
}

export default App;
