import Foundation
import Capacitor

@objc(NativeCorePlugin)
public class NativeCorePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "NativeCorePlugin"
    public let jsName = "NativeCore"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "isReady", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "initCore", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "translate", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "normalizeTTS", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "splitSentences", returnType: CAPPluginReturnPromise)
    ]

    @objc func isReady(_ call: CAPPluginCall) {
        let ready = NativeCore_IsReady() == 1
        call.resolve(["ready": ready])
    }

    @objc func initCore(_ call: CAPPluginCall) {
        let baseDir = call.getString("baseDir") ?? Bundle.main.bundlePath
        let ok = NativeCore_Init(baseDir) == 1
        call.resolve(["success": ok])
    }

    @objc func translate(_ call: CAPPluginCall) {
        guard let text = call.getString("text"), !text.isEmpty else {
            call.resolve(["result": ""])
            return
        }
        let mode = call.getInt("mode") ?? 4
        if let cResult = NativeCore_Translate(text, Int32(mode)) {
            let swiftResult = String(cString: cResult)
            NativeCore_FreeString(UnsafeMutablePointer(mutating: cResult))
            call.resolve(["result": swiftResult])
        } else {
            call.resolve(["result": text])
        }
    }

    @objc func normalizeTTS(_ call: CAPPluginCall) {
        guard let text = call.getString("text"), !text.isEmpty else {
            call.resolve(["result": ""])
            return
        }
        if let cResult = NativeCore_NormalizeTTS(text) {
            let swiftResult = String(cString: cResult)
            NativeCore_FreeString(UnsafeMutablePointer(mutating: cResult))
            call.resolve(["result": swiftResult])
        } else {
            call.resolve(["result": text])
        }
    }

    @objc func splitSentences(_ call: CAPPluginCall) {
        guard let text = call.getString("text"), !text.isEmpty else {
            call.resolve(["sentences": []])
            return
        }
        if let cResult = NativeCore_SplitSentences(text) {
            let jsonString = String(cString: cResult)
            NativeCore_FreeString(UnsafeMutablePointer(mutating: cResult))
            if let data = jsonString.data(using: .utf8),
               let arr = try? JSONSerialization.jsonObject(with: data) as? [String] {
                call.resolve(["sentences": arr])
                return
            }
        }
        call.resolve(["sentences": [text]])
    }
}
