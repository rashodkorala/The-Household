interface MemberAvatarProps {
  name: string
  color?: string
  size?: number
}

export default function MemberAvatar({ name, color = '#4ECDC4', size = 36 }: MemberAvatarProps) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div
      className="rounded-full flex items-center justify-center font-ui font-medium text-white shrink-0"
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        fontSize: size * 0.38,
      }}
    >
      {initials}
    </div>
  )
}
