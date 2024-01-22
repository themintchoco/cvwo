import { SignUpModal } from './SignUpModal'

export const modals = {
  signUp: SignUpModal,
}

declare module '@mantine/modals' {
  export interface MantineModalsOverride {
    modals: typeof modals;
  }
}
