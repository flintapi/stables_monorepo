//  @ts-check

import { tanstackConfig } from '@tanstack/eslint-config'

export default [
  {
    ...tanstackConfig,
    rules: {
      'typescript-eslint/naming-convention': ['off'],
    },
  },
]
