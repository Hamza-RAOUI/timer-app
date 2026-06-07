//
//  TempoWidgetBridge.m
//
//  Objective-C glue exposing TempoWidgetBridge.swift to the RN runtime.
//

#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(TempoWidget, NSObject)

RCT_EXTERN_METHOD(
  setStats:(nonnull NSNumber *)focusMs
  sessions:(nonnull NSNumber *)sessions
  streak:(nonnull NSNumber *)streak
  resolver:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject
)

@end
