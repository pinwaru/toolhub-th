const subjects = document.getElementById("subjects");
const template = document.getElementById("subjectTemplate");

const addSubjectBtn = document.getElementById("addSubject");
const calculateBtn = document.getElementById("calculateBtn");
const resetBtn = document.getElementById("resetBtn");

const gpaResult = document.getElementById("gpaResult");
const subjectCount = document.getElementById("subjectCount");
const totalCredits = document.getElementById("totalCredits");
const totalPoints = document.getElementById("totalPoints");

/* =======================================
   เพิ่มรายวิชา
======================================= */

function addSubject(
    name = "",
    credit = "",
    grade = "4"
){

    const clone =
        template.content.cloneNode(true);

    const row =
        clone.querySelector(".subject-row");

    row.querySelector(".subject-name").value = name;

    row.querySelector(".subject-credit").value = credit;

    row.querySelector(".subject-grade").value = grade;

    row.querySelector(".delete-subject")
        .addEventListener("click", () => {

            if (
                document.querySelectorAll(".subject-row").length === 1
            ) {

                alert("ต้องมีอย่างน้อย 1 รายวิชา");

                return;

            }

            row.remove();

        });

    subjects.appendChild(clone);

}

/* =======================================
   คำนวณ GPA
======================================= */

function calculateGPA(){

    const rows =
        document.querySelectorAll(".subject-row");

    let credits = 0;

    let points = 0;

    let count = 0;

    for(const row of rows){

        const credit =
            parseFloat(
                row.querySelector(".subject-credit").value
            );

        const grade =
            parseFloat(
                row.querySelector(".subject-grade").value
            );

        if(

            isNaN(credit)

            ||

            credit <= 0

        ){

            continue;

        }

        credits += credit;

        points += credit * grade;

        count++;

    }

    if(

        credits === 0

    ){

        alert("กรุณากรอกหน่วยกิต");

        return;

    }

    const gpa =
        points / credits;

    gpaResult.textContent =
        gpa.toFixed(2);

    subjectCount.textContent =
        count;

    totalCredits.textContent =
        credits.toFixed(1);

    totalPoints.textContent =
        points.toFixed(2);

}

/* =======================================
   รีเซ็ต
======================================= */

function resetCalculator(){

    subjects.innerHTML = "";

    addSubject();

    gpaResult.textContent = "0.00";

    subjectCount.textContent = "0";

    totalCredits.textContent = "0";

    totalPoints.textContent = "0.00";

}

/* =======================================
   Event
======================================= */

addSubjectBtn.addEventListener("click", () => {

    addSubject();

});

calculateBtn.addEventListener("click", () => {

    calculateGPA();

});

resetBtn.addEventListener("click", () => {

    const confirmReset = confirm(
        "ต้องการล้างข้อมูลทั้งหมดหรือไม่?"
    );

    if(confirmReset){

        resetCalculator();

    }

});

/* =======================================
   Keyboard Support
======================================= */

document.addEventListener("keydown",(e)=>{

    // ไม่ดักปุ่มเมื่อกำลังพิมพ์ใน input/select/textarea
    if(

        e.target.tagName==="INPUT"

        ||

        e.target.tagName==="TEXTAREA"

        ||

        e.target.tagName==="SELECT"

    ){

        return;

    }

    switch(e.key){

        case "Enter":

            e.preventDefault();

            calculateGPA();

            break;

        case "Insert":

            e.preventDefault();

            addSubject();

            break;

        case "Delete":

            e.preventDefault();

            resetCalculator();

            break;

    }

});

/* =======================================
   เริ่มต้นเมื่อโหลดหน้าเว็บ
======================================= */

window.addEventListener("DOMContentLoaded",()=>{

    // สร้างรายวิชาเริ่มต้น 1 แถว
    addSubject();

});
