import { Settings } from 'lucide-react-native';

type SettingsIconProps = {
  size?: number;
  color?: string;
  strokeWidth?: number;
};

export function SettingsIcon({
  size = 20,
  color = '#636366',
  strokeWidth = 2,
}: SettingsIconProps) {
  return <Settings size={size} color={color} strokeWidth={strokeWidth} />;
}
