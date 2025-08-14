// ✅ عند تحميل الصفحة: تحميل البيانات الأولية وإعداد الأحداث
window.onload = async function () {
  if (!checkSessionValidity()) return;
  await loadUserData();
  await loadStudentNumbers();
  await loadSystemState();
  await loadRegistrationStats();
};

//  انتهاء الجلسه
async function checkSessionValidity() {
  const token = sessionStorage.getItem("token");
  if (!token) {
    alert("⚠️ انتهت الجلسة. سيتم تحويلك إلى صفحة تسجيل الدخول.");
    setTimeout(() => {
      window.location.href = "index.html";
    }, 2000);
    return false;
  }

  // تحقق فعلي من التوكن عن طريق أي API محمي
  try {
    const response = await fetch(
      "http://internalplacementapi.runasp.net/api/Admin/GetRegisterionStatus",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.status === 401) {
      alert("⚠️ انتهت صلاحية الجلسة. سيتم تحويلك إلى صفحة تسجيل الدخول.");
      sessionStorage.clear();
      setTimeout(() => {
        window.location.href = "index.html";
      }, 2000);
      return false;
    }

    return true;
  } catch (error) {
    alert("⚠️حدث خطأ برجاء التواصل مع الدعم ");
    return false;
  }
}

// ✅ تحميل اسم المستخدم من sessionStorage وإظهاره
async function loadUserData() {
  try {
    const name = sessionStorage.getItem("name");
    const nameElement = document.getElementById("userName");

    if (name && nameElement && !nameElement.textContent.includes(name)) {
      nameElement.textContent += name;
    }
  } catch (error) {
    alert("فشل تحميل بيانات المستخدم:");
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

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const result = await response.json();

    if (result.status === "Success" && result.data) {
      const numMath = document.getElementById("numMath");
      const numScience = document.getElementById("numScience");

      if (numMath) numMath.textContent = result.data.Math ?? "—";
      if (numScience) numScience.textContent = result.data.Science ?? "—";

      sessionStorage.setItem("totalMath", result.data.Math);
      sessionStorage.setItem("totalScience", result.data.Science);
    } else {
      alert("⚠️ فشل في جلب بيانات أعداد الطلاب. الرجاء المحاولة لاحقًا.");
    }
  } catch (error) {
    alert(
      "❌ حدث خطأ أثناء تحميل أعداد الطلاب. تأكد من الاتصال بالإنترنت أو تواصل مع الدعم."
    );
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

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const result = await response.json();

    const controlBtn = document.getElementById("control");
    const stateBox = document.getElementById("state");
    const calendarBox = document.querySelector(".calendar");

    if (result?.isSuccess && result.data) {
      const { isRegistrationOpen, date } = result.data;
      const dateObj = new Date(date);
      const dateString = dateObj.toLocaleDateString("en-GB");

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
          "" // شلت الوقت
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
          "" // شلت الوقت
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
        "⚠️ فترة التسجيل لم تبدأ بعد",
        "",
        ""
      );
    }
  } catch (error) {
    alert(
      "❌ تعذر تحميل حالة النظام. الرجاء التحقق من الاتصال أو المحاولة لاحقًا."
    );
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
          body: JSON.stringify({ ssn: adminSSN, end: apiDate, Start: apiDate }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        if (!result.isSuccess) {
          alert(result.errorMessages?.[0] || "حدث خطأ أثناء تنفيذ العملية.");
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
          "" // شلت الوقت
        );
      } catch (error) {
        alert("حدث خطأ , برجاء التواصل مع الدعم ");
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
  } else if (date) {
    calendar.innerHTML = `<img src="images/calendar.svg" alt="" /> ${calendarText} <br /><span class="date">${date}</span>`;
  } else {
    calendar.innerHTML = `<img src="images/calendar.svg" alt="" /> ${calendarText}`;
  }
}

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
        event.target.value = ""; // ✅ كده تقدر ترفع نفس الملف تاني
      }
    });
});

//  رفع ملف إكسل
function uploadExcelFile(file, apiUrl) {
  const token = sessionStorage.getItem("token");
  const formData = new FormData();
  formData.append("file", file);

  const loaderEl = document.getElementById("loading");
  if (loaderEl) loaderEl.style.display = "flex"; // إظهار الـ Loader لو موجود

  fetch(apiUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`, // مهم: لا تضيف Content-Type مع FormData
    },
    body: formData,
  })
    .then(async (response) => {
      let data;
      try {
        data = await response.json();
      } catch {
        // الرد مش JSON
        if (response.ok) {
          alert("تم رفع الملف بنجاح ✅");
        } else {
          alert(`فشل في الرفع ❌ (HTTP ${response.status})`);
        }
        return;
      }

      if (response.ok) {

        const msg = typeof data?.data === "string" ? data.data : "";
        const match = msg.match(/Added:\s*(\d+)[^0-9]+Skipped:\s*(\d+)/i);
        const skippedRowsMatch = msg.match(/Skipped\s*rows:\s*(\d+)/i);

        if (match) {
          const added = match[1];
          const skipped = match[2];
          alert(
            `تم رفع الملف بنجاح ✅\nتمت الإضافة: ${added} ✅\nتم التجاهل: ${skipped} ❌`
          );
        } else if (msg) {
          alert(`تم رفع الملف بنجاح ✅\n${msg}`);
        } else {
          alert("تم رفع الملف بنجاح ✅");
        }
      } else {
        // خطأ من السيرفر
        const errMsg =
          (Array.isArray(data?.errorMessages) && data.errorMessages[0]) ||
          data?.message ||
          data?.data || // أحيانًا الباك يضع الرسالة في data حتى في الأخطاء
          `HTTP ${response.status}`;
        alert(`فشل في الرفع ❌: ${errMsg}`);
      }
    })
    .catch(() => {
      alert("حدث خطأ أثناء رفع الملف ❌");
    })
    .finally(() => {
      if (loaderEl) loaderEl.style.display = "none"; // إخفاء الـ Loader بأمان
      // اختياري: تفريغ input الملف بعد الرفع
      const inputPlacement = document.getElementById("inputPlacement");
      const inputResult = document.getElementById("inputResult");
      if (inputPlacement) inputPlacement.value = "";
      if (inputResult) inputResult.value = "";
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

    if (
      result.isSuccess &&
      result.data &&
      result.data["$values"] &&
      Array.isArray(result.data["$values"])
    ) {
      const stats = result.data["$values"];
      const cards = document.querySelectorAll(".third-row .card");

      if (cards.length >= 2) {
        const mathCard = cards[0];
        const scienceCard = cards[1];

        stats.forEach((item) => {
          let percent = 0;
          let total = 0;

          if (item.field === "Math") {
            total = parseInt(sessionStorage.getItem("totalMath")) || 1;
            percent = Math.round((item.studentCount / total) * 100);

            mathCard.querySelector(".num").textContent = item.studentCount ?? 0;
            mathCard.querySelector(".rate").textContent = `${percent}%`;
            mathCard.querySelector(".progres").style.width = `${percent}%`;
          }

          if (item.field === "Science") {
            total = parseInt(sessionStorage.getItem("totalScience")) || 1;
            percent = Math.round((item.studentCount / total) * 100);

            scienceCard.querySelector(".num").textContent =
              item.studentCount ?? 0;
            scienceCard.querySelector(".rate").textContent = `${percent}%`;
            scienceCard.querySelector(".progres").style.width = `${percent}%`;
          }
        });
      }
    }
  } catch (error) {
    alert("⚠️ حدث خطأ أثناء تحميل إحصائيات التسجيل. حاول مرة أخرى.");
  }
}

// ✅ الرسوم البيانية
async function initCharts() {
  try {
    const token = sessionStorage.getItem("token");

    const [mathData, scienceData] = await Promise.all([
      fetchChartData("Math", token),
      fetchChartData("Science", token),
    ]);

    drawChart(mathData, "علمي رياضة", "chart1"); // رياضة في chart1
    drawChart(scienceData, "علمي علوم", "chart2"); // علوم في chart2
  } catch (error) {
    alert("⚠️ حدث خطأ أثناء تحميل البيانات. برجاء المحاولة لاحقًا.");
  }
}

async function fetchChartData(field, token) {
  try {
    const response = await fetch(
      `http://internalplacementapi.runasp.net/api/Admin/GetFirstChoise?Field=${field}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const result = await response.json();

    if (
      result?.isSuccess &&
      result?.data?.$values &&
      Array.isArray(result.data.$values)
    ) {
      return result.data.$values;
    } else {
      return [];
    }
  } catch (error) {
    alert(`فشل تحميل بيانات الشارت لحقل ${field}:`);
    return [];
  }
}

function drawChart(values, title, canvasId) {
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
        min: 0,
        max: 100,
        ticks: {
          stepSize: 20,
          precision: 0,
          callback: function (value) {
            return value;
          },
        },
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

let selectedProgramName = "";

// ربط الأزرار بفتح نافذة اختيار نوع التحميل
document.getElementById("downloadMathBtn").addEventListener("click", () => {
  selectedProgramName = "Math";
  openModal();
});

document.getElementById("downloadScienceBtn").addEventListener("click", () => {
  selectedProgramName = "Science";
  openModal();
});

// عرض نافذة التحميل
function openModal() {
  document.getElementById("downloadModal").style.display = "flex";
}

// إغلاق نافذة التحميل
function closeModal() {
  document.getElementById("downloadModal").style.display = "none";
}

// التحميل بناءً على النوع
function handleFileDownload(type) {
  closeModal();

  const fileName =
    type === "Excel"
      ? `${selectedProgramName === "Math" ? "علمي_رياضة" : "علمي_علوم"}.xlsx`
      : `${selectedProgramName === "Math" ? "علمي_رياضة" : "علمي_علوم"}.pdf`;

  const token = sessionStorage.getItem("token");
  if (!token) {
    alert("يرجى تسجيل الدخول أولاً.");
    return;
  }

  const endpoint =
    type === "Excel"
      ? `ExportFile?program=${encodeURIComponent(selectedProgramName)}`
      : `GenerateAllStudentsPreferencesPdf?filter=${encodeURIComponent(
          selectedProgramName
        )}`;

  const url = `http://internalplacementapi.runasp.net/api/Admin/${endpoint}`;

  fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
    .then((response) => {
      if (!response.ok) {
        if (response.status === 401) {
          alert("انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى.");
        } else {
          alert("فشل التحميل. برجاء المحاولة لاحقاً.");
        }
        throw new Error(`HTTP ${response.status}`);
      }
      return response.blob();
    })
    .then((blob) => {
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(downloadUrl);
    })
    .catch((err) => {
      alert("Error..");
    });
}
