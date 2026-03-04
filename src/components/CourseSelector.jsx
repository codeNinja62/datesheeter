import { useState, useMemo } from 'react';

export default function CourseSelector({ courses, selectedNames, onSelect }) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search) return courses;
    const q = search.toLowerCase();
    return courses.filter((name) => name.toLowerCase().includes(q));
  }, [courses, search]);

  const toggle = (name) => {
    if (selectedNames.includes(name)) {
      onSelect(selectedNames.filter((n) => n !== name));
    } else {
      onSelect([...selectedNames, name]);
    }
  };

  const clearAll = () => onSelect([]);

  return (
    <div className="w-full max-w-lg">
      <label className="block text-sm font-medium text-slate-600 mb-1">
        Select Courses
      </label>

      {/* Search box */}
      <input
        type="text"
        placeholder="Search courses…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition mb-2"
      />

      {/* Selected chips */}
      {selectedNames.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selectedNames.map((name) => (
            <span
              key={name}
              className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-700 text-xs font-medium px-2.5 py-1 rounded-full"
            >
              {name}
              <button
                onClick={() => toggle(name)}
                className="hover:text-indigo-900 font-bold"
              >
                ×
              </button>
            </span>
          ))}
          <button
            onClick={clearAll}
            className="text-xs text-slate-400 hover:text-red-500 transition ml-1"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Course list */}
      <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-lg bg-white">
        {filtered.length === 0 && (
          <p className="px-4 py-3 text-sm text-slate-400">No courses found.</p>
        )}
        {filtered.map((name) => {
          const checked = selectedNames.includes(name);
          return (
            <label
              key={name}
              className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-indigo-50 transition text-sm ${
                checked ? 'bg-indigo-50/60' : ''
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(name)}
                className="accent-indigo-600 w-4 h-4"
              />
              <span className="text-slate-700">{name}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
