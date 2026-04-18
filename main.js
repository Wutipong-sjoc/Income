function openTab(id) {
  document.querySelectorAll(".tab").forEach(t => {
    t.classList.remove("active");
  });
  document.getElementById(id).classList.add("active");
}

let wasm = null;
let ready = false;

// 🔥 โหลด WASM
Engine().then(m => {
  console.log("✅ WASM ready");

  m.myrun = m.cwrap("myrun", null, ["number","number","number"]);
  m.get_final = m.cwrap("get_final", "number", []);

  wasm = m;
  ready = true;
});

// ✅ print ลง textarea
function printToBox(msg) {
  const box = document.getElementById("outputBox");
  if (!box) return;

  box.value += msg + "\n";
  box.scrollTop = box.scrollHeight;
}

// ✅ log = console + หน้าเว็บ
function log(msg) {
  console.log(msg);
  printToBox(msg);
}

function convert() {
  // ✅ เคลียร์ก่อนเริ่ม
  const box = document.getElementById("outputBox");
  if (box) box.value = "";

  console.log("CLICKED");
  console.log("ready = " + ready);

  if (!ready) {
    alert("WASM ยังโหลดไม่เสร็จ ❗");
    return;
  }

  const files = document.getElementById("imgInput").files;
  if (!files.length) {
    alert("เลือกรูปก่อน");
    return;
  }

  let index = 0;

  function runNext() {
    if (index >= files.length) {
      console.log("✅ ทำครบทุกไฟล์แล้ว");
      return;
    }

    const file = files[index++];
    log(`📂 ${index}/${files.length} → ${file.name}`);

    const img = new Image();
    img.src = URL.createObjectURL(file);

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      const width = img.width;
      const height = img.height;

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0);

      const { data } = ctx.getImageData(0, 0, width, height);

      const binary = new Uint8Array(width * height);
      let j = 0;

      for (let i = 0; i < data.length; i += 4) {
        const gray = 0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2];
        binary[j++] = gray > 127 ? 255 : 0;
      }

      const ptr = wasm._malloc(binary.length);
      wasm.HEAPU8.set(binary, ptr);

      console.log("🚀 RUN PGM " + width + " " + height);
      wasm.myrun(ptr, width, height);

      const final = wasm.get_final();
      log("FINAL = " + final);

      wasm._free(ptr);
      URL.revokeObjectURL(img.src);

      runNext();
    };

    img.onerror = () => {
      log("❌ โหลดไม่ได้: " + file.name);
      runNext();
    };
  }

  runNext();
}

function convertdown() {
  const file = document.getElementById("imgInput").files[0];
  if (!file) return alert("เลือกรูปก่อน");

  const img = new Image();
  img.src = URL.createObjectURL(file);

  img.onload = () => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    const width = img.width;
    const height = img.height;

    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(img, 0, 0);

    const { data } = ctx.getImageData(0, 0, width, height);

    const header = `P5\n${width} ${height}\n255\n`;

    const pixels = new Uint8Array(width * height);

    let j = 0;
    for (let i = 0; i < data.length; i += 4) {
      const gray = 0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2];
      pixels[j++] = gray > 127 ? 255 : 0;
    }

    const blob = new Blob([header, pixels], {
      type: "application/octet-stream"
    });

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "output.pgm";
    a.click();
  };
}