import { Link2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import Generator from "@/components/Generator";

export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col row-start-2 items-center">
        <h1 className="text-2xl font-bold mb-2.5">GTB HINTTEST_</h1>
        <Card className="p-2 bg-background/95 rounded-lg md:min-w-[400px]">
          <Generator />
        </Card>
      </main>
      {/* <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4 text-sm"
          href="https://zmh.me"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Link2 className="w-4 h-4" />
          Powered by @ProgramZmh
        </a>
      </footer> */}
    </div>
  );
}
