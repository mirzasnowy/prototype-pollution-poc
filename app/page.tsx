export default function HomePage() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Prototype Pollution PoC - Home</h1>
      <p>Welcome to the Prototype Pollution test application.</p>
      <p>
        <a href="/test-pollution" style={{ color: '#0066cc' }}>
          Go to Test Page →
        </a>
      </p>
    </div>
  );
}
