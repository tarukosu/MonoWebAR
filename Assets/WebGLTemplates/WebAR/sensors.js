// ページロード後に実行
window.onload = function () {
    'use strict';

    // カメラ映像の取得
    let useCamera = true;
    if(useCamera){
        let video = document.getElementById("video");
        // メディアデバイスへのアクセス
        let media = navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: "environment", // 背面カメラを指定
                width: {max: 640} //解像度を指定
            },
            audio: false, // 音声は利用しない
        });

        // video タグにカメラ画像を表示
        media.then((stream) => {
            video.srcObject = stream;
        });

        // カメラ映像を画像データに変換するために、キャンバスを利用
        let canvas = document.getElementById("canvas");
        let ctx = canvas.getContext("2d");

        // canvas, video は画面には表示しない
        canvas.style.display = "none";
        video.style.display = "none";

        function capture() {
            // 解像度が高いと処理に時間がかかるため、サイズを 1/4 にする
            canvas.width = video.videoWidth / 4;
            canvas.height = video.videoHeight / 4;
            // カメラ映像をキャンバスに書き出し、png 形式で返す
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            return canvas.toDataURL('image/png');
        }
    }

    // センサー値の初期値を設定
    let eulerAngles = {
        x:0,
        y:0,
        z:0
    }

    let acceleration = {
        x: 0,
        y: 0,
        z: 0
    }

    let gpsPosition = {
        latitude : 0,
        longitude: 0
    }


    // ブラウザが画面を更新するたびに、onAnimate が呼ばれる
    function onAnimate () {
        try{
            // センサデータを Unity アプリケーションに送信する
            if(gameInstance.logo.style.display == "none"){
                var img = capture();
                gameInstance.SendMessage('SensorManager', 'UpdateEulerAngles', JSON.stringify(eulerAngles));
                gameInstance.SendMessage('SensorManager', 'UpdateAcceleration', JSON.stringify(acceleration));
                gameInstance.SendMessage('SensorManager', 'UpdateGpsPosition', JSON.stringify(gpsPosition));
                gameInstance.SendMessage('SensorManager', 'UpdateCameraImage', img);
            }
        }catch(e){
            console.log(e);
        }
        window.requestAnimationFrame(onAnimate);
    }
    window.requestAnimationFrame(onAnimate);

    // デバイスの回転を取得
    function deviceOrientationHandler(e){
        eulerAngles.z = e.gamma;
        eulerAngles.y = e.beta;
        eulerAngles.x = e.alpha;
    }
    if (window.DeviceOrientationEvent) {
        window.addEventListener('deviceorientation', deviceOrientationHandler, false);
    }

    // デバイスの動きを取得
    function deviceMotionHandler(e){
        acceleration.x = e.acceleration.x;
        acceleration.y = e.acceleration.y;
        acceleration.z = e.acceleration.z;
    }
    if(window.DeviceMotionEvent){
        window.addEventListener('devicemotion', deviceMotionHandler, true);
    }

    // 現在位置（緯度、経度）を取得
    var options = {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 0
    }

    function success(pos) {
        var coords = pos.coords;
        gpsPosition.latitude = coords.latitude;
        gpsPosition.longitude = coords.longitude;
    }

    function error(err) {
        console.warn('ERROR(' + err.code + '): ' + err.message);
    }

    navigator.geolocation.watchPosition(success, error, options);
};
