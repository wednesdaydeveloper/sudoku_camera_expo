import ExpoModulesCore
import Vision
import UIKit

public class SudokuDetectorModule: Module {
  public func definition() -> ModuleDefinition {
    Name("SudokuDetector")

    AsyncFunction("detectGrid") { (imageUri: String) -> [String: Any] in
      let path = imageUri.hasPrefix("file://")
        ? String(imageUri.dropFirst(7))
        : imageUri
      guard let image = UIImage(contentsOfFile: path),
            let cgImage = image.cgImage else {
        return Self.fallback(width: 1, height: 1)
      }

      let w = Double(image.size.width)
      let h = Double(image.size.height)

      // VNDetectRectanglesRequest — 正方形に近い最大矩形を探す
      let request = VNDetectRectanglesRequest()
      request.minimumAspectRatio = 0.5   // width/height
      request.maximumAspectRatio = 2.0
      request.minimumConfidence  = 0.2
      request.maximumObservations = 10
      request.minimumSize = 0.2          // 画像短辺の 20% 以上の大きさ

      let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
      try? handler.perform([request])

      guard let observations = request.results,
            !observations.isEmpty else {
        return Self.fallback(width: w, height: h)
      }

      // アスペクト比が 1:1 に最も近く、かつ最も大きい矩形を選ぶ
      let best = observations
        .filter { obs in
          let ar = obs.boundingBox.width / obs.boundingBox.height
          return ar > 0.6 && ar < 1.4
        }
        .max(by: { a, b in
          a.boundingBox.width * a.boundingBox.height < b.boundingBox.width * b.boundingBox.height
        })

      guard let rect = best, rect.confidence > 0.2 else {
        return Self.fallback(width: w, height: h)
      }

      // Vision 座標は正規化 + 左下原点 → UIKit (左上原点) に変換
      return [
        "topLeft":     ["x": rect.topLeft.x * w,     "y": (1.0 - rect.topLeft.y) * h],
        "topRight":    ["x": rect.topRight.x * w,    "y": (1.0 - rect.topRight.y) * h],
        "bottomRight": ["x": rect.bottomRight.x * w, "y": (1.0 - rect.bottomRight.y) * h],
        "bottomLeft":  ["x": rect.bottomLeft.x * w,  "y": (1.0 - rect.bottomLeft.y) * h],
        "confidence":  Double(rect.confidence),
      ]
    }
  }

  private static func fallback(width w: Double, height h: Double) -> [String: Any] {
    let mx = w * 0.05
    let my = h * 0.05
    return [
      "topLeft":     ["x": mx,     "y": my],
      "topRight":    ["x": w - mx, "y": my],
      "bottomRight": ["x": w - mx, "y": h - my],
      "bottomLeft":  ["x": mx,     "y": h - my],
      "confidence":  0.0,
    ]
  }
}
