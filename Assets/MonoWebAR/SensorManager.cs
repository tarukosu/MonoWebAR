using UnityEngine;
using UnityEngine.UI;

public class SensorManager : MonoBehaviour
{
    // デバイスの姿勢を表すクラス
    class EulerAngles
    {
        public float x;
        public float y;
        public float z;
    }

    // デバイスの加速度を表すクラス
    class Acceleration
    {
        public float x;
        public float y;
        public float z;
    }

    // 緯度経度を表すクラス
    class GpsPosition
    {
        public float latitude;
        public float longitude;
    }

    // デバッグ用にセンサデータを表示する Text
    public Text TextForDebug;
    // カメラ画像を表示する RawImage
    public RawImage ARCameraImage;

    // カメラ画像を表示するテクスチャ
    Texture2D arCameraTexture;
    // アスペクト比を保ったまま画像を拡大するために利用するコンポーネント
    AspectRatioFitter aspectRationFitter;

    // 各データの初期化
    EulerAngles eulerAngles = new EulerAngles();
    Acceleration acceleration = new Acceleration();
    GpsPosition gpsPosition = new GpsPosition();

    void Start()
    {
#if UNITY_EDITOR
        UpdateEulerAngles("{\"x\": 270, \"y\": 30, \"z\": 0}");
#endif
    }

    // 回転を受信
    public void UpdateEulerAngles(string msg)
    {
        eulerAngles = JsonUtility.FromJson<EulerAngles>(msg);

        var rotation = Quaternion.Euler(90, 0, 0);
        rotation = rotation * Quaternion.AngleAxis(eulerAngles.x, Vector3.forward);
        rotation = rotation * Quaternion.AngleAxis(-eulerAngles.y, Vector3.right);
        rotation = rotation * Quaternion.AngleAxis(-eulerAngles.z, Vector3.up);

        // カメラの姿勢を変更
        Camera.main.transform.localRotation = rotation;
        UpdateText();
    }

    // 加速度を受信
    public void UpdateAcceleration(string msg)
    {
        acceleration = JsonUtility.FromJson<Acceleration>(msg);
        UpdateText();
    }

    // 緯度経度を受信
    public void UpdateGpsPosition(string msg)
    {
        gpsPosition = JsonUtility.FromJson<GpsPosition>(msg);
        UpdateText();
    }

    // カメラ画像を受信
    public void UpdateCameraImage(string msg)
    {
        // データの先頭についている "data:image/png;base64," という部分を取り除く
        var data = msg.Split(',');
        if (data.Length <= 1)
        {
            return;
        }
        var image = data[1];

        // テクスチャが作成されていない場合
        if (arCameraTexture == null)
        {
            // 新しいテクスチャを作成
            arCameraTexture = new Texture2D(1, 1);
            // AspectRatioFitter コンポーネントを追加
            // アスペクト比を保ったまま画像を最大化させる
            aspectRationFitter = ARCameraImage.gameObject.AddComponent<AspectRatioFitter>();
            aspectRationFitter.aspectMode = AspectRatioFitter.AspectMode.FitInParent;
        }

        // base64 エンコードされた文字列を元に戻す
        byte[] bytes = System.Convert.FromBase64String(image);
        // 画像をテクスチャにロード
        arCameraTexture.LoadImage(bytes);
        ARCameraImage.texture = arCameraTexture;

        // アスペクト比をカメラ画像に合わせて設定
        aspectRationFitter.aspectRatio = (float)arCameraTexture.width / arCameraTexture.height;
    }

    void UpdateText()
    {
        // デバッグ用にセンサデータを表示
        var text = string.Format("EulerAngles x: {0,10:F2}\ny: {1,10:F2}\nz: {2,10:F2}\n" +
            "Acceleration x: {3,10:F4}\ny: {4,10:F4}\nz: {5,10:F4}\n" +
            "GPS latitude: {6,10:F2}\nlongitude: {7,10:F2}",
            eulerAngles.x, eulerAngles.y, eulerAngles.z,
            acceleration.x, acceleration.y, acceleration.z,
            gpsPosition.latitude, gpsPosition.longitude);
        TextForDebug.text = text;
    }
}
