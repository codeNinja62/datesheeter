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
    <div className="w-full max-w-lg space-y-2">
      <label className="block text-xs font-mono text-zinc-500">courses</label>

      <input
        type="text"
        placeholder="search…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full border border-zinc-700 bg-zinc-900 rounded px-3 py-2 text-sm font-mono text-zinc-100 placeholder:text-zinc-600 focus:border-amber-400 focus:outline-none transition-colors"
      />

      {selectedNames.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedNames.map((name) => (
            <span
              key={name}
              className="inline-flex items-center gap-1 bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-mono px-2 py-0.5 rounded"
            >
              {name}
              <button onClick={() => toggle(name)} className="hover:text-red-400 transition-colors">×</button>
            </span>
          ))}
          <button
            onClick={() => onSelect([])}
            className="text-xs font-mono text-zinc-600 hover:text-red-400 transition-colors"
          >
            clear
          </button>
        </div>
      )}

      <div className="max-h-56 overflow-y-auto border border-zinc-800 rounded bg-zinc-900">
        {filtered.length === 0 && (
          <p className="px-4 py-3 text-xs font-mono text-zinc-600">no results</p>
        )}
        {filtered.map((name) => {
          const checked = selectedNames.includes(name);
          return (
            <label
              key={name}
              className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer text-xs font-mono transition-colors hover:bg-zinc-800 ${
                checked ? 'text-amber-400' : 'text-zinc-400'
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(name)}
                className="accent-amber-400 w-3.5 h-3.5"
              />
              {name}
            </label>
          );
        })}
      </div>
    </div>
  );
}
