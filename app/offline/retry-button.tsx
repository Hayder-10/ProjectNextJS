'use client';

export default function RetryButton() {
  return (
    <button onClick={() => location.reload()} className="btn btn-primary">
      Réessayer
    </button>
  );
}
