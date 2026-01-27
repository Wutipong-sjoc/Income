function openTab(id) {
  document.querySelectorAll(".tab").forEach(t => {
    t.classList.remove("active");
  });

  document.getElementById(id).classList.add("active");

  if (id === "add" && window.wasm) {
    console.log("WASM พร้อมใช้งานในแท็บ add");
  }
}