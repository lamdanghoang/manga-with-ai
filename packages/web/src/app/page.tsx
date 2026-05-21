import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex flex-col items-center p-4 pt-12">
      <h1 className="text-3xl font-bold">MangaWithAI</h1>
      <p className="mt-2 text-gray-400 text-center">Create manga stories with AI, powered by Gemini</p>
      <Link href="/create" className="mt-8 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-8 rounded-xl text-lg">
        ✨ Create New Story
      </Link>
      <Link href="/library" className="mt-4 text-purple-400 hover:text-purple-300">
        View My Library →
      </Link>
    </main>
  );
}
