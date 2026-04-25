// 🔥 Firebase import
// 🔥 Firebase import
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-app.js";
import { 
  getFirestore, collection, addDoc, getDocs 
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
const ADMIN_EMAILS = ["wutipongg@gmail.com"]; // ← email admin here!

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

  // ซ่อนปุ่ม Manual ถ้าไม่ใช่ admin
  const btnManual = document.getElementById('btnManual');
  if (btnManual) btnManual.style.display = isAdmin ? '' : 'none';
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

    // ✅ ไปหน้า Dashboard
    openTab("Dashboard");

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
        <select class="product"></select>
      </div>

      <div style="flex:1; background:#1e5f7a; color:white; padding:10px; text-align:center;">
        ต้นทุน<br>
        <input type="number" class="cost" placeholder="ใส่ต้นทุน">
      </div>

      <button onclick="this.parentElement.parentElement.remove()">❌</button>
    </div>
  `;

  container.appendChild(wrapper);

  // fill select จาก stockList
  const select = wrapper.querySelector(".product");
  fillSelect(select);
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

window.processTwice = async function () {
  console.log("RUN 1");
  await convert();   

  console.log("RUN 2");
  await convert();   
};

// 🔥 Chart instances (keep refs to destroy before redraw)
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

// 🔥 Set default date range
// 🔥 Stock cache
let stockList = [];

async function loadStocks() {
  const snapshot = await getDocs(collection(db, "stocks"));
  stockList = [];
  snapshot.forEach(doc => {
    const d = doc.data();
    stockList.push({ id: doc.id, name: doc.id.replace(/_/g, ' ') });
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

window.onload = function() {
  const today = new Date();
  const from = new Date();
  from.setDate(today.getDate() - 7);

  document.getElementById("dateInput").value = today.toISOString().split("T")[0];
  document.getElementById("chartFrom").value = from.toISOString().split("T")[0];
  document.getElementById("chartTo").value = today.toISOString().split("T")[0];

  // โหลด stock ครั้งเดียว
  loadStocks();
  // โหลด chart
  loadChartData();
};

// 🔥 Load chart data from Firestore
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
        const product = d.product || "อื่นๆ";

        daily[date].revenue += price;
        daily[date].cost += cost;
        daily[date].qty[product] = (daily[date].qty[product] || 0) + 1;

        productMap[product] = (productMap[product] || 0) + price;
      });
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
    order: 2,
  }));

  const lineDatasets = allProducts.map((prod, i) => ({
    type: "line",
    label: "เส้น" + prod,
    data: activeQtyMap.map(q => q[prod] || 0),
    borderColor: prodColors[i % prodColors.length],
    backgroundColor: "transparent",
    tension: 0.4,
    pointRadius: 3,
    borderWidth: 2,
    yAxisID: "y2",
    order: 1,
  }));

  const qtyEl = document.getElementById("qtyChart");
  const qtyExist = Chart.getChart(qtyEl);
  if (qtyExist) qtyExist.destroy();
  chartQty = new Chart(qtyEl, {
    data: {
      labels: activeDates,
      datasets: [...barDatasets, ...lineDatasets],
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
        y2: { position: "right", ticks: { color: "#555", stepSize: 1 }, grid: { display: false } },
      },
    },
  });
};

// 🔥 Auto-load chart when switching to home tab (if logged in)
const _origOpenTab = window.openTab;
window.openTab = function(id) {
  _origOpenTab(id);
  if (id === "Dashboard") {
    loadChartData();
  }
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

// 🔥 Load stock options from Firestore
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
  const cost    = document.getElementById('popCost').value;

  addRow(price, product, 'manual');         // เพิ่มแถวในตาราง
  document.getElementById('myModal').style.display = 'none';

  // เคลียร์ค่า
  document.getElementById('popPrice').value = '';
  document.getElementById('popCost').value  = '';
}