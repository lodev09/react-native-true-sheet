package com.lodev09.truesheet.utils

import com.facebook.react.bridge.Promise

inline fun withPromise(promise: Promise, closure: () -> Any?) {
  try {
    val result = closure()
    promise.resolve(result)
  } catch (e: Throwable) {
    e.printStackTrace()
    promise.reject("Error", e.message, e.cause)
  }
}
