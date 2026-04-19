function openTab(id) {
  document.querySelectorAll(".tab").forEach(t => {
    t.classList.remove("active");
  });
  document.getElementById(id).classList.add("active");
}

let wasm = null;
let ready = false;

// โหลด WASM
Engine().then(m => {
  console.log("WASM ready");

  m.myrun = m.cwrap("myrun", null, ["number","number","number"]);
  m.get_final = m.cwrap("get_final", "number", []);

  wasm = m;
  ready = true;
});

// log ลง textarea
function log(msg) {
  console.log(msg);
  const box = document.getElementById("outputBox");
  if (box) {
    box.value += msg + "\n";
    box.scrollTop = box.scrollHeight;
  }
}

// 🔥 สร้าง row (ราคา editable)
function addRow(price, product) {
  const container = document.getElementById("slipContainer");

  const row = document.createElement("div");
  row.style.display = "flex";
  row.style.gap = "10px";
  row.style.marginTop = "10px";

  row.innerHTML = `
    <div style="flex:1; background:#1e5f7a; color:white; padding:10px;">
      ราคา<br>
      <input type="number" class="price" value="${price}" step="0.01">
    </div>

    <div style="flex:1; background:#1e5f7a; color:white; padding:10px;">
      สินค้า<br>
      <select class="product">
        <option ${product==="กาแฟ"?"selected":""}>กาแฟ</option>
        <option ${product==="น้ำ"?"selected":""}>น้ำ</option>
        <option ${product==="ขนม"?"selected":""}>ขนม</option>
      </select>
    </div>

    <div style="flex:1; background:#1e5f7a; color:white; padding:10px;">
      ต้นทุน<br>
      <input type="number" class="cost" placeholder="ใส่ต้นทุน">
    </div>
  `;

  container.appendChild(row);
}

// 🔥 ดึงข้อมูลทั้งหมด
function getAllData() {
  const rows = document.querySelectorAll("#slipContainer > div");

  let data = [];

  rows.forEach(row => {
    const price = row.querySelector(".price").value;
    const product = row.querySelector(".product").value;
    const cost = row.querySelector(".cost").value;

    data.push({
      date: document.getElementById("dateInput")?.value || "",
      price: Number(price),
      product: product,
      cost: Number(cost || 0)
    });
  });

  return data;
}

// 🔥 save
function saveData() {
  const data = getAllData();
  console.log("DATA =", data);
  alert("บันทึกแล้ว (ดู console)");
}

// 🔥 convert (หลายรูป)
function convert() {

  // clear
  const box = document.getElementById("outputBox");
  if (box) box.value = "";
  document.getElementById("slipContainer").innerHTML = "";

  if (!ready) {
    alert("WASM ยังโหลดไม่เสร็จ");
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
      log("ทำครบทุกไฟล์แล้ว");
      return;
    }

    const file = files[index++];
    log("ไฟล์: " + file.name);

    const img = new Image();
    img.src = URL.createObjectURL(file);

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const { data } = ctx.getImageData(0, 0, img.width, img.height);

      const binary = new Uint8Array(img.width * img.height);
      let j = 0;

      for (let i = 0; i < data.length; i += 4) {
        const gray = 0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2];
        binary[j++] = gray > 127 ? 255 : 0;
      }

      const ptr = wasm._malloc(binary.length);
      wasm.HEAPU8.set(binary, ptr);

      wasm.myrun(ptr, img.width, img.height);

      const final = wasm.get_final();
      log("ค่า = " + final);

      // detect
      let product = "กาแฟ";
      if (final >= 0.1 && final < 0.2) product = "น้ำ";
      else if (final >= 0.2) product = "ขนม";

      const price = (final).toFixed(2);

      addRow(price, product);

      wasm._free(ptr);
      URL.revokeObjectURL(img.src);

      runNext();
    };

    img.onerror = () => {
      log("โหลดไม่ได้: " + file.name);
      runNext();
    };
  }

  runNext();
}

// 🔥 default วันที่เป็นวันนี้
window.onload = function() {
  const today = new Date().toISOString().split("T")[0];
  const dateInput = document.getElementById("dateInput");
  if (dateInput) dateInput.value = today;
};

// 🔥 download PGM
function convertdown() {
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