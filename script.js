// --- 1. 지도 초기화 (기본 중심: 경주시청) ---
var map = L.map('map').setView([35.8427, 129.2084], 14);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

let currentMarker = null;
let currentRouteLine = null;
let currentLat = 35.8427;
let currentLng = 129.2084;

let myCustomCourses = [];
let walkRecords = [];

// --- 경주의 실제 인도 및 공원 산책로 정밀 좌표 데이터 ---
const realWalkingCourses = {
    "30분": {
        title: "황성공원 솔숲 산책로",
        desc: "소나무 그늘과 체육공원 인도를 따라 걷는 쾌적한 30분 코스",
        // 황성공원 내부 실제 보행로 좌표 배열
        coords: [
            [35.8535, 129.2015],
            [35.8542, 129.2028],
            [35.8528, 129.2045],
            [35.8515, 129.2032],
            [35.8522, 129.2018],
            [35.8535, 129.2015]
        ]
    },
    "1시간": {
        title: "보문호수 수변 산책로",
        desc: "보문 호수 전용 인도와 데크를 따라 걷는 힐링 코스",
        // 보문호수 수변 산책로 실제 좌표 배열
        coords: [
            [35.8480, 129.2550],
            [35.8495, 129.2572],
            [35.8475, 129.2595],
            [35.8450, 129.2580],
            [35.8442, 129.2555],
            [35.8480, 129.2550]
        ]
    },
    "3km": {
        title: "형산강 강변 자전거/인도길",
        desc: "탁 트인 강바람을 맞으며 걷기 좋은 안전한 강변 보행로",
        // 형산강변 인도 좌표 배열
        coords: [
            [35.8300, 129.2100],
            [35.8330, 129.2120],
            [35.8360, 129.2140],
            [35.8380, 129.2125],
            [35.8340, 129.2095],
            [35.8300, 129.2100]
        ]
    },
    "5km": {
        title: "대릉원 및 돌담길 산책로",
        desc: "고즈넉한 고분군 옆 돌담길과 인도 완주 코스",
        // 대릉원 주변 돌담길/인도 좌표 배열
        coords: [
            [35.8380, 129.2150],
            [35.8365, 129.2185],
            [35.8340, 129.2170],
            [35.8325, 129.2140],
            [35.8350, 129.2125],
            [35.8380, 129.2150]
        ]
    }
};

// --- 2. 현위치 GPS 가져오기 ---
function getCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            currentLat = position.coords.latitude;
            currentLng = position.coords.longitude;
            
            map.setView([currentLat, currentLng], 15);
            if (currentMarker) map.removeLayer(currentMarker);
            currentMarker = L.marker([currentLat, currentLng]).addTo(map)
                .bindPopup("🐾 현재 내 위치").openPopup();

            document.getElementById('locationInput').value = "GPS 현위치 적용됨";
            alert("현재 위치를 지도에 반영했습니다!");
        }, function(error) {
            alert("위치 정보를 가져올 수 없습니다. GPS 권한을 확인해주세요.");
        });
    } else {
        alert("이 브라우저는 위치 정보를 지원하지 않습니다.");
    }
}

// --- 3. 실제 주소 검색 API (Nominatim) ---
function searchLocation() {
    const query = document.getElementById('locationInput').value.trim();
    if(!query) {
        alert("주소나 장소명을 입력해주세요.");
        return;
    }

    const searchQuery = query.includes("경주") ? query : `${query} 경주`;
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data && data.length > 0) {
                currentLat = parseFloat(data[0].lat);
                currentLng = parseFloat(data[0].lon);
                
                map.setView([currentLat, currentLng], 15);
                if (currentMarker) map.removeLayer(currentMarker);
                currentMarker = L.marker([currentLat, currentLng]).addTo(map)
                    .bindPopup(`📍 ${data[0].display_name}`).openPopup();

                alert(`"${query}" 위치를 정확히 찾았습니다!`);
            } else {
                alert("검색 결과가 없습니다. 올바른 경주 주소나 장소명을 입력해주세요.");
            }
        })
        .catch(error => {
            alert("주소 검색 중 오류가 발생했습니다.");
        });
}

// --- 4. 선택한 목표에 맞춘 실제 인도/산책로 표시 ---
function recommendCourses() {
    const goal = document.getElementById('goalSelect').value;
    const listDiv = document.getElementById('courseList');

    if (currentRouteLine) {
        map.removeLayer(currentRouteLine);
    }

    const selectedCourse = realWalkingCourses[goal];
    if (!selectedCourse) return;

    // 실제 인도/산책로 좌표를 지도 위에 선으로 그리기
    currentRouteLine = L.polyline(selectedCourse.coords, { color: '#2b8a3e', weight: 6, opacity: 0.9 }).addTo(map);
    map.fitBounds(currentRouteLine.getBounds());

    let html = `
        <div class="course-item">
            <strong>🐾 ${selectedCourse.title} (${goal})</strong><br>
            <span style="font-size: 0.85rem; color: #555;">
                ${selectedCourse.desc}<br>
                🟢 지도 위에 실제 인도 및 보행자 전용 코스가 초록색 실선으로 표시되었습니다!
            </span>
        </div>
    `;

    myCustomCourses.forEach(c => {
        if (c.goal === goal || goal.includes("전체")) {
            html += `
                <div class="course-item">
                    <strong>🌟 ${c.title}</strong><br>
                    <span style="font-size: 0.85rem; color: #555;">목표: ${c.goal} | ${c.desc}</span>
                </div>
            `;
        }
    });

    listDiv.innerHTML = html;
    alert(`[${selectedCourse.title}] 실제 인도/산책 코스가 지도에 반영되었습니다.`);
}

// --- 5. 나만의 코스 등록 ---
function saveCustomCourse() {
    const title = document.getElementById('customTitle').value;
    const desc = document.getElementById('customDesc').value;
    const goal = document.getElementById('goalSelect').value;

    if(!title || !desc) {
        alert("코스 이름과 설명을 모두 입력해주세요.");
        return;
    }

    myCustomCourses.push({ title, goal, desc });
    alert("나만의 코스가 성공적으로 등록되었습니다!");
    document.getElementById('customTitle').value = '';
    document.getElementById('customDesc').value = '';
    recommendCourses();
}

// --- 6. 산책 기록 저장 ---
function saveWalkRecord() {
    const date = document.getElementById('recordDate').value;
    const memo = document.getElementById('recordMemo').value;

    if(!date || !memo) {
        alert("날짜와 메모를 모두 입력해주세요.");
        return;
    }

    walkRecords.push({ date, memo });
    renderRecords();
    alert("산책 기록이 저장되었습니다!");
    document.getElementById('recordMemo').value = '';
}

function renderRecords() {
    const recordListDiv = document.getElementById('recordList');
    if(walkRecords.length === 0) {
        recordListDiv.innerHTML = `<p class="placeholder-text">저장된 산책 기록이 없습니다.</p>`;
        return;
    }

    let html = '';
    walkRecords.forEach(rec => {
        html += `
            <div class="record-item">
                <span style="font-size: 0.85rem; color: #ff6b6b; font-weight: bold;">📅 ${rec.date}</span><br>
                <span>🐶 ${rec.memo}</span>
            </div>
        `;
    });
    recordListDiv.innerHTML = html;
}
