package expo.modules.sudokudetector

import android.graphics.BitmapFactory
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.Promise

class SudokuDetectorModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("SudokuDetector")

    AsyncFunction("detectGrid") { imageUri: String, promise: Promise ->
      try {
        val path = imageUri.removePrefix("file://")
        val options = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        BitmapFactory.decodeFile(path, options)
        val w = options.outWidth.toDouble()
        val h = options.outHeight.toDouble()
        // Android: Vision Framework 相当がなく OpenCV 不要のフォールバック実装
        // TODO: ML Kit Document Scanner または OpenCV での実装に置き換え可
        val mx = w * 0.05
        val my = h * 0.05
        promise.resolve(mapOf(
          "topLeft"     to mapOf("x" to mx,     "y" to my),
          "topRight"    to mapOf("x" to w - mx, "y" to my),
          "bottomRight" to mapOf("x" to w - mx, "y" to h - my),
          "bottomLeft"  to mapOf("x" to mx,     "y" to h - my),
          "confidence"  to 0.0
        ))
      } catch (e: Exception) {
        promise.reject("DETECT_ERROR", e.message, e)
      }
    }
  }
}
