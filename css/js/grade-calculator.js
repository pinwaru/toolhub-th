const assignmentScore = document.getElementById("assignmentScore");
const midtermScore = document.getElementById("midtermScore");
const finalScore = document.getElementById("finalScore");

const calculateBtn = document.getElementById("calculateBtn");

const result = document.getElementById("result");
const totalScore = document.getElementById("totalScore");
const gradeResult = document.getElementById("gradeResult");
const gradeMessage = document.getElementById("gradeMessage");

const progressSection = document.getElementById("progressSection");
const progressFill = document.getElementById("progressFill");
const progressText = document.getElementById("progressText");

/* ========================= */
/* Grade */
/* ========================= */

function getGrade(score) {

    if (score >= 80) {

        return {
            grade: "A",
            color: "grade-a",
            message: "🎉 ยอดเยี่ยม! รักษามาตรฐานนี้ไว้"
        };

    }

    if (score >= 75) {

        return {
            grade: "B+",
            color: "grade-b",
            message: "👏 ดีมาก เหลืออีกนิดก็ A"
        };

    }

    if (score >= 70) {

        return {
            grade: "B",
            color: "grade-b",
            message: "👍 ผลการเรียนอยู่ในเกณฑ์ดี"
        };

    }

    if (score >= 65) {

        return {
            grade: "C+",
            color: "grade-c",
            message: "🙂 ยังพัฒนาได้อีก"
        };

    }

    if (score >= 60) {

        return {
            grade: "C",
            color: "grade-c",
            message: "📚 ควรทบทวนบทเรียนเพิ่ม"
        };

    }

    if (score >= 55) {

        return {
            grade: "D+",
            color: "grade-d",
            message: "⚠️ ผ่านแบบหวุดหวิด"
        };

    }

    if (score >= 50) {

        return {
            grade: "D",
            color: "grade-d",
            message: "⚠️ ผ่านขั้นต่ำ"
        };

    }

    return {
        grade: "F",
        color: "grade-f",
        message: "❌ ไม่ผ่าน พยายามใหม่ครั้งหน้า"
    };

}

/* ========================= */
/* Calculate */
/* ========================= */

function calculateGrade() {

    const assignment = parseFloat(assignmentScore.value) || 0;
    const midterm = parseFloat(midtermScore.value) || 0;
    const finalExam = parseFloat(finalScore.value) || 0;

    if (
        assignment < 0 ||
        assignment > 40 ||
        midterm < 0 ||
        midterm > 30 ||
        finalExam < 0 ||
        finalExam > 30
    ) {

        alert("กรุณากรอกคะแนนให้ถูกต้อง");

        return;

    }

    const score = assignment + midterm + finalExam;

    const gradeData = getGrade(score);

    result.style.display = "block";
    progressSection.style.display = "block";

    totalScore.textContent =
        score.toFixed(2) + " คะแนน";

    gradeResult.textContent =
        gradeData.grade;

    gradeMessage.textContent =
        gradeData.message;

    gradeResult.className =
        gradeData.color;

    progressFill.style.width =
        score + "%";

    progressText.textContent =
        score.toFixed(2) + "%";

}

/* ========================= */
/* Event */
/* ========================= */

calculateBtn.addEventListener("click", calculateGrade);

/* ========================= */
/* Enter Key Support */
/* ========================= */

document.addEventListener("keydown", (e) => {

    if (e.key === "Enter") {

        e.preventDefault();

        calculateGrade();

    }

});

/* ========================= */
/* Auto Reset Result */
/* ========================= */

[
    assignmentScore,
    midtermScore,
    finalScore
].forEach(input => {

    input.addEventListener("input", () => {

        result.style.display = "none";

        progressSection.style.display = "none";

    });

});

/* ========================= */
/* Input Validation */
/* ========================= */

assignmentScore.addEventListener("input", () => {

    if (assignmentScore.value > 40) {

        assignmentScore.value = 40;

    }

    if (assignmentScore.value < 0) {

        assignmentScore.value = 0;

    }

});

midtermScore.addEventListener("input", () => {

    if (midtermScore.value > 30) {

        midtermScore.value = 30;

    }

    if (midtermScore.value < 0) {

        midtermScore.value = 0;

    }

});

finalScore.addEventListener("input", () => {

    if (finalScore.value > 30) {

        finalScore.value = 30;

    }

    if (finalScore.value < 0) {

        finalScore.value = 0;

    }

});

/* ========================= */
/* Initial State */
/* ========================= */

result.style.display = "none";

progressSection.style.display = "none";

progressFill.style.width = "0%";

progressText.textContent = "0%";
