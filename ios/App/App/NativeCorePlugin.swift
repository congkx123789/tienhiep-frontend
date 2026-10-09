import Foundation
import Capacitor
import AVFoundation

@objc(NativeCorePlugin)
public class NativeCorePlugin: CAPPlugin, CAPBridgedPlugin, AVAudioPlayerDelegate {
    public let identifier = "NativeCorePlugin"
    public let jsName = "NativeCore"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "isReady", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "initCore", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "translate", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "normalizeTTS", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "splitSentences", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "playAudioWav", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stopAudio", returnType: CAPPluginReturnPromise)
    ]

    private let bridge = NativeCoreBridge.sharedInstance()
    private var audioPlayer: AVAudioPlayer?

    @objc func isReady(_ call: CAPPluginCall) {
        let ready = bridge.isReady()
        call.resolve(["ready": ready])
    }

    @objc func initCore(_ call: CAPPluginCall) {
        let baseDir = call.getString("baseDir") ?? Bundle.main.bundlePath
        let ok = bridge.initCore(withBaseDir: baseDir)
        call.resolve(["success": ok])
    }

    @objc func translate(_ call: CAPPluginCall) {
        guard let text = call.getString("text"), !text.isEmpty else {
            call.resolve(["result": ""])
            return
        }
        let mode = call.getInt("mode") ?? 4
        let result = bridge.translateText(text, mode: mode)
        call.resolve(["result": result])
    }

    @objc func normalizeTTS(_ call: CAPPluginCall) {
        guard let text = call.getString("text"), !text.isEmpty else {
            call.resolve(["result": ""])
            return
        }
        let result = bridge.normalizeTTS(text)
        call.resolve(["result": result])
    }

    @objc func splitSentences(_ call: CAPPluginCall) {
        guard let text = call.getString("text"), !text.isEmpty else {
            call.resolve(["sentences": []])
            return
        }
        let arr = bridge.splitSentences(text)
        call.resolve(["sentences": arr])
    }

    @objc func playAudioWav(_ call: CAPPluginCall) {
        guard let base64Data = call.getString("base64Data"),
              let audioData = Data(base64Encoded: base64Data) else {
            call.reject("Dữ liệu âm thanh không hợp lệ")
            return
        }

        do {
            try AVAudioSession.sharedInstance().setCategory(.playback, mode: .spokenAudio, options: [.duckOthers])
            try AVAudioSession.sharedInstance().setActive(true)
            
            self.audioPlayer?.stop()
            self.audioPlayer = try AVAudioPlayer(data: audioData)
            self.audioPlayer?.delegate = self
            self.audioPlayer?.prepareToPlay()
            self.audioPlayer?.play()
            call.resolve(["success": true])
        } catch {
            call.reject("Lỗi phát âm thanh Native: \(error.localizedDescription)")
        }
    }

    @objc func stopAudio(_ call: CAPPluginCall) {
        self.audioPlayer?.stop()
        self.audioPlayer = nil
        call.resolve(["success": true])
    }

    public func audioPlayerDidFinishPlaying(_ player: AVAudioPlayer, successfully flag: Bool) {
        self.notifyListeners("audioEnded", data: ["success": flag])
    }
}

