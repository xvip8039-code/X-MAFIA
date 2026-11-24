import React, { useState } from 'react';

export default function PlayerCard({
  player,
  index,
  gamePhase,
  onRemove,
  onOpenSecretModal,
  onToggleAlive,
  onVote
}) {
  // 3D Tilt animatsiyasi uchun koordinatalar
  const [tiltStyle, setTiltStyle] = useState({});
  const [isHovered, setIsHovered] = useState(false);

  // Sichqoncha harakatiga qarab 3D egilish va yaltirash effekti
  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -10;
    const rotateY = ((x - centerX) / centerX) * 10;

    setTiltStyle({
      transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.03, 1.03, 1.03)`,
      '--mouse-x': `${x}px`,
      '--mouse-y': `${y}px`
    });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTiltStyle({
      transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)'
    });
  };

  const isGameOver = gamePhase === 'GAME_OVER';
  const isLobby = gamePhase === 'LOBBY';
  const isRoleReveal = gamePhase === 'ROLE_REVEAL';
  const isActiveRound = gamePhase === 'DAY' || gamePhase === 'NIGHT';

  return (
    <div
      className={`player-card glass-panel ${!player.isAlive ? 'eliminated-card' : ''} ${
        isHovered ? 'card-hovered' : ''
      }`}
      style={{
        ...tiltStyle,
        animationDelay: `${index * 0.08}s`,
        '--accent-role': isGameOver && player.role ? player.role.color : '#ff2a5f'
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
    >
      {/* Holographic nurlanish qatlami */}
      <div className="card-glare"></div>

      {/* Yuqori qism: Raqam, Holat va O'chirish tugmasi */}
      <div className="card-top-bar">
        <span className="player-number">#{String(index + 1).padStart(2, '0')}</span>

        {!isLobby && (
          <span className={`status-pill ${player.isAlive ? 'alive' : 'dead'}`}>
            {player.isAlive ? '● O‘YINDA' : '☠️ CHIQARILGAN'}
          </span>
        )}

        {isLobby && (
          <button
            type="button"
            className="remove-player-btn"
            onClick={onRemove}
            title="O‘yinchini olib tashlash"
          >
            ✕
          </button>
        )}
      </div>

      {/* Markaziy qism: Avatar va Ism */}
      <div className="card-identity">
        <div className="avatar-ring">
          <span className="card-avatar">{player.avatar}</span>
          {isRoleReveal && player.hasCheckedRole && (
            <span className="checked-badge" title="Rol ko‘rildi">
              ✓
            </span>
          )}
        </div>
        <h3 className="card-player-name">{player.name}</h3>
        <span className="pin-indicator">
          {isLobby ? '🔑 PIN-kod himoyalangan' : '🛡️ Shaxsiy maxfiylik faol'}
        </span>
      </div>

      {/* MAXFIY ROL BLOKI (O'yin tugamaguncha hech kimga ko'rinmaydi!) */}
      {!isLobby && (
        <div className="secret-role-slot">
          {isGameOver && player.role ? (
            <div
              className="revealed-final-role"
              style={{ borderColor: player.role.color }}
            >
              <span className="final-role-icon">{player.role.icon}</span>
              <div>
                <strong style={{ color: player.role.color }}>
                  {player.role.title}
                </strong>
                <small>
                  {player.role.team === 'MAFIA' ? 'Mafiya jamoasi' : 'Tinch aholi'}
                </small>
              </div>
            </div>
          ) : (
            <div className="encrypted-box">
              <div className="scan-line"></div>
              <span className="encrypted-text">🔒 MAXFIY ROL YASHIRILGAN</span>
              <button
                type="button"
                className="unlock-role-btn"
                onClick={onOpenSecretModal}
              >
                {player.hasCheckedRole ? '👁️ Qayta tekshirish (PIN)' : '🔐 Rolni ko‘rish (PIN)'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* O'yin jarayoni boshqaruvi (Ovoz berish va O'yindan chiqarish) */}
      {isActiveRound && (
        <div className="card-round-controls">
          {gamePhase === 'DAY' && player.isAlive && (
            <button
              type="button"
              className="vote-action-btn"
              onClick={onVote}
            >
              🗳️ Ovoz berish <span className="vote-counter">{player.votes}</span>
            </button>
          )}

          <button
            type="button"
            className={`eliminate-toggle-btn ${player.isAlive ? 'kill' : 'revive'}`}
            onClick={onToggleAlive}
          >
            {player.isAlive ? '💀 O‘yindan chiqarish' : '✨ O‘yinga qaytarish'}
          </button>
        </div>
      )}
    </div>
  );
}