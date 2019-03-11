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
            // 起動中のロゴが消えたらセンサデータを Unity アプリケーションに送信する
            if(gameInstance.logo.style.display == "none"){
                if(useCamera){
                    // カメラ画像を送信
                    let img = capture();
                    gameInstance.SendMessage('SensorManager', 'UpdateCameraImage', img);
                }
                // 回転、加速度、緯度経度を送信
                gameInstance.SendMessage('SensorManager', 'UpdateEulerAngles', JSON.stringify(eulerAngles));
                gameInstance.SendMessage('SensorManager', 'UpdateAcceleration', JSON.stringify(acceleration));
                gameInstance.SendMessage('SensorManager', 'UpdateGpsPosition', JSON.stringify(gpsPosition));
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

    // 現在位置を取得する際のパラメータ
    let geoOptions = {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 0
    }

    // 現在位置を取得開始
    navigator.geolocation.watchPosition(
        function(pos){
            // 位置取得成功時のコールバック
            // 緯度経度を取得
            let coords = pos.coords;
            gpsPosition.latitude = coords.latitude;
            gpsPosition.longitude = coords.longitude;
        },
        function(err){
            // 位置取得失敗時のコールバック
            console.warn('ERROR(' + err.code + '): ' + err.message);
        },
        geoOptions);
};
