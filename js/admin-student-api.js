window.onload = async function () {
  const valid = await checkSessionValidity();
  if (!valid) return;

  const name = sessionStorage.getItem("name");
  if (name) {
    document.getElementById("userName").textContent += name;
  }
};

// التحقق من صلاحية الجلسة بالتوكن
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
    alert("خطأ أثناء التحقق من صلاحية الجلسة:");
    return false;
  }
}

// ✅ التحقق من حالة التسجيل للطالب من بيانات studentData
function checkStudentRegistration() {
  try {
    const studentData = JSON.parse(sessionStorage.getItem("studentData"));

    if (!studentData || typeof studentData.isRegistrationOpen !== "boolean") {
      throw new Error("بيانات الطالب غير متاحة أو غير صحيحة");
    }

    const openBtn = document.getElementById("open-update");
    const closeBtn = document.getElementById("close-update");

    if (studentData.isRegistrationOpen === true) {
      // التسجيل مفتوح → فعّل زر القفل فقط
      openBtn.style.backgroundColor = "transparent";
      openBtn.style.cursor = "not-allowed";
      openBtn.disabled = true;

      closeBtn.style.backgroundColor = "red";
      closeBtn.style.cursor = "pointer";
      closeBtn.disabled = false;
    } else {
      // التسجيل مغلق → فعّل زر الفتح فقط
      closeBtn.style.backgroundColor = "transparent";
      closeBtn.style.cursor = "not-allowed";
      closeBtn.disabled = true;

      openBtn.style.backgroundColor = "green";
      openBtn.style.cursor = "pointer";
      openBtn.disabled = false;
    }
  } catch (error) {
    alert("⚠️ حدث خطأ أثناء التحقق من حالة تسجيل الطالب");
  }
}

// ✅ بحث عن طالب بالرقم القومي
document.getElementById("search-btn").addEventListener("click", function () {
  document.getElementById("search-form").dispatchEvent(new Event("submit"));
});

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
        document.querySelector(".data .phoneNumber").textContent =
          student.phoneNumber;

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
        alert("⚠️ لم يتم العثور على طالب بهذا الرقم القومي");
      }
    })
    .catch((error) => {
      alert("❌ رقم قومي غير صحيح  ");
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
        alert("✅ تم فتح التسجيل بنجاح");

        // تحديث studentData
        const updatedStudent = { ...student, isRegistrationOpen: true };
        sessionStorage.setItem("studentData", JSON.stringify(updatedStudent));
        checkStudentRegistration();
      } else {
        alert("⚠️ فشل في فتح التسجيل للطالب");
      }
    })
    .catch((err) => {
      alert("❌ حدث خطأ أثناء محاولة فتح التسجيل");
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
        alert("✅ تم قفل التسجيل بنجاح");

        // تحديث studentData
        const updatedStudent = { ...student, isRegistrationOpen: false };
        sessionStorage.setItem("studentData", JSON.stringify(updatedStudent));
        checkStudentRegistration();
      } else {
        alert("⚠️ فشل في قفل التسجيل للطالب");
      }
    })
    .catch((err) => {
      alert("❌ حدث خطأ أثناء محاولة قفل التسجيل");
    });
});

// ✅ زر طباعة بيانات الطالب مع التوكن
document
  .getElementById("exportStudent")
  .addEventListener("click", async function () {
    const ssn = sessionStorage.getItem("ssn");
    const token = sessionStorage.getItem("token");

    if (!ssn || !token) {
      alert("  حدث خطـأ!");
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
      alert("❌ فشل تحميل ملف بيانات الطالب");
    }
  });
