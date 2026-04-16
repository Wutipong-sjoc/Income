function openTab(id) {
  document.querySelectorAll(".tab").forEach(t => {
    t.classList.remove("active");
  });
  document.getElementById(id).classList.add("active");
}


// โหลด WASM
// AddModule().then(m => {
//     console.log("✅ WASM ready");

//     m.add = m.cwrap("add", "number", ["number", "number"]);
//     wasm = m;
// });

// // function ที่ปุ่มเรียก
// function test() {
//     if (!wasm) {
//         alert("ยังไม่พร้อม");
//         return;
//     }

//     const result = wasm.add(5, 7);
//     alert("ผล = " + result);
// }

// function convert() {
//   const file = document.getElementById("imgInput").files[0];
//   if (!file) return alert("เลือกรูปก่อน");

//   const img = new Image();
//   img.src = URL.createObjectURL(file);

//   img.onload = () => {
//     const canvas = document.createElement("canvas");
//     const ctx = canvas.getContext("2d");

//     const width = img.width;
//     const height = img.height;

//     canvas.width = width;
//     canvas.height = height;
//     ctx.drawImage(img, 0, 0);

//     const { data } = ctx.getImageData(0, 0, width, height);

//     // 🔥 header (P5)
//     const header = `P5\n${width} ${height}\n255\n`;

//     // 🔥 pixel จริง
//     const pixels = new Uint8Array(width * height);

//     let j = 0;
//     for (let i = 0; i < data.length; i += 4) {
//       const gray = 0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2];
//       pixels[j++] = gray > 127 ? 255 : 0;
//     }

//     // 🔥 รวม header + binary
//     const blob = new Blob([
//       header,
//       pixels
//     ], { type: "application/octet-stream" });

//     const a = document.createElement("a");
//     a.href = URL.createObjectURL(blob);
//     a.download = "output.pgm";
//     a.click();
//   };
// }

let wasm = null;
let ready = false;

// 🔥 โหลด WASM
Engine().then(m => {
  console.log("✅ WASM ready");

  m.myrun = m.cwrap("myrun", null, ["number","number","number"]);
  m.get_final = m.cwrap("get_final", "number", []);

  wasm = m;
  ready = true;

  console.log("malloc =", wasm._malloc);
});


//🔥 แปลงรูป + ส่งเข้า WASM
function convert() {
  
  console.log("CLICKED");
  console.log("ready =", ready);

  if (!ready) {
    alert("WASM ยังโหลดไม่เสร็จ ❗");
    return;
  }

  const file = document.getElementById("imgInput").files[0];
  if (!file) {
    alert("เลือกรูปก่อน");
    return;
  }

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

    // 🔥 แปลงเป็น binary (0 / 255)
    const binary = new Uint8Array(width * height);

    let j = 0;
    for (let i = 0; i < data.length; i += 4) {
      const gray = 0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2];
      binary[j++] = gray > 127 ? 255 : 0;
    }

    // 🔥 malloc
    const ptr = wasm._malloc(binary.length);

    // 🔥 copy เข้า WASM memory
    wasm.HEAPU8.set(binary, ptr);

    console.log("🚀 RUN");

    // 🔥 run C++
    wasm.myrun(ptr, width, height);

    // 🔥 เอาผลลัพธ์
    const final = wasm.get_final();
    console.log("FINAL =", final);

    // 🔥 free memory
    wasm._free(ptr);
  };
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

    // 🔥 header (P5)
    const header = `P5\n${width} ${height}\n255\n`;

    // 🔥 pixel จริง
    const pixels = new Uint8Array(width * height);

    let j = 0;
    for (let i = 0; i < data.length; i += 4) {
      const gray = 0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2];
      pixels[j++] = gray > 127 ? 255 : 0;
    }

    // 🔥 รวม header + binary
    const blob = new Blob([
      header,
      pixels
    ], { type: "application/octet-stream" });

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "output.pgm";
    a.click();
  };
}

function download(text, filename) {
  const blob = new Blob([text], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}