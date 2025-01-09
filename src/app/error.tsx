'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-[#FF4500]">
          Something went wrong!
        </h2>
        <button
          onClick={reset}
          className="mt-4 px-4 py-2 bg-[#FF4500] text-white rounded-lg"
        >
          Try again
        </button>
      </div>
    </div>
  );
} 