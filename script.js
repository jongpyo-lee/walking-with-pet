// 전역 상태 관리 객체
const appState = {
  departure: null, // 출발지 정보
  walkType: 'loop', // 'loop' (왕복) 또는 'oneway' (편도)
  targetDistance: 3, // 기본 3km
};

// 경주 데이터베이스 (Mock Data)
const gyeongjuCourses = [
  {
    id: 1,
    name: "첨성대·인왕동 고분군 둘레길",
    distance: 3.0,
    time: "45분",
    type: "loop",
    safeRatio: "85%",
    warningRatio: "15%",
    desc: "잔디밭과 흙길 위주, 보행자 전용 구역 비율이 높음"
  },
  {
    id: 2,
    name: "보문호반길 코스",
    distance: 5.0,
    time: "1시간 15분",
    type: "loop",
    safeRatio: "100%",
    warningRatio: "0%",
    desc: "전 구간 차도 완벽 분리 데크길, 편의시설 풍부"
  },
  {
    id: 3,
    name: "황리단길-월정교 편도 트레일",
    distance: 3.0,
    time: "40분",
    type: "oneway",
    safeRatio: "60%",
    warningRatio: "40%",
    desc: "골목길 차도 주의 구간 포함, 주변 애견동반 카페 다수"
  },
  {
    id: 4,
    name: "신라왕경숲 장거리 코스",
    distance: 10.0,
    time: "2시간 30분",
    type: "loop",
    safeRatio: "90%",
    warningRatio: "10%",
    desc: "대형견 추천, 한적한 흙길 및 음수대 포인트 포함"
  }
];

// DOM 엘리먼트 획득
document.addEventListener('DOMContentLoaded', () => {
  const btnGps = document.getElementById('btn-gps');
  const btnSearch = document.getElementById('btn-search');
  const inputAddress = document.getElementById('input-address');
  const toggleBtns = document.querySelectorAll('.btn-toggle');
  const chips = document.querySelectorAll('.chip');
  const btnFind = document.getElementById('btn-find-course');
  const resultsContainer = document.getElementById('course-results');
  const statusText = document.getElementById('map-status-text');

  // 1. GPS 위치 설정 이벤트
  btnGps.addEventListener('click', () => {
    if (navigator.geolocation) {
      statusText.innerText = "📍 현재 위치 확인 중...";
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          appState.departure = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          inputAddress.value = "현재 위치 (GPS 수신 완료)";
          statusText.innerText = `현재 위치 수신 성공! (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`;
        },
        () => {
          alert("위치 정보를 가져올 수 없습니다. 주소를 직접 입력해주세요.");
        }
      );
    }
  });

  // 2. 산책 유형(왕복/편도) 토글 이벤트
  toggleBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      toggleBtns.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      appState.walkType = e.target.dataset.type;
    });
  });

  // 3. 목표 거리(Chip) 선택 이벤트
  chips.forEach(chip => {
    chip.addEventListener('click', (e) => {
      chips.forEach(c => c.classList.remove('active'));
      e.target.classList.add('active');
      appState.targetDistance = parseFloat(e.target.dataset.val);
    });
  });

  // 4. 코스 검색 버튼 클릭 처리
  btnFind.addEventListener('click', () => {
    if (!appState.departure && !inputAddress.value) {
      alert("출발지(주소 또는 현위치)를 설정해주세요.");
      return;
    }

    // 조건에 어울리는 데이터 필터링
    const filtered = gyeongjuCourses.filter(course => {
      const isTypeMatch = course.type === appState.walkType;
      const isDistMatch = Math.abs(course.distance - appState.targetDistance) <= 2; // ±2km 범위
      return isTypeMatch || isDistMatch;
    });

    renderCourseCards(filtered);
    statusText.innerText = `검색 완료: ${filtered.length}개의 맞춤 코스를 찾았습니다.`;
  });

  // 결과 카드 랜더링 함수
  function renderCourseCards(courses) {
    resultsContainer.innerHTML = '';

    if (courses.length === 0) {
      resultsContainer.innerHTML = `<div class="course-card"><p>조건에 맞는 코스가 없습니다. 조건(거리/유형)을 변경해보세요.</p></div>`;
      return;
    }

    courses.forEach(c => {
      const card = document.createElement('div');
      card.className = 'course-card';
      card.innerHTML = `
        <h3>${c.name}</h3>
        <p class="meta">거리: ${c.distance}km | 시간: 약 ${c.time}</p>
        <p style="font-size: 0.8rem; margin-bottom: 0.5rem; color: #495057;">${c.desc}</p>
        <div>
          <span class="badge badge-safe">인도 ${c.safeRatio}</span>
          ${c.warningRatio !== "0%" ? `<span class="badge badge-warning">차도주의 ${c.warningRatio}</span>` : ''}
        </div>
      `;
      resultsContainer.appendChild(card);
    });
  }
});
