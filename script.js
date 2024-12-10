const video = document.getElementById('video');
const expressionDiv = document.getElementById('expression');
const colorBox = document.getElementById('colorBox'); 
const clickText = document.getElementById('clickText');
const title = document.querySelector('h1');
const subtitle = document.querySelector('p');
const emotionResult = document.getElementById('emotionResult');
const mainEmotionText = document.getElementById('mainEmotion');
const finalColorBox = document.getElementById('finalColorBox');
let finalColor = '';
let mainEmotion = '';

// 감정별 추천 문구 및 음악 파일 경로
const emotionData = {
    anger: {
        message: "화가 날 땐 잠시 심호흡을 해보세요. 마음을 차분히 가다듬으면 새로운 시야가 열립니다.",
        audio: './audio/anger.mp3',
    },
    happy: {
        message: "행복한 순간을 마음껏 만끽하세요! 이 순간을 사진으로 남겨보는 건 어떨까요?",
        audio: './audio/happy.mp3',
    },
    sad: {
        message: "슬플 땐 감정을 충분히 느껴보세요. 하지만 곧 더 나은 날이 올 거예요.",
        audio: './audio/sad.mp3',
    },
    neutral: {
        message: "지금의 차분함을 유지하며 스스로에게 집중해보는 시간을 가져보세요.",
        audio: './audio/neutral.mp3',
    },
    surprised: {
        message: "놀랐다면, 그 놀라움을 즐겨보세요! 새로운 경험이 당신을 기다리고 있어요.",
        audio: './audio/surprised.mp3',
    },
    fear: {
        message: "두려움을 느낄 땐 스스로를 믿으세요. 당신은 충분히 이겨낼 수 있습니다.",
        audio: './audio/fear.mp3',
    },
};

// Audio 객체를 감정별로 저장
let audioMap = {};

// 초기 상태: 클릭 텍스트를 필요할 때만 표시
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        clickText.style.display = 'block'; // 화면 초기 표시
    }, 2000); // 텍스트 표시 시간을 2초로 조정
});

// 클릭 시 이벤트: 모든 음악을 초기화하고 감정 인식 준비
clickText.addEventListener('click', () => {
    clickText.style.display = 'none'; // 클릭 후 텍스트 숨김

    // Audio 객체 초기화 및 볼륨 설정
    Object.keys(emotionData).forEach(emotion => {
        const audio = new Audio(emotionData[emotion].audio);
        audio.volume = 0;
        audio.loop = true;
        audioMap[emotion] = audio;
        audio.play().catch(err => console.error(`오디오 재생 오류 (${emotion}):`, err)); // 오디오 재생 오류 처리
    });

    title.style.display = 'none';
    subtitle.textContent = "잠시 후 카메라가 켜집니다. 카메라를 보며 담고 싶은 감정을 표정으로 드러내주세요.";
    setTimeout(() => {
        subtitle.style.display = 'none';
        startVideo();
        video.style.display = 'block';
        colorBox.style.display = 'block';
        expressionDiv.style.display = 'block';

        // 5초 후 컬러와 메인 감정을 저장하고 카메라 종료
        setTimeout(() => {
            stopVideo();
            showFinalResult();
        }, 5000);
    }, 3000); // 안내 문구 후 3초 대기
});

// 모델 파일 로드
Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri('./models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('./models'),
    faceapi.nets.faceRecognitionNet.loadFromUri('./models'),
    faceapi.nets.faceExpressionNet.loadFromUri('./models')
]);

function startVideo() {
    navigator.mediaDevices.getUserMedia({ video: {} })
        .then(stream => video.srcObject = stream)
        .catch(err => console.error(err));
}

function stopVideo() {
    const stream = video.srcObject;
    const tracks = stream.getTracks();

    tracks.forEach(track => track.stop());
    video.srcObject = null;
}

function showFinalResult() {
    video.style.display = 'none';
    colorBox.style.display = 'none';
    expressionDiv.style.display = 'none';

    emotionResult.style.display = 'block';
    finalColorBox.style.width = '400px';
    finalColorBox.style.height = '200px';
    finalColorBox.style.margin = '20px auto';
    finalColorBox.style.background = finalColor;

    // 메인 감정 텍스트 출력
    mainEmotionText.textContent = mainEmotion;

    // 메인 감정의 음악 볼륨 높이기
    Object.values(audioMap).forEach(audio => audio.volume = 0); // 모든 음악 볼륨 0으로 설정
    if (audioMap[mainEmotion]) {
        audioMap[mainEmotion].volume = 1; // 메인 감정 음악 볼륨 높임
    }
}

video.addEventListener('play', () => {
    setInterval(async () => {
        const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceExpressions();

        if (detections.length > 0) {
            const expressions = detections[0].expressions;

            const anger = expressions.anger || 0;
            const happy = expressions.happy || 0;
            const sad = expressions.sad || 0;
            const neutral = expressions.neutral || 0;
            const surprised = expressions.surprised || 0;
            const fear = expressions.fear || 0;

            const red = Math.round(
                anger * 255 +
                happy * 255 +
                surprised * 255 +
                fear * 128
            );
            const green = Math.round(
                happy * 255 +
                neutral * 255 +
                surprised * 165
            );
            const blue = Math.round(
                sad * 255 +
                neutral * 255 +
                fear * 255
            );

            finalColor = `rgb(${red}, ${green}, ${blue})`; // 최종 컬러 저장
            colorBox.style.background = finalColor;

            mainEmotion = Object.keys(expressions).reduce((a, b) =>
                expressions[a] > expressions[b] ? a : b
            );

            expressionDiv.textContent = `Detected Expression: ${mainEmotion}`;
        }
    }, 100);
});
