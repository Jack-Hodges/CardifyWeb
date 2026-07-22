function ProfileAvatar({
  avatarUrl,
  firstName,
  size = 'sm',
  fallbackBgClass = 'bg-purple-500',
  className = '',
}) {
  const initial = firstName?.charAt(0)?.toUpperCase() || 'U';
  const sizeClasses = {
    sm: 'w-10 h-10 text-xl',
    md: 'w-14 h-14 sm:w-16 sm:h-16 text-2xl sm:text-3xl',
  };

  if (avatarUrl) {
    return (
      <div
        className={`${sizeClasses[size]} rounded-full overflow-hidden bg-cover bg-center shrink-0 ${className}`}
        style={{ backgroundImage: `url(${avatarUrl})` }}
        role="img"
        aria-label={`${firstName || 'User'} profile picture`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center text-white font-bold shrink-0 ${fallbackBgClass} ${className}`}
      aria-hidden="true"
    >
      {initial}
    </div>
  );
}

export default ProfileAvatar;
