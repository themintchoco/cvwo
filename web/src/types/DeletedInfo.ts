export type DeletedInfo<T, K extends keyof T = never> = {
  [P in keyof Omit<T, K | 'deleted'>]: undefined
} & Pick<T, K> & {
  deleted: true
}
