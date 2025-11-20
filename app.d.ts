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

declare module '*.svg' {
  import type { FunctionComponent } from 'react'
  import type { SvgProps } from 'react-native-svg'
  const content: FunctionComponent<SvgProps>
  export default content
}

