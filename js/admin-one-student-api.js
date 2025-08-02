window.onload = async function () {
  await checkStudentRegistration();

  const name = sessionStorage.getItem("name");
  if (name) {
    document.getElementById("userName").textContent += name;
  }
};

// ✅ التحقق من حالة التسجيل للطالب
async function checkStudentRegistration() {
  try {
    const ssn = sessionStorage.getItem("ssn");
    const token = sessionStorage.getItem("token");
    if (!ssn) return;

    const response = await fetch(
      `http://internalplacementapi.runasp.net/api/Student/Registerion Can?SSN=${ssn}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const result = await response.json();

    const openBtn = document.getElementById("open-update");
    const closeBtn = document.getElementById("close-update");

    if (result.isSuccess && result.data === true) {
      openBtn.style.backgroundColor = "transparent";
      openBtn.style.cursor = "not-allowed";
      openBtn.disabled = true;

      closeBtn.style.backgroundColor = "red";
      closeBtn.style.cursor = "pointer";
      closeBtn.disabled = false;
    } else {
      closeBtn.style.backgroundColor = "transparent";
      closeBtn.style.cursor = "not-allowed";
      closeBtn.disabled = true;

      openBtn.style.backgroundColor = "green";
      openBtn.style.cursor = "pointer";
      openBtn.disabled = false;
    }
  } catch (error) {
    console.error("فشل التحقق من حالة التسجيل:", error);
  }
}

// ✅ بحث عن طالب بالرقم القومي
document.getElementById("search-form").addEventListener("submit", function (e) {
  e.preventDefault();

  const ssn = document.getElementById("search-input").value.trim();
  if (!ssn) {
    alert("من فضلك أدخل الرقم القومي");
    return;
  }

  const token = sessionStorage.getItem("token");

  fetch(
    `http://internalplacementapi.runasp.net/api/Admin/GetStudentBySSN?SSN=${ssn}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  )
    .then((res) => res.json())
    .then((result) => {
      if (result.isSuccess && result.data) {
        const student = result.data;

        document.querySelector(".data .name").textContent = student.name;
        document.querySelector(".data .id").textContent = student.ssn;
        document.querySelector(".data .department").textContent = student.field;

        const tableBody = document.querySelector("#wish-table tbody");
        tableBody.innerHTML = "";

        student.preferences.$values.forEach((pref, index) => {
          const row = document.createElement("tr");
          row.innerHTML = `
            <td>${index + 1}</td>
            <td>${pref.name}</td>
          `;
          tableBody.appendChild(row);
        });

        document.querySelector(".data").classList.remove("none");
        document.querySelector(".buttons").classList.remove("none");
        document.querySelector(".desires").classList.remove("none");

        sessionStorage.setItem("studentData", JSON.stringify(student));
        sessionStorage.setItem("ssn", student.ssn);

        checkStudentRegistration();
      } else {
        alert("لم يتم العثور على طالب بهذا الرقم القومي");
      }
    })
    .catch((error) => {
      console.error("حدث خطأ:", error);
      alert(" رقم قومي غير صحيح ");
    });
});

// ✅ زر فتح التسجيل
const openBtn = document.getElementById("open-update");
const closeBtn = document.getElementById("close-update");

openBtn.addEventListener("click", () => {
  if (openBtn.disabled) return;

  const student = JSON.parse(sessionStorage.getItem("studentData"));
  const token = sessionStorage.getItem("token");
  if (!student || !student.ssn) {
    alert("لا يوجد بيانات طالب");
    return;
  }

  fetch(
    "http://internalplacementapi.runasp.net/api/Admin/OpenRegisterionSpecificStudent",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ ssn: student.ssn, isRegister: true }),
    }
  )
    .then((res) => res.json())
    .then((result) => {
      if (result.isSuccess && result.data === true) {
        alert("تم فتح التسجيل");
        checkStudentRegistration();
      } else {
        alert("فشل في فتح التسجيل للطالب");
      }
    })
    .catch((err) => {
      console.error("خطأ في فتح التسجيل:", err);
      alert("حدث خطأ أثناء الفتح");
    });
});

// ✅ زر قفل التسجيل
closeBtn.addEventListener("click", () => {
  if (closeBtn.disabled) return;

  const student = JSON.parse(sessionStorage.getItem("studentData"));
  const token = sessionStorage.getItem("token");
  if (!student || !student.ssn) {
    alert("لا يوجد بيانات طالب");
    return;
  }

  fetch(
    "http://internalplacementapi.runasp.net/api/Admin/OpenRegisterionSpecificStudent",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ ssn: student.ssn, isRegister: false }),
    }
  )
    .then((res) => res.json())
    .then((result) => {
      if (result.isSuccess && result.data === true) {
        alert("تم قفل التسجيل");
        checkStudentRegistration();
      } else {
        alert("فشل في قفل التسجيل للطالب");
      }
    })
    .catch((err) => {
      console.error("خطأ في قفل التسجيل:", err);
      alert("حدث خطأ أثناء القفل");
    });
});

// ✅ زر طباعة بيانات الطالب
// ✅ زر طباعة بيانات الطالب مع التوكن
document
  .getElementById("exportStudent")
  .addEventListener("click", async function () {
    const ssn = sessionStorage.getItem("ssn");
    const token = sessionStorage.getItem("token");

    if (!ssn || !token) {
      alert("رقم الطالب أو التوكن غير موجود!");
      return;
    }

    try {
      const response = await fetch(
        `http://internalplacementapi.runasp.net/api/Admin/GenerateStudentPdf?ssn=${ssn}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`فشل التحميل: ${response.status}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `student-${ssn}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("حدث خطأ أثناء تحميل بيانات الطالب:", error);
      alert("❌ فشل تحميل ملف بيانات الطالب");
    }
  });
