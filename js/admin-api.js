// ✅ عند تحميل الصفحة: تحميل البيانات الأولية وإعداد الأحداث
window.onload = async function () {
  await loadUserData();
  await loadStudentNumbers();
  await loadSystemState();
  await loadRegistrationStats();

  document.getElementById("downloadMathBtn").addEventListener("click", () => {
    document.getElementById("downloadMath").click();
  });

  document
    .getElementById("downloadScienceBtn")
    .addEventListener("click", () => {
      document.getElementById("downloadScience").click();
    });
};

// ✅ تحميل اسم المستخدم من sessionStorage وإظهاره
async function loadUserData() {
  try {
    const name = sessionStorage.getItem("name");
    const nameElement = document.getElementById("userName");

    if (name && nameElement && !nameElement.textContent.includes(name)) {
      nameElement.textContent += name;
    }
  } catch (error) {
    console.error("فشل تحميل بيانات المستخدم:", error);
  }
}

// ✅ تحميل عدد الطلاب في كل مسار
async function loadStudentNumbers() {
  try {
    const token = sessionStorage.getItem("token");
    const response = await fetch(
      "http://internalplacementapi.runasp.net/api/Admin/GetCountStudent",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const result = await response.json();

    if (result.status === "Success" && result.data) {
      const numMath = document.getElementById("numMath");
      const numScience = document.getElementById("numScience");

      if (numMath) numMath.textContent = result.data.Math;
      if (numScience) numScience.textContent = result.data.Science;

      sessionStorage.setItem("totalMath", result.data.Math);
      sessionStorage.setItem("totalScience", result.data.Science);
    } else {
      console.error("فشل في جلب بيانات الطلاب:", result);
    }
  } catch (error) {
    console.error("حدث خطأ أثناء تحميل أعداد الطلاب:", error);
  }
}

// ✅ تحميل حالة النظام
async function loadSystemState() {
  try {
    const token = sessionStorage.getItem("token");
    const response = await fetch(
      "http://internalplacementapi.runasp.net/api/Admin/GetRegisterionStatus",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const result = await response.json();

    const controlBtn = document.getElementById("control");
    const stateBox = document.getElementById("state");
    const calendarBox = document.querySelector(".calendar");

    if (result.isSuccess && result.data) {
      const { isRegistrationOpen, date } = result.data;
      const dateObj = new Date(date);
      const dateString = dateObj.toLocaleDateString("en-GB");
      const timeString = dateObj.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      });

      if (isRegistrationOpen) {
        updateSystemUI(
          controlBtn,
          stateBox,
          calendarBox,
          "images/lock.svg",
          "قفل النظام",
          "#dc2626",
          "images/circle-check.svg",
          "مفتوح",
          "#15803d",
          "تم فتح النظام في",
          dateString,
          timeString
        );
      } else {
        updateSystemUI(
          controlBtn,
          stateBox,
          calendarBox,
          "images/lock.svg",
          "فتح النظام",
          "#15803d",
          "images/ban.svg",
          "مغلق",
          "#b91c1c",
          "تم اغلاق النظام في",
          dateString,
          timeString
        );
      }
    } else {
      updateSystemUI(
        controlBtn,
        stateBox,
        calendarBox,
        "images/lock.svg",
        "فتح النظام",
        "#15803d",
        "images/ban.svg",
        "مغلق",
        "#b91c1c",
        "فترة التسجيل لم تبدأ بعد",
        "",
        ""
      );
    }
  } catch (error) {
    console.error("فشل في تحميل حالة النظام:", error);
  }
}

// ✅ تحكم النظام (فتح/إغلاق)
function initSystemControl() {
  const controlBtn = document.getElementById("control");
  const stateBox = document.getElementById("state");
  const calendarBox = document.querySelector(".calendar");

  const adminSSN = sessionStorage.getItem("ssn");
  const token = sessionStorage.getItem("token");

  if (controlBtn && stateBox && calendarBox) {
    controlBtn.addEventListener("click", async () => {
      try {
        const now = new Date();
        const timeString = now.toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
        });
        const dateString = now.toLocaleDateString("en-GB");
        const apiDate = now.toISOString().split("T")[0];
        const isOpen = controlBtn.innerText.includes("قفل النظام");

        const endpoint = isOpen
          ? "http://internalplacementapi.runasp.net/api/Admin/CloseRegisterionALLStudent"
          : "http://internalplacementapi.runasp.net/api/Admin/OpenRegisterionALLStudent";

        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ ssn: adminSSN, end: apiDate }),
        });

        const result = await response.json();
        if (!result.isSuccess) {
          console.error("فشل الطلب:", result.errorMessages);
          return;
        }

        updateSystemUI(
          controlBtn,
          stateBox,
          calendarBox,
          "images/lock.svg",
          isOpen ? "فتح النظام" : "قفل النظام",
          isOpen ? "#15803d" : "#dc2626",
          isOpen ? "images/ban.svg" : "images/circle-check.svg",
          isOpen ? "مغلق" : "مفتوح",
          isOpen ? "#b91c1c" : "#15803d",
          isOpen ? "تم اغلاق النظام في" : "تم فتح النظام في",
          dateString,
          timeString
        );
      } catch (error) {
        console.error("فشل في تغيير حالة النظام:", error);
      }
    });
  }
}

function updateSystemUI(
  btn,
  state,
  calendar,
  btnImg,
  btnText,
  btnColor,
  stateImg,
  stateText,
  stateColor,
  calendarText,
  date,
  time
) {
  if (!btn || !state || !calendar) return;

  btn.innerHTML = `<img src="${btnImg}" alt="${btnText}" /> ${btnText}`;
  btn.style.backgroundColor = btnColor;

  state.innerHTML = `<img id="check" src="${stateImg}" alt="${stateText}" /> ${stateText}`;
  state.style.color = stateColor;

  if (date && time) {
    calendar.innerHTML = `<img src="images/calendar.svg" alt="" /> ${calendarText} <br /><span class="date">${date} <br /> ${time}</span>`;
  } else {
    calendar.innerHTML = `<img src="images/calendar.svg" alt="" /> ${calendarText}`;
  }
}

// ✅ رفع الملفات
// ✅ روابط الرفع حسب النوع
const apiUrls = {
  Placement:
    "http://internalplacementapi.runasp.net/api/Admin/importStudentData",
  Result:
    "http://internalplacementapi.runasp.net/api/Admin/importStudentResult",
};

// ✅ إعداد الأحداث لزرار رفع الملفات لكل نوع
["Placement", "Result"].forEach((type) => {
  document.getElementById(`upload${type}`).addEventListener("click", () => {
    document.getElementById(`input${type}`).click();
  });

  document
    .getElementById(`input${type}`)
    .addEventListener("change", (event) => {
      const file = event.target.files[0];
      if (file) {
        uploadExcelFile(file, apiUrls[type]);
      }
    });
});

// ✅ رفع ملف إكسل مع التوكن
function uploadExcelFile(file, apiUrl) {
  const token = sessionStorage.getItem("token");
  const formData = new FormData();
  formData.append("file", file);

  fetch(apiUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  })
    .then(async (response) => {
      let data = {};
      try {
        data = await response.json();
      } catch (e) {
        console.warn("الرد ليس بصيغة JSON:", e);
      }

      if (response.ok) {
        alert("تم رفع الملف بنجاح ✅");
      } else {
        alert(`فشل في الرفع ❌: ${data.message || "خطأ غير معروف"}`);
      }
    })
    .catch((error) => {
      console.error("فشل في رفع الملف:", error);
      alert("حدث خطأ أثناء رفع الملف ❌");
    });
}

// ✅ إحصائيات التسجيل
async function loadRegistrationStats() {
  try {
    const token = sessionStorage.getItem("token");
    const response = await fetch(
      "http://internalplacementapi.runasp.net/api/Admin/GetFieldRegistrationStat",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const result = await response.json();

    if (result.isSuccess && result.data && result.data["$values"]) {
      const stats = result.data["$values"];
      const mathCard = document.querySelectorAll(".third-row .card")[0];
      const scienceCard = document.querySelectorAll(".third-row .card")[1];

      stats.forEach((item) => {
        let percent = 0;
        let total = 0;

        if (item.field === "Math") {
          total = parseInt(sessionStorage.getItem("totalMath")) || 1;
          percent = Math.round((item.studentCount / total) * 100);
          mathCard.querySelector(".num").textContent = item.studentCount;
          mathCard.querySelector(".rate").textContent = `${percent}%`;
          mathCard.querySelector(".progres").style.width = `${percent}%`;
        }

        if (item.field === "Science") {
          total = parseInt(sessionStorage.getItem("totalScience")) || 1;
          percent = Math.round((item.studentCount / total) * 100);
          scienceCard.querySelector(".num").textContent = item.studentCount;
          scienceCard.querySelector(".rate").textContent = `${percent}%`;
          scienceCard.querySelector(".progres").style.width = `${percent}%`;
        }
      });
    }
  } catch (error) {
    console.error("فشل تحميل إحصائيات التسجيل:", error);
  }
}

// ✅ الرسوم البيانية
function initCharts() {
  loadChartData("Math", "علمي رياضة", "chart2");
  loadChartData("Science", "علمي علوم", "chart1");
}

async function loadChartData(field, title, canvasId) {
  try {
    const token = sessionStorage.getItem("token");
    const response = await fetch(
      `http://internalplacementapi.runasp.net/api/Admin/GetFirstChoise?Field=${field}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const result = await response.json();

    const values = result?.data?.$values || [];
    const labels = values.map((item) => item.programName);
    const data = values.map((item) => item.count);

    const ctx = document.getElementById(canvasId);
    if (!ctx?.getContext) return;

    new Chart(ctx.getContext("2d"), {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            data,
            backgroundColor: generateColors(data.length),
          },
        ],
      },
      options: getChartOptions(title),
      plugins: [ChartDataLabels],
    });
  } catch (error) {
    console.error("خطأ في تحميل البيانات:", error);
  }
}

function getChartOptions(title) {
  return {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: `احصائيات ${title}`,
        font: { size: 18 },
      },
      legend: { display: false },
      datalabels: {
        color: "#000",
        anchor: "end",
        align: "start",
        font: { size: 10 },
        offset: -15,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
      },
    },
  };
}

function generateColors(count) {
  const colors = [
    "#fbbf24",
    "#a78bfa",
    "#fb7185",
    "#34d399",
    "#818cf8",
    "#22d3ee",
    "#60a5fa",
    "#fda4af",
    "#10b981",
    "#f87171",
  ];
  return Array.from({ length: count }, (_, i) => colors[i % colors.length]);
}
// ✅ دالة لتحميل الملف باستخدام fetch والتوكن
async function downloadFileWithToken(programName, fileName) {
  const token = sessionStorage.getItem("token");
  const url = `http://internalplacementapi.runasp.net/api/Admin/ExportFile?program=${programName}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) throw new Error(`فشل تحميل الملف: ${response.status}`);

    const blob = await response.blob();
    const downloadUrl = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(downloadUrl);
  } catch (err) {
    console.error("حدث خطأ أثناء التحميل:", err);
    alert("حدث خطأ أثناء تحميل الملف. تأكد من أنك مسجل الدخول.");
  }
}

// ✅ ربط الدالة بزراري التحميل
document.getElementById("downloadMathBtn").addEventListener("click", () => {
  downloadFileWithToken("Math", "علمي_رياضة.xlsx");
});

document.getElementById("downloadScienceBtn").addEventListener("click", () => {
  downloadFileWithToken("Science", "علمي_علوم.xlsx");
});
