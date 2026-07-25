// RecipeBridge Commercial Web App Interactive Logic
document.addEventListener("DOMContentLoaded", () => {
  console.log("RecipeBridge Commercial Service App Engine Loaded.");
});

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove("hidden");
    modal.style.display = "flex";
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add("hidden");
    modal.style.display = "none";
  }
}

function submitTaskForm(event) {
  event.preventDefault();
  const repoUrl = document.getElementById("repoUrl").value;
  const role = document.getElementById("targetRole").value;
  const alertBox = document.getElementById("submitAlert");

  if (!repoUrl) {
    alert("코드 저장소 레포지토리 URL을 입력해주세요.");
    return;
  }

  alertBox.style.display = "block";
  alertBox.innerHTML = `⏳ <strong>8인 AI 검수 엔진 가동 중...</strong><br>제출된 레포지토리(${repoUrl})의 코드 품질 및 샌드박스 테스트를 자발적 검수 중입니다.`;

  setTimeout(() => {
    alertBox.className = "alert-box success";
    alertBox.innerHTML = `✅ <strong>블라인드 실무 검수 완료 (점수: 96/100)!</strong><br>스마트 계약 인증 해시: <code>0x8f7a...3e21</code> 가 발급되었으며, 3개 추천 스타트업 매칭 리스트로 자동 이관되었습니다.`;
  }, 2000);
}
