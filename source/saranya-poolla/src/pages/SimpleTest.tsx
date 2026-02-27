export default function SimpleTest() {
  return (
    <div style={{ padding: 40, textAlign: 'center' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#3b82f6' }}>
        ✅ Simple Test Page Works!
      </h1>
      <p style={{ fontSize: '1.2rem', color: '#6b7280' }}>
        If you can see this, the basic routing is working.
      </p>
      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
        <p><strong>Page URL:</strong> /simple-test</p>
        <p><strong>Component:</strong> SimpleTest.tsx</p>
      </div>
    </div>
  );
}