/// <reference types="nativewind/types" />
/// <reference types="react-native-css-interop/types" />

import 'react-native'

declare module 'react-native' {
  interface ViewProps {
    className?: string
  }

  interface TextProps {
    className?: string
  }
}

