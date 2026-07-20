export default function Loader({ fullPage = false }: { fullPage?: boolean }) {
  return (
    <div className={`loader-wrapper ${fullPage ? 'full-page' : ''}`}>
      <div className="spinner" />
      <p className="loader-text">Loading...</p>
    </div>
  );
}