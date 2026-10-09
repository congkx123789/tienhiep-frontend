export {
  initNativeCoreWasm,
  isNativeCoreWasmReady,
  wasmTranslate,
  wasmExtractChapter,
  wasmSanitizeWeb,
  wasmNormalize,
  wasmSplitSentences,
  wasmParseTxt,
  wasmParseEpub,
} from './nativeCoreWasm';

export {
  initOnnxModels,
  isOnnxModelsReady,
  getCmlmSession,
  getMatchaSession,
} from './onnxInference';
