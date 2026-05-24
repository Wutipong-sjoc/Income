// =========================
// Firebase imports
// โหลด Firebase SDK ที่ใช้ทั้ง Firestore และ Auth จาก CDN แบบ ES module
// =========================
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-app.js";
import {
  getFirestore, collection, addDoc, getDocs, updateDoc, setDoc, doc, getDoc
} from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";

import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js";

// =========================
// Firebase setup
// config นี้ผูกเว็บกับ Firebase project แล้วสร้าง instance สำหรับ db/auth
// =========================
const firebaseConfig = {
  apiKey: "AIzaSyCgray3WkxNhzphkj-00tA_viq_1_tToPo",
  authDomain: "income-e90fe.firebaseapp.com",
  projectId: "income-e90fe",
  storageBucket: "income-e90fe.firebasestorage.app",
  messagingSenderId: "462986865238",
  appId: "1:462986865238:web:3e9ac407ed2e2bb9f029f7"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// =========================
// Auth + navigation
// จัดการสถานะ login, ซ่อน/แสดงปุ่ม admin, และเปลี่ยน tab ในหน้าเดียว
// =========================
function setUserStatus(text) {
  const top = document.getElementById("userStatus");
  const side = document.getElementById("sidebarUser");

  if (top) top.innerText = text;
  if (side) side.innerText = text;
}

const ADMIN_EMAILS = [ // ← email admin here!
  "wutipongg@gmail.com"
];

onAuthStateChanged(auth, (user) => {
  const loginBtn = document.querySelector('button[onclick="login()"]');
  const logoutBtn = document.querySelector('button[onclick="logout()"]');

  const isAdmin = user && ADMIN_EMAILS.includes(user.email);

  if (user) {
    setUserStatus("👤 " + user.email);
    if (loginBtn) loginBtn.style.display = "none";
    if (logoutBtn) logoutBtn.style.display = "block";
  } else {
    setUserStatus("❌ ยังไม่ login");
    if (loginBtn) loginBtn.style.display = "block";
    if (logoutBtn) logoutBtn.style.display = "none";
  }

  // Hide feature and show only admin!!
  document.querySelectorAll('.admin-only').forEach(el => {
    el.style.display = isAdmin ? 'block' : 'none';
  });

  // Hide function buttons for admin only
  //------------------------------------------------------------------------------------
  const btnManual = document.getElementById('btnManual');
  if (btnManual) btnManual.style.display = isAdmin ? '' : 'none';

  const btnStock = document.getElementById("btnStockDetails");
  if (btnStock) btnStock.style.display = isAdmin ? 'block' : 'none';
  //------------------------------------------------------------------------------------
});

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

window.login = async function () {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    await signInWithEmailAndPassword(auth, email, password);

    // ✅ เคลียร์ input
    document.getElementById("email").value = "";
    document.getElementById("password").value = "";

    // ✅ ไปหน้า Dashboard
    openTab("Dashboard");

  } catch (err) {
    alert(err.message);
  }
};

window.logout = async function () {
  await signOut(auth);
  alert("logout แล้ว");
};

window.openTab = function(id) {
  document.querySelectorAll(".tab").forEach(t => {
    t.classList.remove("active");
  });
  document.getElementById(id).classList.add("active");
};


// =========================
// WASM OCR engine
// โหลด engine_myrun.js แล้ว map C++ functions เป็น JS functions:
// - myrun(ptr, width, height): อ่านภาพขาวดำ
// - get_final(): คืนราคาที่ OCR อ่านได้
// =========================
let wasm = null;
let ready = false;

Engine().then(m => {
  console.log("WASM ready");

  m.myrun = m.cwrap("myrun", null, ["number","number","number"]);
  m.get_final = m.cwrap("get_final", "number", []);

  wasm = m;
  ready = true;
});


// =========================
// Slip card rendering
// สร้าง card ต่อหนึ่งรูปสลิป: รูป preview อยู่ซ้าย ช่องราคา/สินค้า/จำนวนอยู่ขวา
// =========================
function addRow(price, filename, imageUrl = "") {
  const container = document.getElementById("slipContainer");
  const displayFilename = escapeHtml(filename);

  // แสดงรูป preview ด้านซ้ายของแต่ละบิล และวางช่องกรอกข้อมูลด้านขวา
  const slipBodyStyle = imageUrl
    ? "display:grid; grid-template-columns:150px minmax(220px, 1fr); gap:12px; padding:12px; background:#f8f9fb; align-items:start;"
    : "display:block; padding:12px; background:#f8f9fb;";

  const slipId = "slip_" + Date.now();
  const wrapper = document.createElement("div");
  wrapper.dataset.slip = slipId;
  wrapper.dataset.filename = filename;
  if (imageUrl) wrapper.dataset.previewUrl = imageUrl;
  wrapper.style.cssText = "margin-top:16px; border:1px solid #d6d9de; border-radius:14px; overflow:hidden; box-shadow:0 10px 24px rgba(15, 23, 42, 0.08); background:#f8f9fb;";

  wrapper.innerHTML = `
    <div style="background:#4b5563; color:#f9fafb; font-size:12px; padding:10px 14px; display:flex; justify-content:space-between; align-items:center;">
      <span>📄 ${displayFilename}</span>
      <button onclick="addItemToSlip('${slipId}')" style="background:#6b7280; color:white; border:1px solid #565c67; padding:6px 14px; border-radius:999px; cursor:pointer; font-size:12px; font-weight:700;">➕ เพิ่มสินค้า</button>
    </div>
    <div style="${slipBodyStyle}">
      ${imageUrl ? `
        <div style="width:150px; height:220px; overflow:hidden; border:1px solid #d7dbe2; border-radius:12px; background:#f8f9fb; display:flex; align-items:flex-start; justify-content:center;">
          <img src="${imageUrl}" alt="${displayFilename}" style="display:block; width:100%; height:100%; object-fit:contain;">
        </div>
      ` : ""}
      <div style="min-width:220px;">
        <!-- ราคาอยู่บนสุด -->
        <div class="slip-price-row" style="display:flex; gap:10px; padding:0 0 10px 0; background:#f8f9fb;">
          <div style="flex:1; background:#eceff3; color:#374151; padding:12px; text-align:center; border-radius:12px; border:1px solid #d7dbe2; font-weight:700;">
            ราคา<br>
            <input type="number" class="bill-price" step="0.01" style="width:90%; margin-top:6px; height:40px; border-radius:10px; border:1px solid #d1d5db; background:#ffffff; padding:0 12px; color:#2f3437; box-sizing:border-box;" oninput="handleBillPriceInput(this)">
            <div class="price-warning" style="display:none; margin-top:8px; color:#9f1239; font-size:12px; font-weight:700;">OCR อ่านราคาไม่ได้ กรุณากรอกราคาเอง</div>
          </div>
        </div>
        <div class="slip-items"></div>
      </div>
    </div>
  `;

  container.appendChild(wrapper);

  // ใส่ราคา OCR และเช็กทันที ถ้าเป็น 0 จะขึ้นเตือนให้กรอกเอง
  const billPriceInput = wrapper.querySelector(".bill-price");
  if (price !== "" && price !== undefined) {
    billPriceInput.value = price;
    handleBillPriceInput(billPriceInput);
  }

  addItemToSlip(slipId);
  return wrapper;
}

function escapeHtml(value) {
  // กันชื่อไฟล์ที่มีอักขระพิเศษทำให้ HTML เพี้ยน
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// =========================
// Price input helpers
// ทุกครั้งที่ราคาเปลี่ยน จะ highlight ถ้าเป็น 0 และลอง match สินค้าจากราคา selling ใน stock
// =========================
window.handleBillPriceInput = function(priceInput) {
  // เวลาแก้ราคาเอง ให้ล้าง/แสดงสถานะเตือน และลอง match สินค้าใหม่
  markPriceStatus(priceInput);
  autoMatchBill(priceInput);
};

function markPriceStatus(priceInput) {
  // ราคา 0 มักเกิดจาก OCR อ่านไม่ได้ จึง highlight ให้แก้มือก่อน Save
  const price = Number(priceInput.value);
  const warning = priceInput.closest(".slip-price-row")?.querySelector(".price-warning");
  const isInvalid = price <= 0;

  priceInput.style.borderColor = isInvalid ? "#e11d48" : "#d1d5db";
  priceInput.style.background = isInvalid ? "#fff1f2" : "#ffffff";
  if (warning) warning.style.display = isInvalid ? "block" : "none";
}

window.autoMatchBill = function(priceInput) {
  const price = Number(priceInput.value);
  if (!price || stockList.length === 0) return;
  const wrapper = priceInput.closest("[data-slip]");
  if (!wrapper) return;
  // match กับ item แรกใน slip
  const firstSelect = wrapper.querySelector(".product");
  if (!firstSelect) return;
  const match = stockList.find(s => s.selling === price);
  if (match) {
    firstSelect.value = match.id;
    autoFillCost(firstSelect);
  }
};

// =========================
// Slip item rows
// ภายในหนึ่งบิลสามารถมีหลายสินค้าได้ แต่ใช้ราคาบิลเดียวร่วมกัน
// =========================
window.addItemToSlip = function(slipId) {
  const wrapper = document.querySelector(`[data-slip="${slipId}"]`);
  if (!wrapper) return;

  const itemsContainer = wrapper.querySelector(".slip-items");
  const row = document.createElement("div");
  row.style.cssText = "display:flex; gap:10px; padding:10px; background:#f8f9fb; border-top:1px solid #e3e6eb;";

  row.innerHTML = `
    <div style="flex:1.5; background:#eceff3; color:#374151; padding:12px; text-align:center; border-radius:12px; border:1px solid #d7dbe2; font-weight:700;">
      สินค้า<br>
      <select class="product" style="width:90%; margin-top:6px; height:40px; border-radius:10px; border:1px solid #d1d5db; background:#ffffff; padding:0 12px; color:#2f3437; box-sizing:border-box;"></select>
    </div>
    <div style="flex:0.6; background:#eceff3; color:#374151; padding:12px; text-align:center; border-radius:12px; border:1px solid #d7dbe2; font-weight:700;">
      จำนวน<br>
      <input type="number" class="qty" value="1" min="1" style="width:90%; margin-top:6px; height:40px; border-radius:10px; border:1px solid #d1d5db; background:#ffffff; padding:0 12px; color:#2f3437; box-sizing:border-box;">
    </div>
    <button onclick="removeItem(this)"
      style="align-self:center; background:#f3f4f6; border:1px solid #d1d5db; color:#8b1e1e; width:42px; height:42px; border-radius:10px; font-size:22px; cursor:pointer;">x</button>
  `;

  itemsContainer.appendChild(row);
  fillSelect(row.querySelector(".product"));
};

window.removeItem = function(button) {
  const row = button?.parentElement;
  if (!row) return;

  const itemsContainer = row.parentElement;
  row.remove();

  if (itemsContainer && itemsContainer.children.length === 0) {
    const wrapper = itemsContainer.closest("[data-slip]");
    revokeSlipPreviewUrl(wrapper);
    wrapper?.remove();
  }
};

window.clearAllSlips = function() {
  clearSlipContainer();
  clearCostRows();

  const fileInput = document.getElementById("imgInput");
  if (fileInput) fileInput.value = "";

  const popPrice = document.getElementById("popPrice");
  const popCost = document.getElementById("popCost");
  if (popPrice) popPrice.value = "";
  if (popCost) popCost.value = "";
};

function clearSlipContainer() {
  // ล้างรายการบิลพร้อมคืน object URL ของรูป preview เพื่อไม่ให้ memory ค้าง
  const slipContainer = document.getElementById("slipContainer");
  if (!slipContainer) return;
  slipContainer.querySelectorAll("[data-preview-url]").forEach(revokeSlipPreviewUrl);
  slipContainer.innerHTML = "";
}

function revokeSlipPreviewUrl(wrapper) {
  const previewUrl = wrapper?.dataset?.previewUrl;
  if (previewUrl) URL.revokeObjectURL(previewUrl);
}

const COST_ITEM_OPTIONS = [
  "packaging",
  "ค่าส่ง",
  "ถุงซิบล็อค",
  "อื่นๆ"
];

function createCostOptions(selected = "packaging") {
  return COST_ITEM_OPTIONS.map(item =>
    `<option value="${item}" ${item === selected ? "selected" : ""}>${item}</option>`
  ).join("");
}

window.addCostRow = function(type = "packaging", amount = "") {
  const container = document.getElementById("costRows");
  if (!container) return;

  const row = document.createElement("div");
  row.className = "cost-row";
  row.style.cssText = "display:flex; gap:14px; align-items:center; flex-wrap:wrap;";

  row.innerHTML = `
    <select class="cost-type" style="background:#6b7280; color:white; border:1px solid #565c67; padding:0 14px; width:180px; height:44px; border-radius:10px; font-size:15px; font-weight:600; box-sizing:border-box; box-shadow:0 2px 8px rgba(0,0,0,0.10);">
      ${createCostOptions(type)}
    </select>
    <input type="number" class="cost-amount" placeholder="ใส่ต้นทุน" value="${amount}"
      style="background:#f3f4f6; color:#2f3437; border:1px solid #d1d5db; padding:0 14px; width:180px; height:44px; border-radius:10px; font-size:15px; font-weight:600; box-sizing:border-box; box-shadow:0 2px 8px rgba(0,0,0,0.05);">
    <button onclick="removeCostRow(this)" aria-label="ลบต้นทุนรายการนี้" style="background:#f3f4f6; color:#8b1e1e; border:1px solid #d1d5db; width:44px; height:44px; border-radius:10px; cursor:pointer; font-size:22px; font-weight:700; line-height:1;">x</button>
  `;

  container.appendChild(row);
};

window.removeCostRow = function(button) {
  const row = button?.closest(".cost-row");
  if (!row) return;

  const container = row.parentElement;
  row.remove();

  if (container && container.children.length === 0) {
    addCostRow();
  }
};

function clearCostRows() {
  const container = document.getElementById("costRows");
  if (!container) return;
  container.innerHTML = "";
  addCostRow();
}

function getGlobalCostTotal() {
  return Array.from(document.querySelectorAll(".cost-amount"))
    .reduce((sum, input) => sum + (Number(input.value) || 0), 0);
}

function getCostBreakdown() {
  return Array.from(document.querySelectorAll(".cost-row"))
    .map(row => ({
      type: row.querySelector(".cost-type")?.value || "packaging",
      amount: Number(row.querySelector(".cost-amount")?.value || 0)
    }))
    .filter(item => item.amount > 0);
}

// =========================
// Product/cost helpers
// ใช้ stockList เป็นแหล่งข้อมูลสินค้า ราคา selling และต้นทุน
// =========================
window.autoMatchProduct = function(priceInput) {
  const price = Number(priceInput.value);
  if (!price || stockList.length === 0) return;

  const row = priceInput.closest("div[style*=flex]");
  const select = row.querySelector(".product");

  // หาสินค้าที่ selling ตรงกับราคา
  const match = stockList.find(s => s.selling === price);
  if (match) {
    select.value = match.id;
    autoFillCost(select);
  }
};

// auto-fill ต้นทุนเมื่อเลือกสินค้า
window.autoFillCost = function(selectEl) {
  const id = selectEl.value;
  const stock = stockList.find(s => s.id === id);
  if (!stock) return;
  const row = selectEl.closest("div[style*=flex]");
  const costInput = row.querySelector(".cost");
  if (costInput && stock.cost) costInput.value = stock.cost;
};

// =========================
// Collect form data before saving
// อ่านทุก slip row บนหน้าเว็บ แปลงเป็น payload สำหรับบันทึกลง Firestore
// =========================
function getAllData() {
  const rows = document.querySelectorAll("#slipContainer .slip-items > div");
  let data = [];
  rows.forEach(row => {
    const slip    = row.closest("[data-slip]");
    const price   = slip?.querySelector(".bill-price")?.value || 0;
    const product = row.querySelector(".product")?.value || "";
    const qty     = Number(row.querySelector(".qty")?.value || 1);

    // ✅ ข้าม row ที่ไม่ได้เลือกสินค้า, qty เป็น 0, หรือ WASM อ่านราคาไม่ได้ (price = 0)
    if (!product || qty <= 0 || Number(price) <= 0) return;

    const stockItem = stockList.find(s => s.id === product);
    const stockCost = stockItem?.cost || 0;

    data.push({
      price:   Number(price),
      product: product,
      qty:     qty,
      cost:    stockCost * qty,
    });
  });
  return data;
}

function getZeroPriceSlipNames() {
  // ใช้กัน Save เมื่อยังมีบิลที่ OCR อ่านราคาไม่ได้
  return Array.from(document.querySelectorAll("#slipContainer [data-slip]"))
    .filter(slip => Number(slip.querySelector(".bill-price")?.value || 0) <= 0)
    .map(slip => slip.dataset.filename || "ไม่ทราบชื่อไฟล์");
}

// =========================
// Save flow
// ตรวจ login/date/ราคา 0/stock ก่อน แล้วค่อยบันทึก slips และลด stock ตาม qty
// =========================
let isSaving = false;
window.saveData = async function () {

  if (isSaving) {
    alert("กำลัง save อยู่ กรุณารอ...");
    return;
  }
  isSaving = true;

  if (!auth.currentUser) {
    alert("กรุณา login ก่อน");
    return;
  }

  const data = getAllData();
  console.log("📦 data ทั้งหมดที่จะ save:", JSON.stringify(data, null, 2));
  console.log("📦 จำนวน items:", data.length);
  const date = document.getElementById("dateInput").value;
  const zeroPriceSlipNames = getZeroPriceSlipNames();

  if (!date) return alert("เลือกวันที่ก่อน");
  if (zeroPriceSlipNames.length > 0) {
    alert("มีบิลที่ OCR อ่านราคาไม่ได้ กรุณากรอกราคาเองก่อน Save:\n" + zeroPriceSlipNames.join("\n"));
    const firstZeroPriceInput = Array.from(document.querySelectorAll("#slipContainer .bill-price"))
      .find(input => Number(input.value || 0) <= 0);
    firstZeroPriceInput?.focus();
    firstZeroPriceInput?.select();
    isSaving = false;
    return;
  }
  if (data.length === 0) return alert("ไม่มีข้อมูล");

  // ✅ ตรวจ stock ก่อน save ทุก item
  try {
    for (let item of data) {
      if (item.product && item.qty > 0) {
        const stockRef = doc(db, "stocks", item.product);
        const stockSnap = await getDoc(stockRef);
        if (stockSnap.exists()) {
          const currentStock = stockSnap.data().stock || 0;

          // 🚫 ถ้า stock = 0 ห้าม save
          if (currentStock <= 0) {
            alert(`❌ "${item.product}" stock หมดแล้ว ไม่สามารถบันทึกได้`);
            isSaving = false;
            return;
          }

          // ⚠️ ถ้า stock < 10 แจ้งเตือน แต่ยังบันทึกได้
          if (currentStock < 10) {
            alert(`⚠️ "${item.product}" stock เหลือน้อย: ${currentStock} ชิ้น`);
          }
        }
      }
    }
  } catch (checkErr) {
    console.warn("ตรวจ stock ไม่สำเร็จ:", checkErr.message);
  }

  try {
    for (let item of data) {
      await addDoc(
        collection(db, "slips", date, "items"),
        {
          price:   item.price,
          product: item.product,
          qty:     item.qty || 1,
          cost:    item.cost,
          userId: auth.currentUser.uid,
          email: auth.currentUser.email
        }
      );

      // ลด stock ตาม qty ที่ขายไป
      if (item.product && item.qty > 0) {
        try {
          const stockRef = doc(db, "stocks", item.product);
          const stockSnap = await getDoc(stockRef);
          if (stockSnap.exists()) {
            const currentStock = stockSnap.data().stock || 0;
            await updateDoc(stockRef, {
              stock: Math.max(0, currentStock - item.qty)
            });
            stockCache = null;
          }
        } catch (stockErr) {
          console.warn("ลด stock ไม่สำเร็จ:", stockErr.message);
        }
      }
    }

    // ✅ save globalCost แยกใน slips/{date} (overwrite ทุกครั้ง)
    const globalCost = getGlobalCostTotal();
    const costBreakdown = getCostBreakdown();
    await setDoc(doc(db, "slips", date), { globalCost, costBreakdown }, { merge: true });

    alert("บันทึกสำเร็จ");
  } catch (e) {
    console.error(e);
    alert("error: " + e.message);
  } finally {
    isSaving = false;
  }
};

// =========================
// OCR conversion flow
// อ่านไฟล์รูปจาก input, วาดลง canvas, ส่ง pixel data เข้า OCR, แล้วสร้าง slip card
// =========================
window.convert = function (renderRows = true) {
  // แปลงไฟล์ที่เลือกเป็นภาพขาวดำ ส่งเข้า WASM OCR แล้ว render เป็นบิลบนหน้าเว็บ
  // renderRows ยังเผื่อไว้สำหรับอนาคต ถ้าต้องการทดลองอ่านโดยไม่สร้าง UI
  return new Promise((resolve) => {

    if (!ready) {
      alert("WASM ยังไม่พร้อม");
      return resolve();
    }

    const files = document.getElementById("imgInput").files;
    if (!files.length) {
      alert("เลือกรูปก่อน");
      return resolve();
    }

    console.log("📁 จำนวนไฟล์:", files.length);

    let index = 0;

    function runNext() {
      if (index >= files.length) {
        resolve(); // ✅ บอกว่าเสร็จแล้ว
        return;
      }

      const file = files[index++];
      console.log(`🖼️ process ไฟล์ที่ ${index}: ${file.name}`);
      const img = new Image();
      const imageUrl = URL.createObjectURL(file);
      img.src = imageUrl;

      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const { data } = ctx.getImageData(0, 0, img.width, img.height);
        const final = readPriceWithFallback(data, img.width, img.height, file.name);

        if (renderRows) {
          addRow(final.toFixed(2), file.name, imageUrl);
        } else {
          URL.revokeObjectURL(imageUrl);
        }

        runNext(); // 🔁 ไปตัวต่อไป
      };
    }

    runNext();
  });
};

function readPriceWithFallback(imageData, width, height, filename = "unknown") {
  // log เป็น group ต่อไฟล์ จะได้ดูง่ายว่า threshold ไหนอ่านได้/ไม่ได้
  console.group(`OCR threshold: ${filename}`);

  // รอบแรกใช้ threshold เดิม 127 เพื่อคง behavior ปกติที่เคยอ่านได้ดี
  let final = runOcrAtThreshold(imageData, width, height, 127);
  let attempts = 1;
  console.log(`try ${attempts}: threshold=127, result=${final.toFixed(2)}`);
  if (final > 0) {
    console.log(`✅ ใช้ threshold 127 หลังลอง ${attempts} ครั้ง`);
    console.groupEnd();
    return final;
  }

  // ถ้าได้ 0 แปลว่า OCR อ่านราคาไม่ได้ ลอง threshold อื่นเพื่อช่วยรูปที่จาง/เข้มต่างกัน
  const fallbackThresholds = [100, 150, 80, 180, 60, 200];
  for (const threshold of fallbackThresholds) {
    attempts++;
    final = runOcrAtThreshold(imageData, width, height, threshold);
    console.log(`try ${attempts}: threshold=${threshold}, result=${final.toFixed(2)}`);
    if (final > 0) {
      console.log(`✅ ใช้ threshold ${threshold} หลังลอง ${attempts} ครั้ง`);
      console.groupEnd();
      return final;
    }
  }

  // ถ้ายังอ่านไม่ได้จริง ๆ ให้คืน 0 เพื่อให้ UI เตือนและบังคับกรอกมือก่อน Save
  console.warn(`⚠️ OCR ยังอ่านไม่ได้หลังลอง ${attempts} ครั้ง`);
  console.groupEnd();
  return 0;
}

function runOcrAtThreshold(imageData, width, height, threshold) {
  // WASM OCR รับภาพขาวดำเท่านั้น เลยแปลงรูปด้วย threshold ที่กำหนดก่อนส่งเข้า engine
  const binary = new Uint8Array(width * height);
  let binaryIndex = 0;

  for (let i = 0; i < imageData.length; i += 4) {
    const gray = 0.299 * imageData[i] + 0.587 * imageData[i + 1] + 0.114 * imageData[i + 2];
    binary[binaryIndex++] = gray > threshold ? 255 : 0;
  }

  const ptr = wasm._malloc(binary.length);
  wasm.HEAPU8.set(binary, ptr);

  wasm.myrun(ptr, width, height);
  const final = wasm.get_final();

  wasm._free(ptr);
  return final;
}

window.processTwice = async function () {
  // ล้าง UI ก่อน process แต่ไม่ล้างไฟล์ที่เลือกไว้
  clearSlipContainer();
  clearCostRows();

  // ตอนนี้มี fallback threshold แล้ว จึงรัน OCR แค่รอบเดียวต่อการกด Process
  console.log("RUN OCR");
  await convert(true);
};

// =========================
// Dashboard chart state
// เก็บ Chart.js instances เพื่อ destroy/redraw ได้โดยไม่ซ้อนกราฟเก่า
// =========================
let chartIncome = null;
let chartQty = null;
let chartMode = 'day';

window.setChartMode = function(mode) {
  chartMode = mode;
  document.getElementById('btnDay').style.background   = mode === 'day'   ? '#1e5f7a' : '';
  document.getElementById('btnDay').style.color        = mode === 'day'   ? 'white'   : '';
  document.getElementById('btnMonth').style.background = mode === 'month' ? '#1e5f7a' : '';
  document.getElementById('btnMonth').style.color      = mode === 'month' ? 'white'   : '';
  loadChartData();
};
let chartProduct = null;
let chartProfit = null;

// =========================
// Stock dropdown cache
// โหลดสินค้าเพื่อเติม select ใน slip/manual และใช้ auto-match จากราคา
// =========================
let stockList = [];

async function loadStocks() {
  const snapshot = await getDocs(collection(db, "stocks"));
  stockList = [];
  snapshot.forEach(doc => {
    const d = doc.data();
    stockList.push({ id: doc.id, name: doc.id.replace(/_/g, ' '), selling: d.selling || 0, cost: d.cost || 0 });
  });
  // fill Modal select ด้วย
  fillSelect(document.getElementById("popProduct"));
}

function fillSelect(selectEl) {
  if (!selectEl) return;
  selectEl.innerHTML = "";
  stockList.forEach(item => {
    const opt = document.createElement("option");
    opt.value = item.id;
    opt.text  = item.name;
    selectEl.appendChild(opt);
  });
}

window.refreshStocks = async function() {
  await loadStocks();
  alert("โหลด stock ใหม่แล้ว ✅");
};

// =========================
// Stock details page
// โหลด stock table, cache ค่าเดิม, แก้ไข stock/cost/selling และบันทึกกลับ Firestore
// =========================
let stockCache = null;
let originalStockCache = null;
let changeLog = []; // เก็บประวัติการ update พร้อมเวลา

async function loadStockContent() {
  if (stockCache) {
    renderStockTable(stockCache);
    return;
  }
  await fetchAndRenderStock();
}

async function fetchAndRenderStock() {
  const snapshot = await getDocs(collection(db, "stocks"));
  stockCache = [];
  snapshot.forEach(d => {
    stockCache.push({ id: d.id, ...d.data() });
  });
  // เก็บ snapshot ต้นฉบับ deep copy
  originalStockCache = JSON.parse(JSON.stringify(stockCache));
  renderStockTable(stockCache);
}

function renderStockTable(items) {
  const container = document.getElementById("stockTableContainer");
  if (!container) return;

  if (items.length === 0) {
    container.innerHTML = "<p style='color:#aaa;'>ไม่มีข้อมูล stock</p>";
    return;
  }

  // const keys = ['stock', 'cost', 'selling'];
  const keys = ['selling','cost', 'stock'];

  let html = `
    <div style="margin-bottom:16px; display:flex; gap:12px; flex-wrap:wrap;">
      <button onclick="showChanges()" style="background:#7a6f1e; color:white; border:none; padding:8px 18px; border-radius:8px; cursor:pointer; font-size:13px;">
        🔍 ดูการเปลี่ยนแปลง
      </button>
      <button onclick="updateAllStocks()" style="background:#1e5f7a; color:white; border:none; padding:8px 18px; border-radius:8px; cursor:pointer; font-size:13px;">
        💾 Update all
      </button>
    </div>
    <table style="width:100%; border-collapse:collapse; font-size:14px;">
    <thead>
      <tr style="background:#1e5f7a; color:white;">
        <th style="padding:10px; text-align:left;">รุ่น (ID)</th>`;
  keys.forEach(k => {
    html += `<th style="padding:10px; text-align:left;">${k}</th>`;
  });
  html += `<th style="padding:10px;">อัปเดต</th></tr>
    </thead><tbody>`;

  items.forEach((item, idx) => {
    const bg = idx % 2 === 0 ? '#1a1a1a' : '#222';
    html += `<tr style="background:${bg};">
      <td style="padding:8px; color:#aaa; font-size:12px;">${item.id}</td>`;
    keys.forEach(k => {
      html += `<td style="padding:8px;">
        <input type="text" value="${item[k] ?? ''}" 
          data-id="${item.id}" data-key="${k}"
          style="width:100%; background:#333; border:1px solid #444; color:white; padding:6px; border-radius:4px;">
      </td>`;
    });
    html += `<td style="padding:8px; text-align:center;">
        <button onclick="updateStock('${item.id}')" 
          style="background:#1e7a4a; color:white; border:none; padding:6px 14px; border-radius:6px; cursor:pointer;">
          💾 Update
        </button>
      </td></tr>`;
  });

  html += `</tbody></table>`;
  container.innerHTML = html;
}

window.showChanges = function() {
  if (changeLog.length === 0) {
    alert("ยังไม่มีการ Update ใดๆ ในเซสชันนี้");
    return;
  }

  let msg = `ประวัติการ Update (${changeLog.length} รายการ):\n\n`;
  changeLog.forEach(c => {
    msg += `• ${c.id}\n  ${c.key}: ${c.before} → ${c.after}\n  🕐 ${c.time}\n\n`;
  });
  alert(msg);
};

window.updateStock = async function(docId) {
  const inputs = document.querySelectorAll(`input[data-id="${docId}"]`);
  const updateData = {};
  inputs.forEach(input => {
    const key = input.dataset.key;
    const val = isNaN(input.value) || input.value === '' ? input.value : Number(input.value);
    updateData[key] = val;
  });

  try {
    // หาค่าเดิมจาก originalStockCache
    const orig = originalStockCache?.find(o => o.id === docId) || {};
    const now = new Date().toLocaleString("th-TH", {
      day:"2-digit", month:"2-digit", year:"numeric",
      hour:"2-digit", minute:"2-digit"
    });

    // เก็บเฉพาะ field ที่เปลี่ยน
    Object.keys(updateData).forEach(key => {
      if (String(orig[key]) !== String(updateData[key])) {
        changeLog.push({
          id: docId,
          key,
          before: orig[key],
          after: updateData[key],
          time: now
        });
      }
    });

    await updateDoc(doc(db, "stocks", docId), updateData);
    stockCache = null;
    await fetchAndRenderStock();
    alert(`✅ อัปเดต ${docId} สำเร็จ`);
  } catch (e) {
    alert("❌ error: " + e.message);
  }
};

window.updateAllStocks = async function() {
  const rows = Array.from(document.querySelectorAll("#stockTableContainer tbody tr"));
  if (rows.length === 0) {
    alert("ไม่มีข้อมูล stock ให้ update");
    return;
  }

  const updates = rows.map(row => {
    const firstInput = row.querySelector("input[data-id]");
    if (!firstInput) return null;

    const docId = firstInput.dataset.id;
    const updateData = {};
    row.querySelectorAll(`input[data-id="${docId}"]`).forEach(input => {
      const key = input.dataset.key;
      const val = isNaN(input.value) || input.value === '' ? input.value : Number(input.value);
      updateData[key] = val;
    });

    return { docId, updateData };
  }).filter(Boolean);

  if (updates.length === 0) {
    alert("ไม่พบข้อมูลที่จะ update");
    return;
  }

  const now = new Date().toLocaleString("th-TH", {
    day:"2-digit", month:"2-digit", year:"numeric",
    hour:"2-digit", minute:"2-digit"
  });

  try {
    updates.forEach(({ docId, updateData }) => {
      const orig = originalStockCache?.find(o => o.id === docId) || {};
      Object.keys(updateData).forEach(key => {
        if (String(orig[key]) !== String(updateData[key])) {
          changeLog.push({
            id: docId,
            key,
            before: orig[key],
            after: updateData[key],
            time: now
          });
        }
      });
    });

    await Promise.all(
      updates.map(({ docId, updateData }) => updateDoc(doc(db, "stocks", docId), updateData))
    );

    stockCache = null;
    await fetchAndRenderStock();
    alert(`✅ Update all สำเร็จ ${updates.length} รายการ`);
  } catch (e) {
    alert("❌ error: " + e.message);
  }
};

window.onload = function() {
  const today = new Date();
  const from = new Date();
  from.setDate(today.getDate() - 7);

  document.getElementById("dateInput").value = today.toISOString().split("T")[0];
  document.getElementById("chartFrom").value = from.toISOString().split("T")[0];
  document.getElementById("chartTo").value = today.toISOString().split("T")[0];
  clearCostRows();

  // โหลด stock ครั้งเดียว
  loadStocks();
  // โหลด chart
  loadChartData();
};

// =========================
// Dashboard data + charts
// อ่าน slips ตามช่วงวันที่ แล้วคำนวณรายได้/ต้นทุน/กำไร/จำนวนสินค้า ก่อนวาดกราฟ
// =========================
window.loadChartData = async function () {
  const from = document.getElementById("chartFrom").value;
  const to = document.getElementById("chartTo").value;

  if (!from || !to) {
    document.getElementById("chartStatus").innerText = "⚠️ เลือกช่วงวันที่ก่อน";
    return;
  }

  document.getElementById("chartStatus").innerText = "⏳ กำลังโหลด...";

  // Generate all date strings in range
  const dates = [];
  let cur = new Date(from);
  const end = new Date(to);
  while (cur <= end) {
    dates.push(cur.toISOString().split("T")[0]);
    cur.setDate(cur.getDate() + 1);
  }

  // Aggregate data per date
  const daily = {}; // { date: { revenue, cost, qty: {product: count} } }
  const productMap = {}; // { productName: totalRevenue }

  for (const date of dates) {
    try {
      const snapshot = await getDocs(collection(db, "slips", date, "items"));
      if (!daily[date]) daily[date] = { revenue: 0, cost: 0, qty: {} };

      snapshot.forEach(doc => {
        const d = doc.data();

        const price = Number(d.price) || 0;
        const cost = Number(d.cost) || 0;
        const qty = Number(d.qty) || 1;
        const product = d.product || "อื่นๆ";

        daily[date].revenue += price;
        daily[date].cost += cost;
        daily[date].qty[product] = (daily[date].qty[product] || 0) + qty;

        productMap[product] = (productMap[product] || 0) + price;
      });

      // ✅ บวก globalCost ของวันนั้นเพิ่ม
      try {
        const metaSnap = await getDoc(doc(db, "slips", date));
        if (metaSnap.exists()) {
          daily[date].cost += Number(metaSnap.data().globalCost || 0);
        }
      } catch (_) {}

    } catch (e) {
      // date might not exist — skip
    }
  }

  // Build chart arrays
  const labels = dates;
  const revenues = dates.map(d => daily[d]?.revenue || 0);
  const costs = dates.map(d => daily[d]?.cost || 0);
  const profits = dates.map(d => (daily[d]?.revenue || 0) - (daily[d]?.cost || 0));

  const totalRevenue = revenues.reduce((a, b) => a + b, 0);
  const totalCost = costs.reduce((a, b) => a + b, 0);
  const totalProfit = totalRevenue - totalCost;

  // Summary cards
  document.getElementById("totalRevenue").innerText = totalRevenue.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  document.getElementById("totalCost").innerText = totalCost.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const profitEl = document.getElementById("totalProfit");
  profitEl.innerText = totalProfit.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  profitEl.style.color = totalProfit >= 0 ? "#4ade80" : "#f87171";

  document.getElementById("chartStatus").innerText = `✅ โหลดข้อมูล ${dates.length} วัน`;

  // ── กรองเฉพาะวันที่มีข้อมูล ──
  let activeDates    = dates.filter(d => (daily[d]?.revenue || 0) > 0 || (daily[d]?.cost || 0) > 0);
  let activeRevenues = activeDates.map(d => daily[d]?.revenue || 0);
  let activeCosts    = activeDates.map(d => daily[d]?.cost || 0);
  let activeProfits  = activeDates.map(d => (daily[d]?.revenue || 0) - (daily[d]?.cost || 0));
  let activeQtyMap   = activeDates.map(d => daily[d]?.qty || {});

  // Group by month if mode = month
  if (chartMode === 'month') {
    const monthMap = {};
    activeDates.forEach(d => {
      const m = d.slice(0, 7);
      if (!monthMap[m]) monthMap[m] = { revenue: 0, cost: 0, qty: {} };
      monthMap[m].revenue += daily[d]?.revenue || 0;
      monthMap[m].cost    += daily[d]?.cost || 0;
      Object.entries(daily[d]?.qty || {}).forEach(([prod, cnt]) => {
        monthMap[m].qty[prod] = (monthMap[m].qty[prod] || 0) + cnt;
      });
    });
    activeDates    = Object.keys(monthMap).sort();
    activeRevenues = activeDates.map(m => monthMap[m].revenue);
    activeCosts    = activeDates.map(m => monthMap[m].cost);
    activeProfits  = activeDates.map(m => monthMap[m].revenue - monthMap[m].cost);
    activeQtyMap   = activeDates.map(m => monthMap[m].qty);
  }

  // ── Mixed Bar + Line Chart ──
  const incomeEl = document.getElementById("incomeChart");
  const incomeExist = Chart.getChart(incomeEl);
  if (incomeExist) incomeExist.destroy();
  chartIncome = new Chart(incomeEl, {
    data: {
      labels: activeDates,
      datasets: [
        { type:"bar",  label:"รายได้",      data:activeRevenues, backgroundColor:"rgba(30,95,122,0.75)",  borderRadius:4, yAxisID:"y",  order:2 },
        { type:"bar",  label:"ต้นทุน",      data:activeCosts,    backgroundColor:"rgba(122,62,30,0.75)", borderRadius:4, yAxisID:"y",  order:2 },
        { type:"bar",  label:"กำไร",        data:activeProfits,  backgroundColor:activeProfits.map(v=>v>=0?"rgba(30,122,74,0.75)":"rgba(200,50,50,0.75)"), borderRadius:4, yAxisID:"y", order:2 },
        { type:"line", label:"เส้นรายได้",  data:activeRevenues, borderColor:"rgba(100,180,220,1)", backgroundColor:"transparent", tension:0.4, pointRadius:3, borderWidth:2, yAxisID:"y2", order:1 },
        { type:"line", label:"เส้นต้นทุน",  data:activeCosts,    borderColor:"rgba(220,140,80,1)",  backgroundColor:"transparent", tension:0.4, pointRadius:3, borderWidth:2, yAxisID:"y2", order:1 },
        { type:"line", label:"เส้นกำไร",    data:activeProfits,  borderColor:"rgba(80,220,140,1)",  backgroundColor:"transparent", tension:0.4, pointRadius:3, borderWidth:2, yAxisID:"y2", order:1 },
        
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          labels: {
            color: "#ccc", font: { size: 12 },
            filter: (item) => !["เส้นรายได้","เส้นต้นทุน","เส้นกำไร"].includes(item.text),
          },
        },
        tooltip: {
          mode: "index",
          intersect: false,
          filter: (item) => ["รายได้", "ต้นทุน", "กำไร"].includes(item.dataset.label),
        }
      },
      scales: {
        x:  { ticks:{ color:"#888", maxTicksLimit:10 }, grid:{ color:"#222" } },
        y:  { position:"left",  ticks:{ color:"#888" }, grid:{ color:"#222" } },
        y2: { position:"right", ticks:{ color:"#555" }, grid:{ display:false } },
      },
    },
  });

  // ── Product Pie Chart ──
  // if (chartProduct) chartProduct.destroy();
  // const productLabels = Object.keys(productMap);
  // const productValues = Object.values(productMap);
  // const pieColors = ["#1e5f7a", "#7a3e1e", "#1e7a4a", "#7a6f1e", "#5a1e7a", "#1e3f7a"];
  // chartProduct = new Chart(document.getElementById("productChart"), {
  // type: "doughnut",
  // data: {
  // labels: productLabels,
  // datasets: [{
  // data: productValues,
  // backgroundColor: pieColors.slice(0, productLabels.length),
  // borderWidth: 2,
  // borderColor: "#111",
  // }],
  // },
  // options: {
  // responsive: true,
  // plugins: {
  // legend: { labels: { color: "#ccc", font: { size: 12 } } },
  // },
  // },
  // });

  // ── Profit Pie Chart ──
  // if (chartProfit) chartProfit.destroy();
  // chartProfit = new Chart(document.getElementById("profitPieChart"), {
  // type: "doughnut",
  // data: {
  // labels: ["กำไร", "ต้นทุน"],
  // datasets: [{
  // data: [Math.max(totalProfit, 0), totalCost],
  // backgroundColor: ["#1e7a4a", "#7a3e1e"],
  // borderWidth: 2,
  // borderColor: "#111",
  // }],
  // },
  // options: {
  // responsive: true,
  // plugins: {
  // legend: { labels: { color: "#ccc", font: { size: 12 } } },
  // },
  // },
  // });

  // ── Qty Chart (mixed bar+line) ──
  // รวบรวมชื่อสินค้าทั้งหมด
  const allProducts = [...new Set(
    activeQtyMap.flatMap(q => Object.keys(q))
  )];
  const prodColors = ["#1e5f7a","#7a3e1e","#1e7a4a","#7a6f1e","#5a1e7a","#c0392b"];

  const barDatasets = allProducts.map((prod, i) => ({
    type: "bar",
    label: prod,
    data: activeQtyMap.map(q => q[prod] || 0),
    backgroundColor: prodColors[i % prodColors.length] + "cc",
    borderRadius: 4,
    yAxisID: "y",
    order: 1,
  }));

  const qtyEl = document.getElementById("qtyChart");
  const qtyExist = Chart.getChart(qtyEl);
  if (qtyExist) qtyExist.destroy();
  chartQty = new Chart(qtyEl, {
    data: {
      labels: activeDates,
      datasets: barDatasets,
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          labels: {
            color: "#ccc", font: { size: 12 },
            // filter: (item) => !item.text.startsWith("เส้น"),
          },
        },
        tooltip: { mode: "index", intersect: false },
      },
      scales: {
        x:  { ticks: { color: "#888" }, grid: { color: "#222" } },
        y:  { position: "left",  ticks: { color: "#888", stepSize: 1 }, grid: { color: "#222" } },
      },
    },
  });
};

// =========================
// Tab side effects
// เวลาเปลี่ยน tab จะโหลด Dashboard หรือ StockDetails ใหม่ตามหน้าที่เปิด
// =========================
const _origOpenTab = window.openTab;
window.openTab = function(id) {
  _origOpenTab(id);
  if (id === "Dashboard") {
    loadChartData();
  }
  if (id === "StockDetails") {
    loadStockContent();
  }
};

// =========================
// Debug helper
// ฟังก์ชันนี้ใช้ export ภาพเป็น PGM สำหรับ debug image processing เท่านั้น
// =========================
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

// =========================
// Manual modal
// โหลดสินค้าเข้า modal และเพิ่มรายการ manual โดยไม่ต้องผ่าน OCR
// =========================
window.loadStockOptions = async function() {
  const select = document.getElementById("popProduct");
  select.innerHTML = "<option>กำลังโหลด...</option>";

  const snapshot = await getDocs(collection(db, "stocks"));
  select.innerHTML = "";

  snapshot.forEach(doc => {
    const d = doc.data();
    const option = document.createElement("option");
    option.value = doc.id;
    option.text  = doc.id.replace(/_/g, ' ');
    select.appendChild(option);
  });
};

function saveModal() {
  const price   = document.getElementById('popPrice').value;
  const product = document.getElementById('popProduct').value;

  const wrapper = addRow(price, 'manual');  // เพิ่มแถวในตาราง
  const productSelect = wrapper?.querySelector(".product");
  if (productSelect) {
    productSelect.value = product;
    autoFillCost(productSelect);
  }
  document.getElementById('myModal').style.display = 'none';

  // เคลียร์ค่า
  document.getElementById('popPrice').value = '';
  document.getElementById('popCost').value  = '';
}
