// 🔥 Firebase import
// 🔥 Firebase import
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-app.js";
import { 
  getFirestore, collection, addDoc 
} from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";

import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js";

// 🔥 config
const firebaseConfig = {
  apiKey: "AIzaSyCgray3WkxNhzphkj-00tA_viq_1_tToPo",
  authDomain: "income-e90fe.firebaseapp.com",
  projectId: "income-e90fe",
  storageBucket: "income-e90fe.firebasestorage.app",
  messagingSenderId: "462986865238",
  appId: "1:462986865238:web:3e9ac407ed2e2bb9f029f7"
};

// 🔥 init
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// 🔥 UI helper
function setUserStatus(text) {
  const top = document.getElementById("userStatus");
  const side = document.getElementById("sidebarUser");

  if (top) top.innerText = text;
  if (side) side.innerText = text;
}

// 🔥 Auth state
onAuthStateChanged(auth, (user) => {
  const loginBtn = document.querySelector('button[onclick="login()"]');
  const logoutBtn = document.querySelector('button[onclick="logout()"]');

  if (user) {
    setUserStatus("👤 " + user.email);
    if (loginBtn) loginBtn.style.display = "none";
    if (logoutBtn) logoutBtn.style.display = "block";
  } else {
    setUserStatus("❌ ยังไม่ login");
    if (loginBtn) loginBtn.style.display = "block";
    if (logoutBtn) logoutBtn.style.display = "none";
  }
});

// 🔥 Register
window.register = async function () {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    await createUserWithEmailAndPassword(auth, email, password);
    alert("สมัครสำเร็จ");
  } catch (e) {
    alert(e.message);
  }
};

// 🔥 Login
window.login = async function () {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    await signInWithEmailAndPassword(auth, email, password);

    // ✅ เคลียร์ input
    document.getElementById("email").value = "";
    document.getElementById("password").value = "";

    // ✅ ไปหน้า Home
    openTab("home");

  } catch (err) {
    alert(err.message);
  }
};

// 🔥 Logout
window.logout = async function () {
  await signOut(auth);
  alert("logout แล้ว");
};

// 🔥 Tab
window.openTab = function(id) {
  document.querySelectorAll(".tab").forEach(t => {
    t.classList.remove("active");
  });
  document.getElementById(id).classList.add("active");
};


// 🔥 WASM
let wasm = null;
let ready = false;

Engine().then(m => {
  console.log("WASM ready");

  m.myrun = m.cwrap("myrun", null, ["number","number","number"]);
  m.get_final = m.cwrap("get_final", "number", []);

  wasm = m;
  ready = true;
});


// 🔥 add row
function addRow(price, product, filename) {
  const container = document.getElementById("slipContainer");

  const wrapper = document.createElement("div");
  wrapper.style.marginTop = "15px";

  wrapper.innerHTML = `
    <div style="display:flex; gap:8px;">

      <div style="flex:1; background:#1e5f7a; color:white; padding:10px; text-align:center;">
        <div style="font-size:12px;">${filename}</div>
        ราคา<br>
        <input type="number" class="price" value="${price}" step="0.01">
      </div>

      <div style="flex:1; background:#1e5f7a; color:white; padding:10px; text-align:center;">
        สินค้า<br>
        <select class="product">
          <option ${product==="กาแฟ"?"selected":""}>กาแฟ</option>
          <option ${product==="น้ำ"?"selected":""}>น้ำ</option>
          <option ${product==="ขนม"?"selected":""}>ขนม</option>
        </select>
      </div>

      <div style="flex:1; background:#1e5f7a; color:white; padding:10px; text-align:center;">
        ต้นทุน<br>
        <input type="number" class="cost" placeholder="ใส่ต้นทุน">
      </div>

      <button onclick="this.parentElement.parentElement.remove()">❌</button>
    </div>
  `;

  container.appendChild(wrapper);
}

// 🔥 get data
function getAllData() {
  const rows = document.querySelectorAll("#slipContainer > div");

  let data = [];

  rows.forEach(row => {
    const price = row.querySelector(".price")?.value || 0;
    const product = row.querySelector(".product")?.value || "";
    const cost = row.querySelector(".cost")?.value || 0;

    data.push({
      price: Number(price),
      product: product,
      cost: Number(cost),
    });
  });

  return data;
}

// 🔥 SAVE
window.saveData = async function () {

  if (!auth.currentUser) {
    alert("กรุณา login ก่อน");
    return;
  }

  const data = getAllData();
  const date = document.getElementById("dateInput").value;

  if (!date) return alert("เลือกวันที่ก่อน");
  if (data.length === 0) return alert("ไม่มีข้อมูล");

  try {
    for (let item of data) {
      await addDoc(
        collection(db, "slips", date, "items"),
        {
          price: item.price,
          product: item.product,
          cost: item.cost,
          userId: auth.currentUser.uid,
          email: auth.currentUser.email
        }
      );
    }

    alert("บันทึกสำเร็จ");
  } catch (e) {
    console.error(e);
    alert("error: " + e.message);
  }
};

// 🔥 convert
window.convert = function () {
  return new Promise((resolve) => {

    document.getElementById("slipContainer").innerHTML = "";

    if (!ready) {
      alert("WASM ยังไม่พร้อม");
      return resolve();
    }

    const files = document.getElementById("imgInput").files;
    if (!files.length) {
      alert("เลือกรูปก่อน");
      return resolve();
    }

    let index = 0;

    function runNext() {
      if (index >= files.length) {
        resolve(); // ✅ บอกว่าเสร็จแล้ว
        return;
      }

      const file = files[index++];
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

        let product = "กาแฟ";
        if (final >= 0.1 && final < 0.2) product = "น้ำ";
        else if (final >= 0.2) product = "ขนม";

        addRow(final.toFixed(2), product, file.name);

        wasm._free(ptr);
        URL.revokeObjectURL(img.src);

        runNext(); // 🔁 ไปตัวต่อไป
      };
    }

    runNext();
  });
};

// 🔥 default date
window.onload = function() {
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("dateInput").value = today;
};

window.processTwice = async function () {
  console.log("RUN 1");
  await convert();   

  console.log("RUN 2");
  await convert();   
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