import { forwardRef } from 'react';
import { Group } from 'three';
import { AvatarDef } from '../data/avatars';

interface Props { avatar: AvatarDef; faded?: boolean }

const PlayerAvatar = forwardRef<Group, Props>(({ avatar, faded }, ref) => {
  const opacity = faded ? 0.25 : 1;
  return (
    <group ref={ref}>
      <mesh position={[0, 1.0, 0]} castShadow>
        <capsuleGeometry args={[0.32, 0.9, 6, 12]} />
        <meshStandardMaterial color={avatar.bodyColor} roughness={0.7} transparent opacity={opacity} />
      </mesh>
      <mesh position={[0, 1.7, 0]} castShadow>
        <sphereGeometry args={[0.22, 16, 12]} />
        <meshStandardMaterial color={avatar.bodyColor} roughness={0.7} transparent opacity={opacity} />
      </mesh>
      {avatar.role === 'prey' ? (
        <mesh position={[0, 1.72, -0.18]}>
          <boxGeometry args={[0.36, 0.08, 0.05]} />
          <meshStandardMaterial color={avatar.accentColor} emissive={avatar.accentColor} emissiveIntensity={0.8} transparent opacity={opacity} />
        </mesh>
      ) : (
        <mesh position={[0, 1.78, 0]} rotation={[Math.PI/2, 0, 0]}>
          <torusGeometry args={[0.27, 0.04, 8, 24]} />
          <meshStandardMaterial color={avatar.accentColor} emissive={avatar.accentColor} emissiveIntensity={1.1} transparent opacity={opacity} />
        </mesh>
      )}
      <mesh position={[-0.15, 0.4, 0]}>
        <capsuleGeometry args={[0.12, 0.5, 4, 8]} />
        <meshStandardMaterial color={avatar.bodyColor} roughness={0.8} transparent opacity={opacity} />
      </mesh>
      <mesh position={[0.15, 0.4, 0]}>
        <capsuleGeometry args={[0.12, 0.5, 4, 8]} />
        <meshStandardMaterial color={avatar.bodyColor} roughness={0.8} transparent opacity={opacity} />
      </mesh>
    </group>
  );
});
export default PlayerAvatar;
