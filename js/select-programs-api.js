window.onload = async function () {
  if (!checkSessionValidity()) return;
  const dragList = document.querySelector(".dragList");
  const submitBtn = document.getElementById("submitBtn");
  const resultSection = document.querySelector(".reslut-content");
  const resultBox = document.querySelector(".result");
  const head = document.getElementById("resultDiv");
  const dragText = document.getElementById("dragText");
  const list = document.getElementById("sortableList");

  const ssn = sessionStorage.getItem("ssn");
  const token = sessionStorage.getItem("token");

  await loadUserData();

  let registrationOpen = false;

  try {
    const statusResponse = await fetch(
      `http://internalplacementapi.runasp.net/api/Student/Registerion Can?SSN=${ssn}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!statusResponse.ok) {
      throw new Error(`حالة السيرفر غير ناجحة: ${statusResponse.status}`);
    }

    const statusData = await statusResponse.json();
    registrationOpen = statusData?.data === true;

    const programsRes = await fetch(
      `http://internalplacementapi.runasp.net/api/Student/GetAvailablePrograms?ssn=${ssn}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!programsRes.ok) {
      throw new Error(`فشل تحميل البرامج: ${programsRes.status}`);
    }

    const res = await programsRes.json();

    if (res.isSuccess && res.data && res.data.$values?.length > 0) {
      list.innerHTML = "";

      res.data.$values.forEach((program) => {
        const li = document.createElement("li");
        li.innerHTML = `${program}<span>⋮⋮</span>`;
        if (registrationOpen) {
          li.setAttribute("draggable", "true");
        } else {
          li.classList.add("disabled");
        }
        list.appendChild(li);
      });
    } else {
      dragText.textContent = "لا توجد برامج متاحة حاليًا.";
    }

    if (!registrationOpen) {
      submitBtn.classList.add("none");
      dragText.innerHTML = "...تم غلق باب التسجيل . ستظهر النتيجة قريبا";

      const resultResponse = await fetch(
        `http://internalplacementapi.runasp.net/api/Student/GetStudentResult?ssn=${ssn}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!resultResponse.ok) {
        throw new Error(`فشل تحميل النتيجة: ${resultResponse.status}`);
      }

      const resultData = await resultResponse.json();

      if (
        resultData?.isSuccess === true &&
        typeof resultData.data === "string" &&
        resultData.data.trim() !== "" &&
        resultData.data !== "No result available."
      ) {
        head.textContent = ":نتيجتك هي";
        resultBox.textContent = resultData.data;

        dragList.classList.add("none");
        resultSection.classList.remove("none");
      } else {
        head.textContent = "لم يتم إعلان النتيجة بعد.";
      }
    }
  } catch (error) {
    dragText.textContent = "حدث خطأ أثناء تحميل البيانات.";
  }

  async function loadUserData() {
    try {
      const name = sessionStorage.getItem("name");
      const field = sessionStorage.getItem("field");

      const nameElement = document.getElementById("userName");
      const ssnElement = document.getElementById("ssn");
      const fieldElement = document.getElementById("field");

      if (name && !nameElement.textContent.includes(name)) {
        nameElement.textContent += name;
      }

      if (ssn && !ssnElement.textContent.includes(ssn)) {
        ssnElement.textContent += ssn;
      }

      if (field && !fieldElement.textContent.includes(field)) {
        fieldElement.textContent += field;
      }
    } catch (error) {
      alert("فشل تحميل بيانات المستخدم:");
    }
  }
};

// انتهاء الجلسه
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
    alert("⚠️خطأ أثناء التحقق من صلاحية الجلسة:");
    return false;
  }
}

async function submitList() {
  try {
    const ssn = sessionStorage.getItem("ssn");
    const token = sessionStorage.getItem("token");

    const listItems = document.querySelectorAll("#sortableList li");
    if (listItems.length === 0) {
      alert("لم يتم تحديد أي رغبات");
      return;
    }

    const preferences = Array.from(listItems).map((li, index) => ({
      name: li.textContent.replace("⋮⋮", "").trim(),
      order: index + 1,
    }));

    const payload = { ssn, preferences };

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
    }
  } catch (error) {
    alert("حدث خطأ أثناء إرسال التفضيلات.");
  }
}

function openPhonePopup() {
  document.getElementById("phonePopup").classList.remove("none");
}

async function submitPhone() {
  const phone = document.getElementById("phoneNumber").value.trim();

  if (!/^01[0-2,5]{1}[0-9]{8}$/.test(phone)) {
    alert("رقم الهاتف غير صحيح. يرجى إدخال رقم مصري صحيح.");
    return;
  }

  try {
    const ssn = sessionStorage.getItem("ssn");
    const token = sessionStorage.getItem("token");

    const payload = {
      ssn,
      phoneNumber: phone,
    };

    const response = await fetch(
      "http://internalplacementapi.runasp.net/api/Admin/SaveStudentPhoneNumber",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      }
    );

    if (response.ok) {
      document.getElementById("phonePopup").classList.add("none");
      await submitList();
    } else {
      alert("فشل إرسال رقم الهاتف");
    }
  } catch (error) {
    alert("حدث خطأ أثناء إرسال رقم الهاتف.");
  }
}
