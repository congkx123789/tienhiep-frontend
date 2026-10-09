#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * ═════════════════════════════════════════════════════════════════════════════
 *  NativeCoreBridge.h — CẦU NỐI OBJECTIVE-C CHO SWIFT (APPLE STANDARD)
 * ═════════════════════════════════════════════════════════════════════════════
 *  Chỉ chứa cú pháp Objective-C thuần để Swift có thể nạp tự nhiên.
 *  Không import các header C++ (tránh xung đột trình biên dịch Swift Clang).
 * ═════════════════════════════════════════════════════════════════════════════
 */
@interface NativeCoreBridge : NSObject

+ (instancetype)sharedInstance;

- (BOOL)isReady;
- (BOOL)initCoreWithBaseDir:(nullable NSString *)baseDir;
- (NSString *)translateText:(NSString *)text mode:(NSInteger)mode;
- (NSString *)normalizeTTS:(NSString *)text;
- (NSArray<NSString *> *)splitSentences:(NSString *)text;
- (nullable NSData *)synthesizeTTS:(NSString *)text speed:(float)speed;

@end

NS_ASSUME_NONNULL_END
