import { useNavigate } from "react-router-dom";

interface Props {
  title: string;
  description: string;
  version: string;
}

export default function ComingSoon({ title, description, version }: Props) {
  const navigate = useNavigate();
  return (
    <div className="max-w-md mx-auto text-center py-20 animate-fade-in">
      <div className="text-5xl mb-5 opacity-40">🚧</div>
      <h1 className="font-display text-2xl font-bold text-ink-100 mb-2">{title}</h1>
      <p className="text-sm text-ink-400 mb-6 leading-relaxed">{description}</p>
      <span className="text-xs text-ink-600 bg-ink-800 px-3 py-1 rounded-full font-mono">
        Planned for {version}
      </span>
      <div className="mt-8">
        <button className="btn-secondary" onClick={() => navigate("/")}>
          ← Dashboard
        </button>
      </div>
    </div>
  );
}
