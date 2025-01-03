import { TriangleAlert } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-zinc-50">
      <div className="text-red-500">
        <TriangleAlert size={80} />
      </div>
      <h1 className="mt-6 text-6xl font-extrabold text-gray-800">404</h1>
      <p className="mt-4 text-lg text-gray-600">
        Oops! The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <a
        href="/"
        className="mt-6 px-6 py-3 text-lg font-medium text-white bg-red-500 rounded-lg shadow-md hover:bg-red-600 focus:ring-4 focus:ring-red-300 transition-all"
      >
        Go Back Home
      </a>
    </div>
  );
}
