// 전역 상태 관리
const appState = {
  departure: { lat: 35.838, lng: 129.212 }, // 기본 위치: 경주 중심
  walkType: 'loop',
  targetDistance: 3,
};

let map; // Leaflet 지도 객체
let markersGroup; // 지도 핀 그룹
let polylineGroup; // 지도 경로선 그룹

// 경주 코스 Mock Data (실제 위도/경도 포함)
const gyeongjuCourses = [
  {
    id: 1,
    name: "첨성대·인왕동 고분군 둘레길",
    distance: 3.0,
    time: "45분",
    type: "loop",
    safeRatio: "85%",
    warningRatio: "15%",
    desc: "잔디밭과 흙길 위주, 보행자 전용 구역 비율이 높음",
    // 안전구간(초록선) 좌표
    safePath: [
      [35.8347, 129.2181],
      [35.8360, 129.2190],
      [35.8375, 129.2185],
      [35.8380, 129.2160]
    ],
    // 주의구간(주황선) 좌표
    warningPath: [
      [35.8380, 129.2160],
      [35.8365, 129.2145],
      [35.8347, 129.2181]
    ]
  },
  {
    id: 2,
    name: "보문호반길 코스",
    distance: 5.0,
    time: "1시간 15분",
    type: "loop",
    safeRatio: "100%",
    warningRatio: "0%",
    desc: "전 구간 차도 완벽 분리 데크길, 편의시설 풍부",
    safePath: [
      [35.8420, 129.2800],
      [35.8440, 129.2850],
      [35.8410, 129.2900],
      [35.8380, 129.2850],
      [35.8420, 129.2800]
    ],
    warningPath: []
  }
];

document.addEventListener('DOMContentLoaded', () => {
  // 1. 지도 초기화 (경주 중심으로 설정)
  initMap();

  // DOM 요소
  const btnGps = document.getElementById('btn-gps');
  const inputAddress = document.getElementById('input-address');
  const toggleBtns = document.querySelectorAll('.btn-toggle');
  const chips = document.querySelectorAll('.chip');
  const btnFind = document.getElementById('btn-find-course');

  // 2. 지도 생성 함수
  function initMap() {
    // 경주 시청 근처 좌표로 기본 이동
    map = L.map('map').setView([appState.departure.lat, appState.departure.lng], 14);

    // OpenStreetMap 타일 레이어 추가
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(map);

    markersGroup = L.layerGroup().addTo(map);
    polylineGroup = L.layerGroup().addTo(map);

    // 출발지 기본 마커 생성
    L.marker([appState.departure.lat, appState.departure.lng])
      .addTo(markersGroup)
      .bindPopup("<b>현재 설정된 출발지</b><br>경주 중심")
      .openPopup();
  }

  // 3. GPS 기능
  btnGps.addEventListener('click', () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          appState.departure = { lat, lng };

          map.setView([lat, lng], 15);
          markersGroup.clearLayers();
          
          L.marker([lat, lng])
            .addTo(markersGroup)
            .bindPopup("<b>내 위치 (GPS)</b>")
            .openPopup();

          inputAddress.value = "현재 위치 (GPS 수신 완료)";
        },
        () => alert("위치 정보를 불러올 수 없습니다.")
      );
    }
  });

  // 4. UI 필터 토글 이벤트
  toggleBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      toggleBtns.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      appState.walkType = e.target.dataset.type;
    });
  });

  chips.forEach(chip => {
    chip.addEventListener('click', (e) => {
      chips.forEach(c => c.classList.remove('active'));
      e.target.classList.add('active');
      appState.targetDistance = parseFloat(e.target.dataset.val);
    });
  });

  // 5. 코스 찾기 클릭 ➔ 지도에 코스 경로선(Polyline) 그리기
  btnFind.addEventListener('click', () => {
    polylineGroup.clearLayers(); // 기존 그려진 선 제거

    const filtered = gyeongjuCourses.filter(c => c.type === appState.walkType || true);
    
    filtered.forEach(course => {
      // 안전 구간 (초록색 선)
      if (course.safePath && course.safePath.length > 0) {
        L.polyline(course.safePath, { color: '#40c057', weight: 6, opacity: 0.8 }).addTo(polylineGroup);
      }
      // 주의 구간 (주황색 선)
      if (course.warningPath && course.warningPath.length > 0) {
        L.polyline(course.warningPath, { color: '#fd7e14', weight: 6, opacity: 0.8, dashArray: '8, 8' }).addTo(polylineGroup);
      }
    });

    // 첫 번째 코스 위치로 지도 이동
    if (filtered.length > 0 && filtered[0].safePath.length > 0) {
      map.panTo(filtered[0].safePath[0]);
    }

    renderCourseCards(filtered);
  });

  // 하단 결과 카드 생성
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
      resultsContainer.appendChild(card);
    });
  }
});
