// ========== [1] تهيئة الصفحة عند التحميل ==========
document.addEventListener("DOMContentLoaded", function () {
  initPasswordToggle();
  initLoader();
  initDragAndDrop();
  initSystemControl();
  initCharts();
});

if (typeof initSystemControl !== "function") {
  function initSystemControl() {
    // دالة وهمية لتفادي الخطأ
  }
}
if (typeof initCharts !== "function") {
  function initCharts() {
    // دالة وهمية لتفادي الخطأ
  }
}

// ========== [2] دوال التهيئة ==========

// 2.1 إظهار/إخفاء كلمة المرور
function initPasswordToggle() {
  const passwordInput = document.getElementById("password");
  const togglePassword = document.getElementById("togglePassword");

  if (togglePassword && passwordInput) {
    togglePassword.addEventListener("click", () => {
      const isPassword = passwordInput.type === "password";
      passwordInput.type = isPassword ? "text" : "password";

      togglePassword.style.opacity = 0;
      setTimeout(() => {
        togglePassword.src = isPassword
          ? "images/hide-pass.png"
          : "images/show-pass.png";
        togglePassword.style.opacity = 1;
      }, 150);
    });
  }
}

// 2.2 شاشة التحميل
function initLoader() {
  const loader = document.querySelector(".loader");
  if (loader) {
    setTimeout(() => loader.classList.add("hide"), 1000);
  }
}

// 2.3 نظام السحب والإفلات
function initDragAndDrop() {
  const list = document.getElementById("sortableList");
  if (!list) return;

  let draggedItem = null;

  list.addEventListener("dragstart", (e) => {
    if (e.target.tagName === "LI") {
      draggedItem = e.target;
      e.target.classList.add("dragging");
    }
  });

  list.addEventListener("dragend", () => {
    if (draggedItem) {
      draggedItem.classList.remove("dragging");
      draggedItem = null;
    }
  });

  list.addEventListener("dragover", (e) => {
    e.preventDefault();
    const afterElement = getDragAfterElement(list, e.clientY);
    afterElement
      ? list.insertBefore(draggedItem, afterElement)
      : list.appendChild(draggedItem);
  });
}

// دالة مساعدة للسحب والإفلات
function getDragAfterElement(container, y) {
  const draggableElements = [
    ...container.querySelectorAll("li:not(.dragging)"),
  ];
  return draggableElements.reduce(
    (closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      return offset < 0 && offset > closest.offset
        ? { offset, element: child }
        : closest;
    },
    { offset: Number.NEGATIVE_INFINITY }
  ).element;
}
// ========== [5] دوال المستخدم و API ==========
async function login() {
  const username = document.getElementById("username")?.value?.trim();
  const password = document.getElementById("password")?.value?.trim();

  if (!username || !password) {
    alert("من فضلك أدخل اسم المستخدم وكلمة المرور");
    return;
  }

  const url = `http://internalplacementapi.runasp.net/api/Auth/login?ssn=${encodeURIComponent(
    username
  )}&password=${encodeURIComponent(password)}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`خطأ في الاستجابة (${response.status}): ${errorText}`);
    }

    const res = await response.json();
    handleLoginResponse(res);
  } catch (error) {
    alert("بيانات الدخول غير صحيحة.");
  }
}

function handleLoginResponse(res) {
  if (!res || typeof res !== "object") {
    alert("استجابة غير متوقعة من السيرفر.");
    return;
  }

  if (!res.role || !res.token) {
    alert(res.message || "بيانات الدخول غير صحيحة.");
    return;
  }

  try {
    sessionStorage.setItem("name", res.name || "");
    sessionStorage.setItem("ssn", res.ssn || "");
    sessionStorage.setItem("field", res.field || "");
    sessionStorage.setItem("token", res.token || "");
  } catch (e) {
    alert("حدث خطأ داخلي. يرجى المحاولة لاحقًا.");
    return;
  }

  const role = res.role.toLowerCase();
  switch (role) {
    case "admin":
      window.location.href = "admin-students.html";
      break;
    case "student":
      window.location.href = "select-programs.html";
      break;
    default:
      alert("صلاحيات غير معروفة.");
  }
}
