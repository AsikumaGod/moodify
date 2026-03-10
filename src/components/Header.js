import '../styles/Header.css';

export default function Header({ mood }) {
  const gradient = mood
    ? `linear-gradient(135deg, ${mood.color}, ${mood.accent})`
    : 'linear-gradient(135deg, #ffffff, #666666)';

  return (
    <header className="header">
      <p className="header-label">How are you feeling?</p>
      <h1 className="header-title" style={{ backgroundImage: gradient }}>
        Moodify
      </h1>
    </header>
  );
}