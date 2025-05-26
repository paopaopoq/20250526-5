let video;
let facemesh;
let predictions = [];
let handPose;
let hands = [];

function setup() {
  createCanvas(640, 480).position(
    (windowWidth - 640) / 2,
    (windowHeight - 480) / 2
  );
  video = createCapture(VIDEO);
  video.size(width, height);
  video.hide();

  facemesh = ml5.facemesh(video, modelReady);
  facemesh.on('predict', results => {
    predictions = results;
  });

  handPose = ml5.handpose(video, handReady);
  handPose.on('predict', results => {
    hands = results;
  });
}

function modelReady() {
  // FaceMesh模型載入完成
}

function handReady() {
  // Handpose模型載入完成
}

function draw() {
  image(video, 0, 0, width, height);

  if (predictions.length > 0) {
    const keypoints = predictions[0].scaledMesh;
    let [x, y] = keypoints[1]; // 預設鼻子

    // 根據手勢移動圓圈
    if (hands.length > 0) {
      const hand = hands[0];
      const fingerCount = countExtendedFingers(hand);

      if (fingerCount === 2) {
        // 剪刀：額頭正中間（第10點）
        [x, y] = keypoints[10];
      } else if (fingerCount === 0) {
        // 石頭：兩邊臉頰（第234點和第454點的中點）
        const [x1, y1] = keypoints[234];
        const [x2, y2] = keypoints[454];
        x = (x1 + x2) / 2;
        y = (y1 + y2) / 2;
      } else if (fingerCount === 5) {
        // 布：兩隻眼睛（第33點和第263點的中點）
        const [x1, y1] = keypoints[33];
        const [x2, y2] = keypoints[263];
        x = (x1 + x2) / 2;
        y = (y1 + y2) / 2;
      }
    }

    // 畫圓圈
    noFill();
    stroke(255, 0, 0);
    strokeWeight(4);
    ellipse(x, y, 50, 50);
  }

  // 顯示手部關鍵點
  if (hands.length > 0) {
    for (let hand of hands) {
      if (hand.handInViewConfidence > 0.1) {
        for (let i = 0; i < hand.landmarks.length; i++) {
          let keypoint = hand.landmarks[i];
          fill(0, 255, 255);
          noStroke();
          circle(keypoint[0], keypoint[1], 10);
        }
      }
    }
  }
}

// 計算伸出的手指數量
function countExtendedFingers(hand) {
  // hand.annotations.fingerName: [[x, y, z], ...]
  let count = 0;
  const palm = hand.annotations.palmBase[0];
  const fingers = ['thumb', 'indexFinger', 'middleFinger', 'ringFinger', 'pinky'];
  for (let finger of fingers) {
    const tip = hand.annotations[finger][3];
    const d = dist(palm[0], palm[1], tip[0], tip[1]);
    if (d > 60) count++;
  }
  return count;
}
