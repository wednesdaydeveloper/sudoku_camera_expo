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

      // 1次: 格子線の行・列投影による直接検出
      if let r = Self.detectByGridLines(cgImage: cgImage, w: w, h: h) {
        return r
      }
      // 2次: 数字クラスターによる推定
      let vHandler = VNImageRequestHandler(cgImage: cgImage, options: [:])
      if let r = Self.detectByDigits(handler: vHandler, w: w, h: h) {
        return r
      }
      // 3次: 内接矩形優先の矩形検出
      if let r = Self.detectByRectangles(handler: vHandler, w: w, h: h) {
        return r
      }
      return Self.fallback(width: w, height: h)
    }
  }

  // MARK: - 1次: 格子線投影解析

  private static func detectByGridLines(cgImage: CGImage, w: Double, h: Double) -> [String: Any]? {
    // アスペクト比を維持しつつ最大 512px に縮小
    let maxDim = 512.0
    let scale  = min(maxDim / w, maxDim / h)
    let sw = Int(w * scale)
    let sh = Int(h * scale)

    // グレースケール縮小画像を作成（Y下向き＝UIKit座標で描画）
    let cs = CGColorSpaceCreateDeviceGray()
    guard let ctx = CGContext(
      data: nil, width: sw, height: sh,
      bitsPerComponent: 8, bytesPerRow: sw,
      space: cs, bitmapInfo: CGImageAlphaInfo.none.rawValue
    ) else { return nil }
    // CGContext はデフォルト Y 上向きのため、反転して UIKit 座標系に合わせる
    ctx.translateBy(x: 0, y: CGFloat(sh))
    ctx.scaleBy(x: 1, y: -1)
    ctx.draw(cgImage, in: CGRect(x: 0, y: 0, width: sw, height: sh))
    guard let data = ctx.data else { return nil }
    let px = data.bindMemory(to: UInt8.self, capacity: sw * sh)

    // 行投影・列投影: 暗いピクセル（<128）をカウント
    var rowProj = [Int](repeating: 0, count: sh)
    var colProj = [Int](repeating: 0, count: sw)
    for y in 0..<sh {
      for x in 0..<sw {
        if px[y * sw + x] < 128 {
          rowProj[y] += 1
          colProj[x] += 1
        }
      }
    }

    // 閾値: 行幅の 8% / 列高さの 8% 以上が暗い行/列を格子線候補とする
    let rowTh = sw / 12
    let colTh = sh / 12
    let candH = (0..<sh).filter { rowProj[$0] > rowTh }
    let candV = (0..<sw).filter { colProj[$0] > colTh }

    let hLines = clusterPositions(candH)
    let vLines = clusterPositions(candV)

    guard let hSpan = findGridSpan(hLines, minLines: 4),
          let vSpan = findGridSpan(vLines, minLines: 4) else { return nil }

    // 検出領域を検証: 面積と縦横比が妥当か
    let spanH = Double(hSpan.1 - hSpan.0)
    let spanV = Double(vSpan.1 - vSpan.0)
    let areaFrac = (spanH / Double(sh)) * (spanV / Double(sw))
    let ar = spanV / max(spanH, 1)
    guard areaFrac > 0.02 && areaFrac < 0.90 && ar > 0.35 && ar < 2.8 else { return nil }

    // リサイズ座標 → 元画像座標
    return [
      "topLeft":     ["x": Double(vSpan.0) / scale, "y": Double(hSpan.0) / scale],
      "topRight":    ["x": Double(vSpan.1) / scale, "y": Double(hSpan.0) / scale],
      "bottomRight": ["x": Double(vSpan.1) / scale, "y": Double(hSpan.1) / scale],
      "bottomLeft":  ["x": Double(vSpan.0) / scale, "y": Double(hSpan.1) / scale],
      "confidence":  0.85,
    ]
  }

  // 連続するピクセル位置をまとめ、各クラスターの中央値を返す
  private static func clusterPositions(_ pos: [Int], gap: Int = 5) -> [Int] {
    guard !pos.isEmpty else { return [] }
    var clusters: [[Int]] = []
    var cur = [pos[0]]
    for i in 1..<pos.count {
      if pos[i] - pos[i-1] <= gap { cur.append(pos[i]) }
      else { clusters.append(cur); cur = [pos[i]] }
    }
    clusters.append(cur)
    return clusters.map { c in let s = c.sorted(); return s[s.count / 2] }
  }

  // 等間隔な格子線グループを探し、その (最小, 最大) を返す
  private static func findGridSpan(_ lines: [Int], minLines: Int) -> (Int, Int)? {
    guard lines.count >= minLines else { return nil }

    // 隣接格子線間隔の中央値を基準とする
    var diffs = [Int]()
    for i in 1..<lines.count { diffs.append(lines[i] - lines[i-1]) }
    let med = diffs.sorted()[diffs.count / 2]
    guard med > 3 else { return nil }  // 間隔が 3px 以下は無効

    // 中央値の 0.3〜2.5 倍以内で連続するグループ（等間隔クラスター）を探す
    // ※ 3x3 ブロック境界は細線より太いため 2.5 倍まで許容
    var best: [Int] = []
    var cur: [Int] = [lines[0]]
    for i in 1..<lines.count {
      let d = lines[i] - lines[i-1]
      if d >= Int(Double(med) * 0.3) && d <= Int(Double(med) * 2.5) {
        cur.append(lines[i])
      } else {
        if cur.count > best.count { best = cur }
        cur = [lines[i]]
      }
    }
    if cur.count > best.count { best = cur }

    return best.count >= minLines ? (best.first!, best.last!) : nil
  }

  // MARK: - 2次: 数字位置クラスターから推定

  private static func detectByDigits(handler: VNImageRequestHandler, w: Double, h: Double) -> [String: Any]? {
    let req = VNRecognizeTextRequest()
    req.recognitionLevel = .accurate
    req.usesLanguageCorrection = false
    try? handler.perform([req])

    let all = (req.results ?? []).filter { obs in
      guard let top = obs.topCandidates(1).first else { return false }
      return top.confidence > 0.4 && top.string.count == 1 && "123456789".contains(top.string)
    }
    guard all.count >= 4 else { return nil }

    // Y 座標でソートし、大きなギャップでクラスター分割（キーボード等を除外）
    let sorted = all.sorted { $0.boundingBox.midY < $1.boundingBox.midY }
    let yRange = sorted.last!.boundingBox.midY - sorted.first!.boundingBox.midY
    let gapTh  = max(0.05, yRange * 0.15)

    var groups: [[VNRecognizedTextObservation]] = []
    var cur: [VNRecognizedTextObservation] = []
    for obs in sorted {
      if let last = cur.last, obs.boundingBox.midY - last.boundingBox.midY > gapTh {
        groups.append(cur); cur = []
      }
      cur.append(obs)
    }
    groups.append(cur)

    let digitObs = groups.max(by: { $0.count < $1.count }) ?? all
    guard digitObs.count >= 4 else { return nil }

    let minX = digitObs.map { $0.boundingBox.minX }.min()!
    let maxX = digitObs.map { $0.boundingBox.maxX }.max()!
    let minY = digitObs.map { $0.boundingBox.minY }.min()!
    let maxY = digitObs.map { $0.boundingBox.maxY }.max()!

    // 1 セル分（約 13%）の余白
    let padX = (maxX - minX) * 0.13; let padY = (maxY - minY) * 0.13
    let l = max(0, minX - padX); let r = min(1, maxX + padX)
    let b = max(0, minY - padY); let t = min(1, maxY + padY)

    return [
      "topLeft":     ["x": l * w, "y": (1 - t) * h],
      "topRight":    ["x": r * w, "y": (1 - t) * h],
      "bottomRight": ["x": r * w, "y": (1 - b) * h],
      "bottomLeft":  ["x": l * w, "y": (1 - b) * h],
      "confidence":  0.75,
    ]
  }

  // MARK: - 3次: 矩形検出（内接矩形優先）

  private static func detectByRectangles(handler: VNImageRequestHandler, w: Double, h: Double) -> [String: Any]? {
    let req = VNDetectRectanglesRequest()
    req.minimumAspectRatio = 0.5; req.maximumAspectRatio = 2.0
    req.minimumConfidence = 0.2; req.maximumObservations = 20; req.minimumSize = 0.10
    try? handler.perform([req])

    guard let obs = req.results, !obs.isEmpty else { return nil }
    let q = obs
      .filter { o in let a = Double(o.boundingBox.width * o.boundingBox.height); return a > 0.08 && a < 0.85 }
      .sorted { Double($0.boundingBox.width * $0.boundingBox.height) > Double($1.boundingBox.width * $1.boundingBox.height) }
    guard !q.isEmpty else { return nil }

    var best: VNRectangleObservation?
    if q.count >= 2 {
      outer: for i in 1..<q.count {
        let inner = q[i].boundingBox
        let ia = Double(inner.width * inner.height)
        for j in 0..<i {
          let o = q[j].boundingBox
          let ox = max(0, Double(min(o.maxX, inner.maxX) - max(o.minX, inner.minX)))
          let oy = max(0, Double(min(o.maxY, inner.maxY) - max(o.minY, inner.minY)))
          if ox * oy / ia > 0.75 { best = q[i]; break outer }
        }
      }
    }
    if best == nil {
      best = q.max(by: { a, b in
        let sqA = 1.0 - min(abs(Double(a.boundingBox.width / a.boundingBox.height) - 1.0), 0.5) / 0.5
        let sqB = 1.0 - min(abs(Double(b.boundingBox.width / b.boundingBox.height) - 1.0), 0.5) / 0.5
        return Double(a.confidence) * sqA < Double(b.confidence) * sqB
      })
    }
    guard let rect = best, rect.confidence > 0.1 else { return nil }
    return Self.toResult(rect, w: w, h: h)
  }

  // MARK: - ヘルパー

  private static func toResult(_ r: VNRectangleObservation, w: Double, h: Double) -> [String: Any] {
    [
      "topLeft":     ["x": r.topLeft.x * w,     "y": (1 - r.topLeft.y) * h],
      "topRight":    ["x": r.topRight.x * w,    "y": (1 - r.topRight.y) * h],
      "bottomRight": ["x": r.bottomRight.x * w, "y": (1 - r.bottomRight.y) * h],
      "bottomLeft":  ["x": r.bottomLeft.x * w,  "y": (1 - r.bottomLeft.y) * h],
      "confidence":  Double(r.confidence),
    ]
  }

  private static func fallback(width w: Double, height h: Double) -> [String: Any] {
    let mx = w * 0.20; let my = h * 0.20
    return [
      "topLeft":     ["x": mx,   "y": my],
      "topRight":    ["x": w-mx, "y": my],
      "bottomRight": ["x": w-mx, "y": h-my],
      "bottomLeft":  ["x": mx,   "y": h-my],
      "confidence":  0.0,
    ]
  }
}
