import { forwardRef, useCallback, useImperativeHandle, useState } from 'react';
import { Drawer } from 'vaul';

import type { WebRenderer, TrueSheetRefMethods } from '../web/types';
import type { TrueSheetProps } from '../TrueSheet.types';
import { View } from 'react-native';

const VaulSheet = forwardRef<TrueSheetRefMethods, TrueSheetProps>((props, ref) => {
  const { children, dismissible = true, style } = props;

  const [isOpen, setIsOpen] = useState(false);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open && isOpen) {
        setIsOpen(false);
      }
    },
    [isOpen]
  );

  useImperativeHandle(ref, () => ({
    present: async () => {
      setIsOpen(true);
    },
    dismiss: async () => {
      setIsOpen(false);
    },
    resize: async () => {},
    dismissStack: async () => {},
  }));

  return (
    <Drawer.Root open={isOpen} onOpenChange={handleOpenChange} dismissible={dismissible}>
      <Drawer.Portal>
        <Drawer.Overlay style={overlayStyle} />
        <Drawer.Content style={contentStyle}>
          <Drawer.Handle />
          <View style={style}>{children}</View>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
});

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
};

const contentStyle: React.CSSProperties = {
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: 0,
  backgroundColor: '#fff',
  borderTopLeftRadius: 16,
  borderTopRightRadius: 16,
};

export const VaulRenderer: WebRenderer = {
  Sheet: VaulSheet,
};
