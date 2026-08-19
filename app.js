// 애플리케이션 상태
const appState = {
  departure: { lat: 35.8381, lng: 129.2118 }, // 기본 위치: 경주시청 근처
  walkType: 'loop',
  targetDistance: 3,
};

let map;
let departureMarker;
let routeLayers = [];

// 실제 도로/인도 기반 경주 샘플 코스 데이터 (위도, 경도 좌표 정확히 조정)
const gyeongjuCourses = [
  {
    id: 1,
    name: "첨성대·인왕동 고분군 둘레길",
    distance: 3.0,
    time: "45분",
    type: "loop",
    safeRatio: "85%",
    warningRatio: "15%",
    desc: "인도 전용 산책로 위주, 잔디밭과 흙길 포함 코스",
    // 인도(안전구간): 초록색 실선
    safePath: [
      [35.8352, 129.2188],
      [35.8368, 129.2195],
      [35.8378, 129.2173],
      [35.8362, 129.2148]
    ],
    // 차도 혼용(주의구간): 주황색 점선
    warningPath: [
      [35.8362, 129.2148],
      [35.8348, 129.2160],
      [35.8352, 129.2188]
    ]
  },
  {
    id: 2,
    name: "보문호반길 데크 코스",
    distance: 5.0,
    time: "1시간 15분",
    type: "loop",
    safeRatio: "100%",
    warningRatio: "0%",
    desc: "차도 완벽 분리 인도/데크길, 안전성 우수",
    safePath: [
      [35.8423, 129.2801],
      [35.8451, 129.2858],
      [35.8415, 129.2912],
      [35.8378, 129.2862],
      [35.8423, 129.2801]
    ],
    warningPath: []
  },
  {
    id: 3,
    name: "황리단길-교촌마을 골목길",
    distance: 1.0,
    time: "20분",
    type: "oneway",
    safeRatio: "40%",
    warningRatio: "60%",
    desc: "골목길 차량 유의 필요, 애견동반 매장 다수",
    safePath: [
      [35.8315, 129.2155],
      [35.8302, 129.2140]
    ],
    warningPath: [
      [35.8380, 129.2100],
      [35.8345, 129.2120],
      [35.8315, 129.2155]
    ]
  }
];

document.addEventListener('DOMContentLoaded', () => {
  initMap();
  setupEventListeners();
});

// 1. 지도 초기화
function initMap() {
  map = L.map('map').setView([appState.departure.lat, appState.departure.lng], 14);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
  }).addTo(map);

  setDepartureMarker(appState.departure.lat, appState.departure.lng, "기본 출발지 (경주)");
}

// 2. 출발지 마커 표시
function setDepartureMarker(lat, lng, title) {
  if (departureMarker) {
    map.removeLayer(departureMarker);
  }

  departureMarker = L.marker([lat, lng])
    .addTo(map)
    .bindPopup(`<b>출발지</b><br>${title}`)
    .openPopup();

  map.setView([lat, lng], 15);
  appState.departure = { lat, lng };
}

// 3. 주소 검색 기능 (OpenStreetMap Nominatim API 활용 - CORS/에러 방지)
async function searchAddress(query) {
  if (!query.trim()) {
    alert("검색할 주소나 장소명을 입력하세요.");
    return;
  }

  // 경주 지역 우선 검색을 위해 검색어 보정
  const searchQuery = query.includes("경주") ? query : `경주시 ${query}`;
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data && data.length > 0) {
      const topResult = data[0];
      const lat = parseFloat(topResult.lat);
      const lng = parseFloat(topResult.lon);

      setDepartureMarker(lat, lng, topResult.display_name.split(',')[0]);
    } else {
      alert("주소를 찾을 수 없습니다. 도로명 또는 지역명을 다시 확인해주세요.");
    }
  } catch (error) {
    console.error("주소 검색 오류:", error);
    alert("주소 검색 도중 오류가 발생했습니다.");
  }
}

// 4. 지도상에 코스(인도/차도) 선 그리기
function drawCoursesOnMap(courses) {
  // 기존 선 제거
  routeLayers.forEach(layer => map.removeLayer(layer));
  routeLayers = [];

  if (courses.length === 0) return;

  const bounds = L.latLngBounds();

  courses.forEach(course => {
    // 인도(안전): 초록색 실선
    if (course.safePath && course.safePath.length > 0) {
      const safeLine = L.polyline(course.safePath, {
        color: '#2b8a3e',
        weight: 6,
        opacity: 0.85
      }).addTo(map);

      safeLine.bindPopup(`<b>${course.name}</b><br>🟢 인도 전용 구간`);
      routeLayers.push(safeLine);
      course.safePath.forEach(pt => bounds.extend(pt));
    }

    // 차도(주의): 주황색 점선
    if (course.warningPath && course.warningPath.length > 0) {
      const warningLine = L.polyline(course.warningPath, {
        color: '#e8590c',
        weight: 6,
        opacity: 0.85,
        dashArray: '8, 8'
      }).addTo(map);

      warningLine.bindPopup(`<b>${course.name}</b><br>🟠 차도 혼용 주의 구간`);
      routeLayers.push(warningLine);
      course.warningPath.forEach(pt => bounds.extend(pt));
    }
  });

  // 그린 선들이 지도에 모두 보이도록 영역 자동 맞춤
  if (bounds.isValid()) {
    map.fitBounds(bounds, { padding: [50, 50] });
  }
}

// 5. 이벤트 리스너 설정
function setupEventListeners() {
  const btnSearch = document.getElementById('btn-search');
  const inputAddress = document.getElementById('input-address');
  const btnGps = document.getElementById('btn-gps');
  const toggleBtns = document.querySelectorAll('.btn-toggle');
  const chips = document.querySelectorAll('.chip');
  const btnFind = document.getElementById('btn-find-course');

  // 주소 검색 (버튼 및 엔터키)
  btnSearch.addEventListener('click', () => searchAddress(inputAddress.value));
  inputAddress.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchAddress(inputAddress.value);
  });

  // GPS 버튼
  btnGps.addEventListener('click', () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setDepartureMarker(pos.coords.latitude, pos.coords.longitude, "현재 위치 (GPS)");
          inputAddress.value = "현재 위치 수신 완료";
        },
        () => alert("위치 권한을 허용해주세요.")
      );
    }
  });

  // 산책 유형 토글
  toggleBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      toggleBtns.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      appState.walkType = e.target.dataset.type;
    });
  });

  // 거리 목표 선택
  chips.forEach(chip => {
    chip.addEventListener('click', (e) => {
      chips.forEach(c => c.classList.remove('active'));
      e.target.classList.add('active');
      appState.targetDistance = parseFloat(e.target.dataset.val);
    });
  });

  // 코스 찾기 실행
  btnFind.addEventListener('click', () => {
    const filtered = gyeongjuCourses.filter(c => c.type === appState.walkType);
    const targetCourses = filtered.length > 0 ? filtered : gyeongjuCourses;

    drawCoursesOnMap(targetCourses);
    renderCourseCards(targetCourses);
  });
}

// 6. 하단 결과 카드 출력
function renderCourseCards(courses) {
  const resultsContainer = document.getElementById('course-results');
  resultsContainer.innerHTML = '';

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

    // 카드 클릭 시 해당 코스로 지도 이동
    card.addEventListener('click', () => {
      if (c.safePath.length > 0) {
        map.panTo(c.safePath[0]);
      }
    });

    resultsContainer.appendChild(card);
  });
}
