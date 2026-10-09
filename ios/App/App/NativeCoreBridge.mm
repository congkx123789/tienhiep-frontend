#import "NativeCoreBridge.h"
#include "bridge_c.h"
#include <string>
#include <vector>
#include <cstring>

/**
 * ═════════════════════════════════════════════════════════════════════════════
 *  NativeCoreBridge.mm — TRIỂN KHAI OBJECTIVE-C++ WRAPPER (APPLE STANDARD)
 * ═════════════════════════════════════════════════════════════════════════════
 *  File .mm cho phép Clang trộn lẫn mã nguồn C++ (std::string, vector, Trie)
 *  với Objective-C (NSString, NSData, NSArray), quản lý vòng đời bộ nhớ tự động
 *  qua Apple ARC (Automatic Reference Counting), không rò rỉ RAM trên iOS.
 * ═════════════════════════════════════════════════════════════════════════════
 */
@implementation NativeCoreBridge

+ (instancetype)sharedInstance {
    static NativeCoreBridge *instance = nil;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        instance = [[NativeCoreBridge alloc] init];
    });
    return instance;
}

- (BOOL)isReady {
    return NativeCore_IsReady() == 1;
}

- (BOOL)initCoreWithBaseDir:(nullable NSString *)baseDir {
    const char *dir = (baseDir && baseDir.length > 0) ? [baseDir UTF8String] : ".";
    return NativeCore_Init(dir) == 1;
}

- (NSString *)translateText:(NSString *)text mode:(NSInteger)mode {
    if (!text || text.length == 0) return @"";
    const char *cInput = [text UTF8String];
    const char *cResult = NativeCore_Translate(cInput, (int)mode);
    if (!cResult) return text;
    
    NSString *result = [NSString stringWithUTF8String:cResult];
    NativeCore_FreeString((char *)cResult); // Giải phóng buffer C++ an toàn
    return result ?: text;
}

- (NSString *)normalizeTTS:(NSString *)text {
    if (!text || text.length == 0) return @"";
    const char *cInput = [text UTF8String];
    const char *cResult = NativeCore_NormalizeTTS(cInput);
    if (!cResult) return text;
    
    NSString *result = [NSString stringWithUTF8String:cResult];
    NativeCore_FreeString((char *)cResult);
    return result ?: text;
}

- (NSArray<NSString *> *)splitSentences:(NSString *)text {
    if (!text || text.length == 0) return @[];
    const char *cInput = [text UTF8String];
    const char *cResult = NativeCore_SplitSentences(cInput);
    if (!cResult) return @[text];
    
    NSString *jsonStr = [NSString stringWithUTF8String:cResult];
    NativeCore_FreeString((char *)cResult);
    
    NSData *data = [jsonStr dataUsingEncoding:NSUTF8StringEncoding];
    if (data) {
        NSError *error = nil;
        NSArray *arr = [NSJSONSerialization JSONObjectWithData:data options:0 error:&error];
        if ([arr isKindOfClass:[NSArray class]] && arr.count > 0) {
            return arr;
        }
    }
    return @[text];
}

- (nullable NSData *)synthesizeTTS:(NSString *)text speed:(float)speed {
    if (!text || text.length == 0) return nil;
    // Chuẩn hóa văn bản trước khi sinh âm thanh
    NSString *normalized = [self normalizeTTS:text];
    if (!normalized || normalized.length == 0) normalized = text;
    
    // Tạm thời xuất sang file đệm tmp của ứng dụng iOS
    NSString *tmpFile = [NSTemporaryDirectory() stringByAppendingPathComponent:@"tts_temp.wav"];
    int ok = NativeCore_SynthesizeWav([normalized UTF8String], [tmpFile UTF8String], speed);
    if (ok == 0 && [[NSFileManager defaultManager] fileExistsAtPath:tmpFile]) {
        NSData *data = [NSData dataWithContentsOfFile:tmpFile];
        [[NSFileManager defaultManager] removeItemAtPath:tmpFile error:nil];
        return data;
    }
    return nil;
}

@end
