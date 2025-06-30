export const NukeLocalStorage = () => {
  const handleNuke = () => {
    if (typeof window !== "undefined") {
      window.localStorage.clear();
      console.log("Local storage cleared");
      // Optionally, you can also reload the page to reflect changes
      window.location.reload();
    } else {
      console.error("Local storage is not available in this environment.");
    }
  };

  return (
    <button
      onClick={handleNuke}
      style={{ padding: "10px", backgroundColor: "red", color: "white" }}
    >
      Nuke Local Storage
    </button>
  );
};
