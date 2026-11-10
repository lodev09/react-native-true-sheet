import { Sheet } from '@lodev09/react-native-true-sheet/navigation/expo-router';

export const unstable_settings = {
  initialRouteName: 'index',
};

export default function ReproSheetLayout() {
  return (
    <Sheet>
      <Sheet.Screen name="index" />
      <Sheet.Screen name="details" options={{ detents: ['auto'], cornerRadius: 16 }} />
    </Sheet>
  );
}
