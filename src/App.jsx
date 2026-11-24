import React, { useState, useEffect } from 'react';
import './App.css';
import PlayerCard from './ProductCard.jsx';

// Mafia rollari bazasi
const ROLES_CONFIG = {
  DON: {
    id: 'DON',
    title: 'MAFIA DONI',
    team: 'MAFIA',
    icon: '🎩',
    color: '#ff2a5f',
    description: 'Mafiya sardori. Tunda mafiya nomidan yakuniy qarorni qabul qiladi va komissarni qidiradi.'
  },
  MAFIA: {
    id: 'MAFIA',
    title: 'MAFIA A’ZOSI',
    team: 'MAFIA',
    icon: '🔫',
    color: '#ff4d4d',
    description: 'Tunda boshqa mafiyalar bilan kelishib, tinch aholidan birini o‘yindan chiqaradi.'
  },
  DOCTOR: {
    id: 'DOCTOR',
    title: 'SHIFOKOR (DOKTOR)',
    team: 'CITY',
    icon: '💉',
    color: '#00f2fe',
    description: 'Tunda bir kishini (shu jumladan o‘zini ham, faqat ketma-ket 2 marta emas) o‘limdan saqlab qoladi.'
  },
  DETECTIVE: {
    id: 'DETECTIVE',
    title: 'KOMISSAR (SHERIF)',
    team: 'CITY',
    icon: '🕵️‍♂️',
    color: '#f9d423',
    description: 'Tunda bir o‘yinchining hujjatlarini tekshirib, uning Mafiya yoki Tinch aholi ekanini aniqlaydi.'
  },
  CITIZEN: {
    id: 'CITIZEN',
    title: 'TINCH AHOLI',
    team: 'CITY',
    icon: '🛡️',
    color: '#00e676',
    description: 'Kunduzgi muhokamalarda mantiq va kuzatuvchanlik orqali mafiyalarni fosh qiladi.'
  }
};

export default function App() {
  // 1. Kirish animatsiyasi (Intro) holati
  const [showIntro, setShowIntro] = useState(true);
  const [introFading, setIntroFading] = useState(false);

  // 2. Tema (Dark / Light mode)
  const [theme, setTheme] = useState('dark');

  // 3. Foydalanuvchilar bazasi (Ro'yxatdan o'tganlar)
  const [registeredUsers, setRegisteredUsers] = useState(() => {
    const saved = localStorage.getItem('xmafia_users');
    return saved ? JSON.parse(saved) : [];
  });

  // Joriy tizimga kirgan boshqaruvchi/o'yinchi
  const [currentUser, setCurrentUser] = useState(null);

  // Auth form holatlari
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [avatarInput, setAvatarInput] = useState('🎭');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  // 4. O'yin jarayoni holatlari
  const [gamePhase, setGamePhase] = useState('LOBBY'); // 'LOBBY' | 'ROLE_REVEAL' | 'DAY' | 'NIGHT' | 'GAME_OVER'
  const [lobbyPlayers, setLobbyPlayers] = useState([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerPin, setNewPlayerPin] = useState('');
  const [selectedPlayerForModal, setSelectedPlayerForModal] = useState(null);
  const [dayCount, setDayCount] = useState(1);
  const [timer, setTimer] = useState(60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [gameLogs, setGameLogs] = useState([]);
  const [winnerTeam, setWinnerTeam] = useState(null);

  // Kirish (Intro) animatsiyasi taymeri
  useEffect(() => {
    const fadeTimer = setTimeout(() => setIntroFading(true), 2400);
    const removeTimer = setTimeout(() => setShowIntro(false), 3200);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  // Ro'yxatdan o'tganlarni saqlash
  useEffect(() => {
    localStorage.setItem('xmafia_users', JSON.stringify(registeredUsers));
  }, [registeredUsers]);

  // O'yin taymeri
  useEffect(() => {
    let interval = null;
    if (isTimerRunning && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setIsTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timer]);

  // Tema almashtirish
  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Ro'yxatdan o'tish va Kirish (Auth) funksiyasi
  const handleAuthSubmit = (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    const cleanName = usernameInput.trim();
    const cleanPass = passwordInput.trim();

    if (!cleanName || !cleanPass) {
      setAuthError('Ism va maxfiy parolni kiritish shart!');
      return;
    }

    if (authMode === 'register') {
      const exists = registeredUsers.some(
        (u) => u.username.toLowerCase() === cleanName.toLowerCase()
      );
      if (exists) {
        setAuthError('Bu ism allaqachon band! Boshqa ism tanlang.');
        return;
      }
      if (cleanPass.length < 4) {
        setAuthError('Parol kamida 4 ta belgidan iborat bo‘lsin!');
        return;
      }

      const newUser = {
        id: Date.now(),
        username: cleanName,
        password: cleanPass,
        avatar: avatarInput,
        gamesPlayed: 0,
        wins: 0
      };

      setRegisteredUsers([...registeredUsers, newUser]);
      setAuthSuccess('Muvaffaqiyatli ro‘yxatdan o‘tdingiz! Tizimga kirilmoqda...');
      setTimeout(() => {
        setCurrentUser(newUser);
        setLobbyPlayers([
          {
            id: newUser.id,
            name: newUser.username,
            pin: newUser.password,
            avatar: newUser.avatar,
            role: null,
            isAlive: true,
            votes: 0,
            hasCheckedRole: false
          }
        ]);
      }, 900);
    } else {
      const foundUser = registeredUsers.find(
        (u) =>
          u.username.toLowerCase() === cleanName.toLowerCase() &&
          u.password === cleanPass
      );
      if (!foundUser) {
        setAuthError('Login yoki parol noto‘g‘ri! Agar akkaunt yo‘q bo‘lsa, ro‘yxatdan o‘ting.');
        return;
      }
      setAuthSuccess('Xush kelibsiz, ' + foundUser.username + '!');
      setTimeout(() => {
        setCurrentUser(foundUser);
        setLobbyPlayers([
          {
            id: foundUser.id,
            name: foundUser.username,
            pin: foundUser.password,
            avatar: foundUser.avatar,
            role: null,
            isAlive: true,
            votes: 0,
            hasCheckedRole: false
          }
        ]);
      }, 700);
    }
  };

  // O'yinga do'stlarni qo'shish (har birining o'z maxfiy PIN kodi bo'ladi)
  const handleAddPlayer = (e) => {
    e.preventDefault();
    if (!newPlayerName.trim() || !newPlayerPin.trim()) return;
    if (lobbyPlayers.some((p) => p.name.toLowerCase() === newPlayerName.trim().toLowerCase())) {
      alert('Bu ismli o‘yinchi ro‘yxatda bor!');
      return;
    }

    const newPlayer = {
      id: Date.now() + Math.random(),
      name: newPlayerName.trim(),
      pin: newPlayerPin.trim(), // Faqat shu o'yinchi o'z rolini ochish uchun ishlatadi
      avatar: ['🕶️', '🦊', '🐺', '🦅', '🦁', '🎭', '🃏', '🎩'][lobbyPlayers.length % 8],
      role: null,
      isAlive: true,
      votes: 0,
      hasCheckedRole: false
    };

    setLobbyPlayers([...lobbyPlayers, newPlayer]);
    setNewPlayerName('');
    setNewPlayerPin('');
  };

  // Ro'yxatdan o'tgan bazadagi do'stni tez qo'shish
  const handleQuickAddRegistered = (user) => {
    if (lobbyPlayers.some((p) => p.name.toLowerCase() === user.username.toLowerCase())) return;
    setLobbyPlayers([
      ...lobbyPlayers,
      {
        id: user.id,
        name: user.username,
        pin: user.password,
        avatar: user.avatar,
        role: null,
        isAlive: true,
        votes: 0,
        hasCheckedRole: false
      }
    ]);
  };

  // O'yinchini o'chirish
  const removePlayer = (id) => {
    setLobbyPlayers(lobbyPlayers.filter((p) => p.id !== id));
  };

  // ROLLARNI MAXFIY TAQSIMLASH ALGORITMI
  const startGameAndDealRoles = () => {
    if (lobbyPlayers.length < 4) {
      alert('O‘yin boshlash uchun kamida 4 nafar o‘yinchi kerak!');
      return;
    }

    const count = lobbyPlayers.length;
    let roleDeck = [];

    // O'yinchilar soniga qarab balanslangan rollar
    if (count === 4) {
      roleDeck = [ROLES_CONFIG.DON, ROLES_CONFIG.DOCTOR, ROLES_CONFIG.CITIZEN, ROLES_CONFIG.CITIZEN];
    } else if (count === 5) {
      roleDeck = [ROLES_CONFIG.DON, ROLES_CONFIG.DOCTOR, ROLES_CONFIG.DETECTIVE, ROLES_CONFIG.CITIZEN, ROLES_CONFIG.CITIZEN];
    } else {
      const mafiaCount = Math.floor(count / 3);
      roleDeck.push(ROLES_CONFIG.DON);
      for (let i = 1; i < mafiaCount; i++) {
        roleDeck.push(ROLES_CONFIG.MAFIA);
      }
      roleDeck.push(ROLES_CONFIG.DOCTOR);
      roleDeck.push(ROLES_CONFIG.DETECTIVE);
      while (roleDeck.length < count) {
        roleDeck.push(ROLES_CONFIG.CITIZEN);
      }
    }

    // Fisher-Yates algoritmi bilan aralashtirish
    for (let i = roleDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [roleDeck[i], roleDeck[j]] = [roleDeck[j], roleDeck[i]];
    }

    const assignedPlayers = lobbyPlayers.map((player, index) => ({
      ...player,
      role: roleDeck[index],
      isAlive: true,
      votes: 0,
      hasCheckedRole: false
    }));

    setLobbyPlayers(assignedPlayers);
    setGamePhase('ROLE_REVEAL');
    setDayCount(1);
    setWinnerTeam(null);
    setGameLogs(['🎭 Rollar tarqatildi! Har bir o‘yinchi o‘z maxfiy paroli bilan rolini ko‘rib olsin.']);
  };

  // O'yinchi o'z rolini ko'rib bo'lganini belgilash
  const markRoleChecked = (playerId) => {
    setLobbyPlayers((prev) =>
      prev.map((p) => (p.id === playerId ? { ...p, hasCheckedRole: true } : p))
    );
  };

  // O'yinchi tirik/o'lik holatini o'zgartirish (Tun yoki Kunduzgi ovoz berish natijasi)
  const togglePlayerAlive = (playerId) => {
    setLobbyPlayers((prev) => {
      const updated = prev.map((p) =>
        p.id === playerId ? { ...p, isAlive: !p.isAlive } : p
      );
      checkWinCondition(updated);
      return updated;
    });
  };

  // Ovoz berish
  const handleVote = (playerId) => {
    setLobbyPlayers((prev) =>
      prev.map((p) => (p.id === playerId ? { ...p, votes: p.votes + 1 } : p))
    );
  };

  const resetVotes = () => {
    setLobbyPlayers((prev) => prev.map((p) => ({ ...p, votes: 0 })));
  };

  // G'olib jamoani tekshirish
  const checkWinCondition = (playersList) => {
    const alivePlayers = playersList.filter((p) => p.isAlive);
    const aliveMafia = alivePlayers.filter((p) => p.role?.team === 'MAFIA');
    const aliveCity = alivePlayers.filter((p) => p.role?.team === 'CITY');

    if (aliveMafia.length === 0) {
      setWinnerTeam('CITY');
      setGamePhase('GAME_OVER');
      setIsTimerRunning(false);
    } else if (aliveMafia.length >= aliveCity.length) {
      setWinnerTeam('MAFIA');
      setGamePhase('GAME_OVER');
      setIsTimerRunning(false);
    }
  };

  // Fazalarni almashtirish (Tun <-> Kun)
  const switchPhase = (nextPhase) => {
    setGamePhase(nextPhase);
    resetVotes();
    if (nextPhase === 'NIGHT') {
      setTimer(45);
      setIsTimerRunning(true);
      setGameLogs((prev) => [`🌙 ${dayCount}-TUN boshlandi. Shahar uyquga ketdi...`, ...prev]);
    } else if (nextPhase === 'DAY') {
      setDayCount((d) => (gamePhase === 'NIGHT' ? d + 1 : d));
      setTimer(90);
      setIsTimerRunning(true);
      setGameLogs((prev) => [`☀️ Yangi KUN boshlandi! Muhokama va ovoz berish vaqti.`, ...prev]);
    }
  };

  // Chiqish (Logout)
  const handleLogout = () => {
    setCurrentUser(null);
    setGamePhase('LOBBY');
    setLobbyPlayers([]);
  };

  // 1. KIRISH ANIMATSIYASI EKRANI (INTRO)
  if (showIntro) {
    return (
      <div className={`intro-screen ${introFading ? 'intro-fade-out' : ''}`}>
        <div className="intro-particles">
          <span></span><span></span><span></span><span></span><span></span>
        </div>
        <div className="intro-content">
          <div className="intro-mask-glow">🎭</div>
          <h1 className="intro-title">
            <span>X</span> MAFIA
          </h1>
          <p className="intro-subtitle">SOYALAR SHAHRIGA XUSH KELIBSIZ</p>
          <div className="intro-loader-bar">
            <div className="intro-loader-fill"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`app-wrapper ${theme}`}>
      {/* Orqa fon animatsion effektlari */}
      <div className="ambient-bg">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
        <div className="grid-overlay"></div>
      </div>

      {/* Yuqori Navbar */}
      <header className="navbar">
        <div className="brand-box">
          <span className="brand-icon">🎭</span>
          <div>
            <h1 className="brand-name">X MAFIA</h1>
            <span className="brand-tag">PRO EDITION</span>
          </div>
        </div>

        <div className="nav-controls">
          <button
            className="theme-toggle-btn"
            onClick={toggleTheme}
            title="Mavzuni o‘zgartirish"
          >
            <span className="toggle-track">
              <span className="toggle-thumb">
                {theme === 'dark' ? '🌙' : '☀️'}
              </span>
            </span>
            <span className="toggle-label">
              {theme === 'dark' ? 'DARK' : 'LIGHT'}
            </span>
          </button>

          {currentUser && (
            <div className="user-pill">
              <span className="user-avatar">{currentUser.avatar}</span>
              <span className="user-name">{currentUser.username}</span>
              <button className="logout-btn" onClick={handleLogout}>
                Chiqish
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ASOSIY KONTENT */}
      <main className="main-container">
        {!currentUser ? (
          /* 2. LOGIN VA RO'YXATDAN O'TISH EKRANI */
          <section className="auth-section">
            <div className="auth-card glass-panel animate-pop-in">
              <div className="auth-header">
                <div className="auth-badge">MAXFIY KIRISH</div>
                <h2>{authMode === 'login' ? 'Tizimga Kirish' : 'Yangi O‘yinchi Ro‘yxati'}</h2>
                <p>
                  {authMode === 'login'
                    ? 'O‘z login va maxfiy parolingiz orqali o‘yinga kiring'
                    : 'Akkauntingiz yo‘qmi? Hoziroq ro‘yxatdan o‘ting'}
                </p>
              </div>

              <div className="auth-tabs">
                <button
                  type="button"
                  className={`auth-tab ${authMode === 'login' ? 'active' : ''}`}
                  onClick={() => {
                    setAuthMode('login');
                    setAuthError('');
                  }}
                >
                  🔐 Kirish (Login)
                </button>
                <button
                  type="button"
                  className={`auth-tab ${authMode === 'register' ? 'active' : ''}`}
                  onClick={() => {
                    setAuthMode('register');
                    setAuthError('');
                  }}
                >
                  📝 Ro‘yxatdan o‘tish
                </button>
              </div>

              <form className="auth-form" onSubmit={handleAuthSubmit}>
                <div className="input-group">
                  <label>O‘yinchi Ismi (Login)</label>
                  <input
                    type="text"
                    placeholder="Masalan: Don_Corleone"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                  />
                </div>

                <div className="input-group">
                  <label>Maxfiy Parol (Rolni himoyalash uchun)</label>
                  <input
                    type="password"
                    placeholder="Kamida 4 ta belgi..."
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                  />
                </div>

                {authMode === 'register' && (
                  <div className="input-group">
                    <label>Avatar tanlang</label>
                    <div className="avatar-selector">
                      {['🎭', '🎩', '🕵️‍♂️', '🦊', '🐺', '🕶️', '🃏', '👑'].map((emoji) => (
                        <button
                          type="button"
                          key={emoji}
                          className={`avatar-option ${avatarInput === emoji ? 'selected' : ''}`}
                          onClick={() => setAvatarInput(emoji)}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {authError && <div className="alert-box error">{authError}</div>}
                {authSuccess && <div className="alert-box success">{authSuccess}</div>}

                <button type="submit" className="primary-glow-btn">
                  {authMode === 'login' ? 'SHAHARGA KIRISH →' : 'AKKAUNT YARATISH ✨'}
                </button>
              </form>
            </div>
          </section>
        ) : (
          /* 3. O'YIN XONASI VA BOSQICHLARI */
          <section className="game-workspace">
            {/* Yuqori Holat Paneli */}
            <div className="status-bar glass-panel">
              <div className="phase-indicator">
                <span className="phase-dot"></span>
                <div>
                  <span className="phase-label">JORIY BOSQICH</span>
                  <h3 className="phase-title">
                    {gamePhase === 'LOBBY' && '👥 O‘yinchilarni yig‘ish'}
                    {gamePhase === 'ROLE_REVEAL' && '🔒 Maxfiy rollarni ko‘rish'}
                    {gamePhase === 'DAY' && `☀️ ${dayCount}-KUN: Muhokama`}
                    {gamePhase === 'NIGHT' && `🌙 ${dayCount}-TUN: Mafiya ovda`}
                    {gamePhase === 'GAME_OVER' && '🏆 O‘yin yakunlandi'}
                  </h3>
                </div>
              </div>

              {gamePhase !== 'LOBBY' && gamePhase !== 'GAME_OVER' && (
                <div className="timer-box">
                  <span className="timer-value">
                    {String(Math.floor(timer / 60)).padStart(2, '0')}:
                    {String(timer % 60).padStart(2, '0')}
                  </span>
                  <button
                    className="mini-btn"
                    onClick={() => setIsTimerRunning(!isTimerRunning)}
                  >
                    {isTimerRunning ? '⏸️' : '▶️'}
                  </button>
                </div>
              )}

              <div className="phase-actions">
                {gamePhase === 'LOBBY' && (
                  <button
                    className="primary-glow-btn"
                    onClick={startGameAndDealRoles}
                  >
                    🎲 ROLLARNI TARQATISH ({lobbyPlayers.length})
                  </button>
                )}

                {gamePhase === 'ROLE_REVEAL' && (
                  <button
                    className="primary-glow-btn"
                    onClick={() => switchPhase('NIGHT')}
                  >
                    🌙 1-TUNNI BOSHLASH
                  </button>
                )}

                {(gamePhase === 'NIGHT' || gamePhase === 'DAY') && (
                  <>
                    <button
                      className="secondary-btn"
                      onClick={() => switchPhase(gamePhase === 'NIGHT' ? 'DAY' : 'NIGHT')}
                    >
                      {gamePhase === 'NIGHT' ? '☀️ KUNGA O‘TISH' : '🌙 TUNGA O‘TISH'}
                    </button>
                    <button
                      className="danger-btn"
                      onClick={() => setGamePhase('LOBBY')}
                    >
                      Qayta boshlash
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* LOBBY REJIMI: Do'stlarni qo'shish */}
            {gamePhase === 'LOBBY' && (
              <div className="lobby-setup glass-panel animate-slide-up">
                <h3>➕ O‘yinga do‘stlarni qo‘shish</h3>
                <p className="hint-text">
                  Har bir o‘yinchi uchun alohida <strong>Maxfiy PIN-kod</strong> kiriting. O‘yin boshlanganda har kim faqat o‘z PIN-kodi bilan rolini ko‘ra oladi (birov ko‘rib qolmaydi!).
                </p>

                <form className="add-player-form" onSubmit={handleAddPlayer}>
                  <input
                    type="text"
                    placeholder="Do‘stingiz ismi..."
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                  />
                  <input
                    type="password"
                    placeholder="Maxfiy PIN (masalan: 1234)"
                    value={newPlayerPin}
                    onChange={(e) => setNewPlayerPin(e.target.value)}
                  />
                  <button type="submit" className="add-btn">
                    + Qo‘shish
                  </button>
                </form>

                {registeredUsers.length > 1 && (
                  <div className="quick-add-box">
                    <span>Ro‘yxatdan o‘tganlar:</span>
                    {registeredUsers.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        className="chip-btn"
                        onClick={() => handleQuickAddRegistered(u)}
                      >
                        {u.avatar} {u.username}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* G'OLIB E'LON QILISH EKRANI */}
            {gamePhase === 'GAME_OVER' && (
              <div className="winner-banner glass-panel animate-pop-in">
                <div className="winner-trophy">🏆</div>
                <h2>
                  {winnerTeam === 'MAFIA'
                    ? 'MAFIYA G‘ALABA QOZONDI! 🔫'
                    : 'TINCH AHOLI G‘ALABA QOZONDI! 🛡️'}
                </h2>
                <p>Barcha rollar ochildi. Yangi raund uchun tugmani bosing.</p>
                <button
                  className="primary-glow-btn"
                  onClick={() => setGamePhase('LOBBY')}
                >
                  🔄 YANGI O‘YIN BOSHLASH
                </button>
              </div>
            )}

            {/* O'YINCHILAR KARTALARI GRIDI (PlayerCard.jsx) */}
            <div className="players-grid">
              {lobbyPlayers.map((player, index) => (
                <PlayerCard
                  key={player.id}
                  player={player}
                  index={index}
                  gamePhase={gamePhase}
                  onRemove={() => removePlayer(player.id)}
                  onOpenSecretModal={() => setSelectedPlayerForModal(player)}
                  onToggleAlive={() => togglePlayerAlive(player.id)}
                  onVote={() => handleVote(player.id)}
                />
              ))}
            </div>

            {/* O'yin jurnali (Logs) */}
            {gameLogs.length > 0 && gamePhase !== 'LOBBY' && (
              <div className="logs-panel glass-panel">
                <h4>📜 Shahar xronikasi</h4>
                <ul>
                  {gameLogs.map((log, i) => (
                    <li key={i}>{log}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}
      </main>

      {/* MAXFIY ROLNI KO'RISH MODALI (Anti-Peek Security) */}
      {selectedPlayerForModal && (
        <SecretRoleModal
          player={selectedPlayerForModal}
          onClose={() => setSelectedPlayerForModal(null)}
          onConfirmSeen={() => {
            markRoleChecked(selectedPlayerForModal.id);
            setSelectedPlayerForModal(null);
          }}
        />
      )}
    </div>
  );
}

// Bitta o'yinchining rolini faqat parol orqali ko'rsatuvchi xavfsiz oyna
function SecretRoleModal({ player, onClose, onConfirmSeen }) {
  const [pinAttempt, setPinAttempt] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [errorShake, setErrorShake] = useState(false);
  const [autoHideSeconds, setAutoHideSeconds] = useState(10);

  // Rol ochilgandan keyin 10 soniyada avtomatik yopiladi (hech kim ko'rib qolmasligi uchun)
  useEffect(() => {
    if (!isUnlocked) return;
    const interval = setInterval(() => {
      setAutoHideSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onConfirmSeen();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isUnlocked, onConfirmSeen]);

  const verifyPin = (e) => {
    e.preventDefault();
    if (pinAttempt === player.pin) {
      setIsUnlocked(true);
    } else {
      setErrorShake(true);
      setTimeout(() => setErrorShake(false), 500);
      setPinAttempt('');
    }
  };

  return (
    <div className="modal-backdrop">
      <div className={`secret-modal glass-panel ${errorShake ? 'shake-anim' : ''}`}>
        <button className="close-modal-x" onClick={onClose}>✕</button>

        {!isUnlocked ? (
          <div className="pin-lock-view">
            <div className="lock-shield">🔒</div>
            <h3>{player.avatar} {player.name}</h3>
            <p>
              Diqqat! Boshqa o‘yinchilar ekranga qaramasin. O‘z rolingizni ko‘rish uchun maxfiy PIN-kodingizni kiriting:
            </p>
            <form onSubmit={verifyPin}>
              <input
                type="password"
                autoFocus
                placeholder="Maxfiy PIN-kod..."
                value={pinAttempt}
                onChange={(e) => setPinAttempt(e.target.value)}
              />
              <button type="submit" className="primary-glow-btn">
                👁️ ROLNI OCHISH
              </button>
            </form>
          </div>
        ) : (
          <div
            className="role-revealed-view"
            style={{ '--role-color': player.role?.color || '#ff2a5f' }}
          >
            <div className="auto-hide-timer">
              ⏳ Xavfsizlik uchun {autoHideSeconds} soniyada yopiladi
            </div>
            <div className="role-icon-big">{player.role?.icon}</div>
            <span className="role-team-tag">
              {player.role?.team === 'MAFIA' ? '🔴 MAFIYA JAMOASI' : '🟢 SHAHAR JAMOASI'}
            </span>
            <h2 className="role-title-big">{player.role?.title}</h2>
            <p className="role-desc">{player.role?.description}</p>
            <button className="primary-glow-btn" onClick={onConfirmSeen}>
              ✅ TUSHUNDIM, YASHIRISH
            </button>
          </div>
        )}
      </div>
    </div>
  );
}