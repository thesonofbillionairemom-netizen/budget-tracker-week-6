"use strict";

/* =====================================================
   SpendWise - Week 6: Interactive version
   Flow: user action -> event listener -> update data -> render()
   ===================================================== */

/* ---------- 1. Data (arrays and state) ---------- */
const STORAGE_KEY = "spendwise-data";
const CATEGORIES = ["Food", "Transport", "Rent", "Entertainment", "Other"];
const CATEGORY_COLORS = {
  Food: "#12b886",
  Transport: "#339af0",
  Rent: "#7950f2",
  Entertainment: "#f59f00",
  Other: "#868e96"
};

let expenses = [];          // array of expense objects: { id, name, amount, category, date }
let budget = 0;
let profileName = "";
let theme = null;           // "light" | "dark" | null (follow system)
let filterCategory = "All";
let sortBy = "newest";
let toastTimer = null;
let toastAction = null;

const $ = id => document.getElementById(id);

/* ---------- 2. Helpers ---------- */
function money(n) {
  return "KES " + n.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

// Local date as YYYY-MM-DD (toISOString would use UTC and can show yesterday in EAT)
function today() {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return d.getFullYear() + "-" + month + "-" + day;
}

function formatDate(iso) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric"
  });
}

function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/* ---------- 3. Storage ---------- */
function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ expenses, budget, profileName, theme }));
  } catch (err) {
    console.warn("Could not save data:", err);
  }
}

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved) return;
    budget = Number(saved.budget) || 0;
    profileName = typeof saved.name === "string" ? saved.name : (saved.profileName || "");
    theme = saved.theme === "dark" || saved.theme === "light" ? saved.theme : null;
    if (Array.isArray(saved.expenses)) {
      expenses = saved.expenses.filter(e => e && typeof e.amount === "number" && e.name);
    }
  } catch (err) {
    console.warn("Could not load saved data:", err);
  }
}

/* ---------- 4. Calculations (loops over the array) ---------- */
function totalSpent(list) {
  let total = 0;
  for (const e of list) total += e.amount;
  return total;
}

function totalsByCategory(list) {
  const totals = {};
  for (const c of CATEGORIES) totals[c] = 0;
  for (const e of list) totals[e.category] = (totals[e.category] || 0) + e.amount;
  return totals;
}

// Build the list the table shows: filter, then sort
function visibleExpenses() {
  const result = [];
  // Walk backwards so the most recently added expense wins ties on the same date
  for (let i = expenses.length - 1; i >= 0; i--) {
    const e = expenses[i];
    if (filterCategory === "All" || e.category === filterCategory) result.push(e);
  }
  result.sort((a, b) => {
    switch (sortBy) {
      case "oldest":  return a.date.localeCompare(b.date);
      case "highest": return b.amount - a.amount;
      case "lowest":  return a.amount - b.amount;
      default:        return b.date.localeCompare(a.date);
    }
  });
  return result;
}

/* ---------- 5. Decision making (conditionals) ---------- */
function getStatus(spent) {
  if (budget <= 0) {
    return { level: "none", pct: 0, text: 'Click "Set budget" to begin.' };
  }
  const left = budget - spent;
  const pct = Math.round((spent / budget) * 100);

  if (left < 0) {
    return { level: "over", pct, text: "Over budget by " + money(-left) + ". Pause non-essential spending." };
  } else if (pct >= 90) {
    const text = left === 0
      ? "Budget fully used. Any new expense puts you over."
      : "Careful: " + pct + "% used, only " + money(left) + " left.";
    return { level: "danger", pct, text };
  } else if (pct >= 70) {
    return { level: "careful", pct, text: pct + "% used. Slow down on spending." };
  }
  return { level: "ok", pct, text: "On track: " + pct + "% of your budget used." };
}

function validateExpense(name, amount, date) {
  const errors = {};
  if (name === "") {
    errors.item = "Enter what you spent on.";
  } else if (name.length > 40) {
    errors.item = "Keep the name under 40 characters.";
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    errors.amount = "Enter an amount greater than 0.";
  } else if (amount > 10000000) {
    errors.amount = "That amount looks too large.";
  }
  if (date > today()) {
    errors.date = "Date can't be in the future.";
  }
  return errors;
}

/* ---------- 6. Rendering (DOM updates) ---------- */
function renderSummary() {
  const spent = totalSpent(expenses);
  const left = budget > 0 ? budget - spent : 0;
  const status = getStatus(spent);

  $("left").textContent = money(left);
  $("budget").textContent = money(budget);
  $("spent").textContent = money(spent);
  $("count").textContent = expenses.length;
  $("msg").textContent = status.text;

  const bar = $("bar");
  bar.style.width = Math.min(status.pct, 100) + "%";
  bar.classList.toggle("careful", status.level === "careful");
  bar.classList.toggle("danger", status.level === "danger");
  bar.classList.toggle("over", status.level === "over");
}

function createRow(e) {
  const tr = document.createElement("tr");

  const nameTd = document.createElement("td");
  nameTd.textContent = e.name;

  const amountTd = document.createElement("td");
  amountTd.textContent = money(e.amount);

  const catTd = document.createElement("td");
  const badge = document.createElement("span");
  badge.className = "badge";
  const dot = document.createElement("span");
  dot.className = "dot";
  dot.style.background = CATEGORY_COLORS[e.category] || "#868e96";
  badge.append(dot, document.createTextNode(e.category));
  catTd.append(badge);

  const dateTd = document.createElement("td");
  dateTd.textContent = formatDate(e.date);

  const actionTd = document.createElement("td");
  const del = document.createElement("button");
  del.type = "button";
  del.className = "icon-del";
  del.dataset.id = e.id;
  del.setAttribute("aria-label", "Delete " + e.name);
  del.textContent = "✕";
  actionTd.append(del);

  tr.append(nameTd, amountTd, catTd, dateTd, actionTd);
  return tr;
}

function renderTable() {
  const rows = visibleExpenses();
  const body = $("rows");
  body.replaceChildren();   // clear first so rows never duplicate

  if (rows.length === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 5;
    td.className = "empty";
    td.textContent = expenses.length === 0
      ? "No expenses yet. Add your first one using the form."
      : "No " + filterCategory + " expenses to show.";
    tr.append(td);
    body.append(tr);
  } else {
    for (const e of rows) body.append(createRow(e));
  }

  $("tableCount").textContent = expenses.length === 0
    ? ""
    : "Showing " + rows.length + " of " + expenses.length + " transactions";
  $("clearBtn").hidden = expenses.length === 0;
}

function renderBreakdown() {
  const list = $("breakdown");
  list.replaceChildren();

  const spent = totalSpent(expenses);
  if (spent === 0) {
    const li = document.createElement("li");
    li.className = "empty-note";
    li.textContent = "Your spending breakdown will appear here.";
    list.append(li);
    return;
  }

  const totals = totalsByCategory(expenses);
  const entries = [];
  for (const name in totals) {
    if (totals[name] > 0) entries.push({ name, amount: totals[name] });
  }
  entries.sort((a, b) => b.amount - a.amount);

  for (const item of entries) {
    const pct = Math.round((item.amount / spent) * 100);

    const li = document.createElement("li");
    const row = document.createElement("div");
    row.className = "row";
    const label = document.createElement("span");
    label.textContent = item.name;
    const value = document.createElement("span");
    value.textContent = money(item.amount) + " (" + pct + "%)";
    row.append(label, value);

    const track = document.createElement("div");
    track.className = "mini-track";
    const fill = document.createElement("div");
    fill.className = "mini-bar";
    fill.style.width = pct + "%";
    fill.style.background = CATEGORY_COLORS[item.name] || "#868e96";
    track.append(fill);

    li.append(row, track);
    list.append(li);
  }
}

function renderInsights() {
  const list = $("insights");
  list.replaceChildren();
  const items = [];

  if (expenses.length === 0) {
    items.push({ text: "Add your first expense and your insights will appear here." });
  } else {
    const spent = totalSpent(expenses);
    const totals = totalsByCategory(expenses);

    let topName = "";
    let topAmount = 0;
    for (const name in totals) {
      if (totals[name] > topAmount) {
        topAmount = totals[name];
        topName = name;
      }
    }

    let largest = expenses[0];
    for (const e of expenses) {
      if (e.amount > largest.amount) largest = e;
    }

    const share = Math.round((topAmount / spent) * 100);
    items.push({ text: "Top category: " + topName + " (" + share + "% of spending, " + money(topAmount) + ")." });
    items.push({ text: "Largest expense: " + largest.name + " at " + money(largest.amount) + "." });
    items.push({ text: "Average per transaction: " + money(spent / expenses.length) + "." });

    if (share > 50 && expenses.length >= 3) {
      items.push({ tone: "warn", text: topName + " takes more than half of your spending. Cutting here saves the most." });
    }
    if (budget > 0 && expenses.length >= 3 && spent <= budget * 0.5) {
      items.push({ text: "You have used less than half your budget. Nice pace." });
    }
  }

  for (const item of items) {
    const li = document.createElement("li");
    if (item.tone) li.className = item.tone;
    li.textContent = item.text;
    list.append(li);
  }
}

function renderProfile() {
  if (profileName) {
    $("userName").textContent = profileName;
    $("avatar").textContent = profileName[0].toUpperCase();
  } else {
    $("userName").textContent = "Guest";
    $("avatar").textContent = "👤";
  }
}

function applyTheme() {
  const dark = theme === "dark" ||
    (theme === null && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  $("themeIcon").textContent = dark ? "☀️" : "🌙";
  $("themeBtn").setAttribute("aria-pressed", String(dark));
}

// One function redraws everything from the data
function render() {
  renderSummary();
  renderTable();
  renderBreakdown();
  renderInsights();
  renderProfile();
  save();
}

/* ---------- 7. Feedback helpers ---------- */
function showToast(message, actionLabel, onAction) {
  $("toastMsg").textContent = message;
  const btn = $("toastAction");
  btn.hidden = !actionLabel;
  btn.textContent = actionLabel || "";
  toastAction = onAction || null;
  $("toast").classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(hideToast, 5000);
}

function hideToast() {
  $("toast").classList.remove("show");
  toastAction = null;
}

function showFormErrors(errors) {
  for (const field of ["item", "amount", "date"]) {
    $(field + "Error").textContent = errors[field] || "";
    $(field).setAttribute("aria-invalid", errors[field] ? "true" : "false");
  }
}

/* ---------- 8. Actions ---------- */
function addExpense(name, amount, category, date) {
  const before = totalSpent(expenses);
  expenses.push({ id: newId(), name, amount, category, date });
  const after = before + amount;
  render();

  if (budget > 0 && before <= budget && after > budget) {
    showToast("That expense puts you over budget.");
  } else {
    showToast("Added " + name + ".");
  }
}

function deleteExpense(id) {
  const index = expenses.findIndex(e => e.id === id);
  if (index === -1) return;
  const removed = expenses.splice(index, 1)[0];
  render();
  showToast("Deleted " + removed.name + ".", "Undo", () => {
    expenses.splice(Math.min(index, expenses.length), 0, removed);
    render();
  });
}

/* ---------- 9. Event listeners ---------- */
// Add expense
$("form").addEventListener("submit", e => {
  e.preventDefault();
  const name = $("item").value.trim();
  const amount = Number($("amount").value);
  const category = $("category").value;
  const date = $("date").value || today();

  const errors = validateExpense(name, amount, date);
  showFormErrors(errors);
  if (Object.keys(errors).length > 0) return;

  addExpense(name, amount, category, date);
  e.target.reset();
  $("date").value = today();
  $("item").focus();
});

// Clear an error as soon as the user starts fixing the field
for (const field of ["item", "amount", "date"]) {
  $(field).addEventListener("input", () => {
    $(field + "Error").textContent = "";
    $(field).setAttribute("aria-invalid", "false");
  });
}

// Delete: one listener on the table body handles every row (event delegation)
$("rows").addEventListener("click", e => {
  const btn = e.target.closest("button[data-id]");
  if (btn) deleteExpense(btn.dataset.id);
});

// Filter and sort
$("filter").addEventListener("change", e => {
  filterCategory = e.target.value;
  renderTable();
});
$("sort").addEventListener("change", e => {
  sortBy = e.target.value;
  renderTable();
});

// Clear all
$("clearBtn").addEventListener("click", () => {
  if (expenses.length === 0) return;
  if (!confirm("Delete all " + expenses.length + " expenses? This cannot be undone.")) return;
  expenses = [];
  render();
  showToast("All expenses cleared.");
});

// Budget dialog
$("budgetBtn").addEventListener("click", () => {
  $("budgetInput").value = budget || "";
  $("budgetError").textContent = "";
  $("budgetDialog").showModal();
  $("budgetInput").focus();
});
$("budgetForm").addEventListener("submit", e => {
  e.preventDefault();
  const value = Number($("budgetInput").value);
  if (!Number.isFinite(value) || value <= 0) {
    $("budgetError").textContent = "Enter a budget greater than 0.";
    $("budgetInput").setAttribute("aria-invalid", "true");
    return;
  }
  $("budgetInput").setAttribute("aria-invalid", "false");
  budget = value;
  $("budgetDialog").close();
  render();
  showToast("Budget set to " + money(value) + ".");
});

// Profile dialog
$("profileBtn").addEventListener("click", () => {
  $("profileInput").value = profileName;
  $("profileError").textContent = "";
  $("profileDialog").showModal();
  $("profileInput").focus();
});
$("profileForm").addEventListener("submit", e => {
  e.preventDefault();
  const name = $("profileInput").value.trim();
  if (name === "") {
    $("profileError").textContent = "Enter a name to continue.";
    $("profileInput").setAttribute("aria-invalid", "true");
    return;
  }
  $("profileInput").setAttribute("aria-invalid", "false");
  profileName = name;
  $("profileDialog").close();
  render();
  showToast("Welcome, " + name + ".");
});

// Dialogs: Cancel buttons and click outside the box
for (const dialog of document.querySelectorAll("dialog")) {
  dialog.addEventListener("click", e => {
    if (e.target === dialog || e.target.matches("[data-close]")) dialog.close();
  });
}

// Theme toggle
$("themeBtn").addEventListener("click", () => {
  const isDark = document.documentElement.dataset.theme === "dark";
  theme = isDark ? "light" : "dark";
  applyTheme();
  save();
});

// Toast action (Undo)
$("toastAction").addEventListener("click", () => {
  if (toastAction) toastAction();
  hideToast();
});

/* ---------- 10. Start ---------- */
function fillCategoryLists() {
  for (const c of CATEGORIES) {
    $("category").add(new Option(c, c));
    $("filter").add(new Option(c, c));
  }
  $("filter").add(new Option("All categories", "All"), 0);
  $("filter").value = "All";
}

function init() {
  load();
  fillCategoryLists();
  $("date").value = today();
  $("date").max = today();
  applyTheme();
  render();
}

init();