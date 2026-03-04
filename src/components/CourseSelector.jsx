import { useState, useMemo } from 'react';

export default function CourseSelector({ courses, selectedNames, onSelect }) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search) return courses;
    const q = search.toLowerCase();
    return courses.filter((n) => n.toLowerCase().includes(q));
  }, [courses, search]);

  const toggle = (name) =>
    onSelect(
      selectedNames.includes(name)
        ? selectedNames.filter((n) => n !== name)
        : [...selectedNames, name]
    );

  return (
    <div className="w-full max-w-lg space-y-3">
      <label className="block text-[10px] font-mono text-white/30 tracking-[0.3em] uppercase">Courses</label>

      <input
        type="text"
        placeholder="search…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full glass rounded-xl px-4 py-2.5 text-sm font-mono text-white
          placeholder:text-white/20 focus:outline-none focus:border-amber-400/50 transition-all"
      />

      {selectedNames.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedNames.map((name) => (
            <span
              key={name}
              className="inline-flex items-center gap-1.5 glass text-white/70 text-[11px] font-mono px-3 py-1 rounded-lg"
            >
              {name}
              <button onClick={() => toggle(name)} className="text-white/30 hover:text-rose-400 transition-colors leading-none">×</button>
            </span>
          ))}
          <button
            onClick={() => onSelect([])}
            className="text-[11px] font-mono text-white/20 hover:text-rose-400 transition-colors px-2 py-1"
          >
            clear all
          </button>
        </div>
      )}

      <div className="glass max-h-60 overflow-y-auto rounded-2xl">
        {filtered.length === 0 && (
          <p className="px-5 py-4 text-[11px] font-mono text-white/25">no results</p>
        )}
        {filtered.map((name) => {
          const checked = selectedNames.includes(name);
          return (
            <label
              key={name}
              className={`flex items-center gap-3 px-5 py-3 cursor-pointer text-[11px] font-mono transition-all
                hover:bg-white/5 ${
                checked ? 'text-amber-400' : 'text-white/45'
              }`}
            >
              <span className={`w-3.5 h-3.5 rounded flex items-center justify-center flex-shrink-0 border transition-all ${
                checked
                  ? 'bg-amber-400 border-amber-400'
                  : 'border-white/20 bg-transparent'
              }`}>
                {checked && <span className="text-slate-950 text-[8px] leading-none font-black">✓</span>}
              </span>
              <input type="checkbox" checked={checked} onChange={() => toggle(name)} className="sr-only" />
              {name}
            </label>
          );
        })}
      </div>
    </div>
  );
}
