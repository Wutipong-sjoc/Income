function openTab(id) {
  document.querySelectorAll(".tab").forEach(t => {
    t.classList.remove("active");
  });
  document.getElementById(id).classList.add("active");
}

function testWasm() {
  if (!window.wasm) {
    alert("WASM ยังไม่พร้อม");
    return;
  }

  alert("10 + 20 = " + window.wasm.add(10, 20));
}