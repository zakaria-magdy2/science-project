window.onload = async function () {
  const dragList = document.querySelector(".dragList");
  const submitBtn = document.getElementById("submitBtn");
  const resultSection = document.querySelector(".reslut-content");
  const resultBox = document.querySelector(".result");
  const head = document.getElementById("resultDiv");

  const ssn = sessionStorage.getItem("ssn");
  const token = sessionStorage.getItem("token");

  await loadUserData();

  // ✅ التحقق من حالة التسجيل
  try {
    const statusResponse = await fetch(
      `http://internalplacementapi.runasp.net/api/Student/Registerion Can?SSN=${ssn}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const statusData = await statusResponse.json();
    const registrationOpen = statusData?.data === true;

    if (!registrationOpen) {
      dragList.classList.add("none");
      submitBtn.classList.add("none");
      resultSection.classList.remove("none");

      const resultResponse = await fetch(
        `http://internalplacementapi.runasp.net/api/Student/GetStudentResult?ssn=${ssn}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const resultData = await resultResponse.json();

      if (
        resultData?.isSuccess === true &&
        typeof resultData.data === "string" &&
        resultData.data.trim() !== "" &&
        resultData.data !== "No result available."
      ) {
        head.textContent = ":نتيجتك هي";
        resultBox.textContent = resultData.data;
      }

      return;
    }
  } catch (error) {
    console.error("فشل في التحقق من حالة التسجيل أو تحميل النتيجة:", error);
  }

  // ✅ تحميل بيانات المستخدم
  async function loadUserData() {
    try {
      const name = sessionStorage.getItem("name");
      const field = sessionStorage.getItem("field");

      const nameElement = document.getElementById("userName");
      const ssnElement = document.getElementById("ssn");
      const fieldElement = document.getElementById("field");

      if (name && nameElement && !nameElement.textContent.includes(name)) {
        nameElement.textContent += name;
      }

      if (ssn && ssnElement && !ssnElement.textContent.includes(ssn)) {
        ssnElement.textContent += ssn;
      }

      if (field && fieldElement && !fieldElement.textContent.includes(field)) {
        fieldElement.textContent += field;
      }
    } catch (error) {
      console.error("فشل تحميل بيانات المستخدم:", error);
    }
  }

  // ✅ تحميل التخصصات
  try {
    const response = await fetch(
      `http://internalplacementapi.runasp.net/api/Student/GetAvailablePrograms?ssn=${ssn}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const res = await response.json();

    if (res.isSuccess && res.data && res.data.$values) {
      const list = document.getElementById("sortableList");

      if (!list) {
        console.error("العنصر #sortableList غير موجود في الصفحة.");
        return;
      }

      list.innerHTML = "";

      res.data.$values.forEach((program) => {
        const li = document.createElement("li");
        li.setAttribute("draggable", "true");
        li.innerHTML = `${program}<span>⋮⋮</span>`;
        list.appendChild(li);
      });
    } else {
      alert("فشل في تحميل التخصصات");
      console.error("Response error:", res);
    }
  } catch (error) {
    alert("حدث خطأ أثناء تحميل التخصصات");
    console.error("Fetch error:", error);
  }
};

// ✅ إرسال ترتيب البرامج
async function submitList() {
  try {
    const ssn = sessionStorage.getItem("ssn");
    const token = sessionStorage.getItem("token");

    if (!ssn) {
      alert("رقم الطالب غير موجود");
      return;
    }

    const listItems = document.querySelectorAll("#sortableList li");
    if (listItems.length === 0) {
      alert("لم يتم تحديد أي رغبات");
      return;
    }

    const preferences = Array.from(listItems).map((li, index) => ({
      name: li.textContent.replace("⋮⋮", "").trim(),
      order: index,
    }));

    const payload = {
      ssn: ssn,
      preferences: preferences,
    };

    const response = await fetch(
      "http://internalplacementapi.runasp.net/api/Student/submit-preferences",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      }
    );

    const text = await response.text();

    if (response.ok && text.includes("Preferences saved successfully")) {
      alert("تم حفظ الرغبات بنجاح ✅");
    } else {
      alert("فشل في حفظ الرغبات ❌");
      console.error("Response text:", text);
    }
  } catch (error) {
    alert("حدث خطأ أثناء إرسال التفضيلات.");
    console.error("Submission error:", error);
  }
}
