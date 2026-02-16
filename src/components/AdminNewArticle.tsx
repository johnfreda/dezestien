'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Plus, X, Save, Loader2, Trash2, Upload, Flame } from 'lucide-react';

const CATEGORIES = ['Nieuws', 'Review', 'Hardware', 'Tech', 'Indie', 'Mods', 'Gerucht', 'Opinie'];
const PLATFORM_OPTIONS = ['PS5', 'PlayStation 5 Pro', 'PS4', 'Xbox Series X|S', 'Xbox One', 'PC', 'Nintendo Switch', 'Nintendo Switch 2', 'Steam Deck', 'Mobile'];

export default function AdminNewArticle() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const boxFileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [category, setCategory] = useState('Nieuws');
  const [score, setScore] = useState(0);
  const [bodyMarkdown, setBodyMarkdown] = useState('');
  const [pros, setPros] = useState<string[]>([]);
  const [cons, setCons] = useState<string[]>([]);
  const [isHot, setIsHot] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [newImageAsset, setNewImageAsset] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [boxImagePreview, setBoxImagePreview] = useState<string | null>(null);
  const [newBoxImageAsset, setNewBoxImageAsset] = useState<any>(null);
  const [uploadingBox, setUploadingBox] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [reviewType, setReviewType] = useState('game');

  useEffect(() => {
    if (!session?.user?.id) return;
    fetch('/api/admin/check')
      .then(res => res.json())
      .then(data => {
        if (data.isAdmin) setIsAdmin(true);
      })
      .catch(() => {});
  }, [session?.user?.id]);

  if (!isAdmin) return null;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError('');

    try {
      const reader = new FileReader();
      reader.onload = (ev) => setImagePreview(ev.target?.result as string);
      reader.readAsDataURL(file);

      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch('/api/admin/articles/upload-image', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setNewImageAsset(data.asset);
    } catch (err: any) {
      setError(`Upload mislukt: ${err.message}`);
      setImagePreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleBoxImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingBox(true);
    setError('');

    try {
      const reader = new FileReader();
      reader.onload = (ev) => setBoxImagePreview(ev.target?.result as string);
      reader.readAsDataURL(file);

      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch('/api/admin/articles/upload-image', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setNewBoxImageAsset(data.asset);
    } catch (err: any) {
      setError(`Box art upload mislukt: ${err.message}`);
      setBoxImagePreview(null);
    } finally {
      setUploadingBox(false);
    }
  };

  const togglePlatform = (p: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
    );
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Titel is verplicht');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const payload: Record<string, any> = {
        title,
        excerpt,
        category,
        bodyMarkdown,
        isHot,
      };

      if (category === 'Review') {
        payload.score = score;
        payload.pros = pros.filter(p => p.trim());
        payload.cons = cons.filter(c => c.trim());
        payload.platforms = selectedPlatforms;
        payload.reviewType = reviewType;
      }

      if (newImageAsset) {
        payload.mainImage = newImageAsset;
      }

      if (newBoxImageAsset) {
        payload.boxImage = newBoxImageAsset;
      }

      const res = await fetch('/api/admin/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuccess('Artikel aangemaakt!');
      setTimeout(() => {
        setOpen(false);
        router.push(`/artikel/${data.slug}`);
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Aanmaken mislukt');
    } finally {
      setSaving(false);
    }
  };

  const addPro = () => setPros([...pros, '']);
  const addCon = () => setCons([...cons, '']);
  const removePro = (i: number) => setPros(pros.filter((_, idx) => idx !== i));
  const removeCon = (i: number) => setCons(cons.filter((_, idx) => idx !== i));
  const updatePro = (i: number, val: string) => setPros(pros.map((p, idx) => idx === i ? val : p));
  const updateCon = (i: number, val: string) => setCons(cons.map((c, idx) => idx === i ? val : c));

  return (
    <>
      {/* Floating plus button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-green-600 hover:bg-green-500 text-white rounded-full shadow-xl flex items-center justify-center transition-all hover:scale-110 border-2 border-green-400/30"
        title="Nieuw artikel"
      >
        <Plus size={24} />
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-xl bg-[#0d1220] border-l border-gray-800 z-50 transform transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        } overflow-y-auto`}
      >
        {/* Header */}
        <div className="sticky top-0 bg-[#0d1220] border-b border-gray-800 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-white">Nieuw Artikel</h2>
          <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="px-6 py-6 space-y-6">
          {error && (
            <div className="bg-red-900/40 border border-red-700 text-red-300 px-4 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-900/40 border border-green-700 text-green-300 px-4 py-2 rounded-lg text-sm">
              {success}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-1">Titel</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Artikel titel..."
              className="w-full bg-[#111827] border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
            />
          </div>

          {/* Excerpt */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-1">Excerpt</label>
            <textarea
              value={excerpt}
              onChange={e => setExcerpt(e.target.value)}
              rows={3}
              placeholder="Korte samenvatting..."
              className="w-full bg-[#111827] border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 resize-none"
            />
          </div>

          {/* Category + isHot row */}
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-300 mb-1">Categorie</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full bg-[#111827] border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <button
              onClick={() => setIsHot(!isHot)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border font-semibold text-sm transition-colors ${
                isHot
                  ? 'bg-orange-600/20 border-orange-500 text-orange-400'
                  : 'bg-[#111827] border-gray-700 text-gray-400 hover:border-gray-500'
              }`}
            >
              <Flame size={16} />
              Hot
            </button>
          </div>

          {/* Review Type (only for Review) */}
          {category === 'Review' && (
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Type Review</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setReviewType('game')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    reviewType === 'game'
                      ? 'bg-purple-600/20 border-purple-500 text-purple-400'
                      : 'bg-[#111827] border-gray-700 text-gray-400 hover:border-gray-500'
                  }`}
                >
                  Game
                </button>
                <button
                  onClick={() => setReviewType('hardware')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    reviewType === 'hardware'
                      ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400'
                      : 'bg-[#111827] border-gray-700 text-gray-400 hover:border-gray-500'
                  }`}
                >
                  Hardware
                </button>
                <button
                  onClick={() => setReviewType('film_serie')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    reviewType === 'film_serie'
                      ? 'bg-rose-600/20 border-rose-500 text-rose-400'
                      : 'bg-[#111827] border-gray-700 text-gray-400 hover:border-gray-500'
                  }`}
                >
                  Film / Serie
                </button>
              </div>
            </div>
          )}

          {/* Score (only for Review) */}
          {category === 'Review' && (
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-1">Score (1-100)</label>
              <input
                type="number"
                min={1}
                max={100}
                value={score}
                onChange={e => setScore(Number(e.target.value))}
                className="w-32 bg-[#111827] border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
              />
            </div>
          )}

          {/* Hero Image */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-1">Hero Afbeelding</label>
            {imagePreview && (
              <div className="mb-2 rounded-lg overflow-hidden border border-gray-700">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview}
                  alt="Hero preview"
                  className="w-full h-40 object-cover"
                />
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 px-4 py-2 bg-[#111827] border border-gray-700 rounded-lg text-gray-300 hover:border-green-500 transition-colors text-sm"
            >
              {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              {uploading ? 'Uploaden...' : 'Afbeelding uploaden'}
            </button>
          </div>

          {/* Box Art (only for Review) */}
          {category === 'Review' && (
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-1">Box Art / Cover</label>
              {boxImagePreview && (
                <div className="mb-2 rounded-lg overflow-hidden border border-gray-700 w-32">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={boxImagePreview}
                    alt="Box art preview"
                    className="w-full h-auto object-cover"
                  />
                </div>
              )}
              <input
                ref={boxFileInputRef}
                type="file"
                accept="image/*"
                onChange={handleBoxImageUpload}
                className="hidden"
              />
              <button
                onClick={() => boxFileInputRef.current?.click()}
                disabled={uploadingBox}
                className="flex items-center gap-2 px-4 py-2 bg-[#111827] border border-gray-700 rounded-lg text-gray-300 hover:border-green-500 transition-colors text-sm"
              >
                {uploadingBox ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                {uploadingBox ? 'Uploaden...' : 'Box art uploaden'}
              </button>
            </div>
          )}

          {/* Platforms (only for Review) */}
          {category === 'Review' && (
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Getest op platforms</label>
              <div className="flex flex-wrap gap-2">
                {PLATFORM_OPTIONS.map(p => (
                  <button
                    key={p}
                    onClick={() => togglePlatform(p)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      selectedPlatforms.includes(p)
                        ? 'bg-green-600/20 border-green-500 text-green-400'
                        : 'bg-[#111827] border-gray-700 text-gray-400 hover:border-gray-500'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Pros/Cons (only for Review) */}
          {category === 'Review' && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Pluspunten</label>
                <div className="space-y-2">
                  {pros.map((pro, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        type="text"
                        value={pro}
                        onChange={e => updatePro(i, e.target.value)}
                        placeholder="Pluspunt..."
                        className="flex-1 bg-[#111827] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500"
                      />
                      <button onClick={() => removePro(i)} className="text-red-400 hover:text-red-300 px-1">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  <button onClick={addPro} className="flex items-center gap-1 text-green-400 hover:text-green-300 text-sm">
                    <Plus size={14} /> Toevoegen
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Minpunten</label>
                <div className="space-y-2">
                  {cons.map((con, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        type="text"
                        value={con}
                        onChange={e => updateCon(i, e.target.value)}
                        placeholder="Minpunt..."
                        className="flex-1 bg-[#111827] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500"
                      />
                      <button onClick={() => removeCon(i)} className="text-red-400 hover:text-red-300 px-1">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  <button onClick={addCon} className="flex items-center gap-1 text-red-400 hover:text-red-300 text-sm">
                    <Plus size={14} /> Toevoegen
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Body (markdown) */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-1">
              Artikel tekst <span className="font-normal text-gray-500">(markdown)</span>
            </label>
            <textarea
              value={bodyMarkdown}
              onChange={e => setBodyMarkdown(e.target.value)}
              rows={20}
              placeholder="Schrijf je artikel in markdown..."
              className="w-full bg-[#111827] border border-gray-700 rounded-lg px-4 py-3 text-white font-mono text-sm leading-relaxed focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 resize-y"
            />
            <p className="text-xs text-gray-500 mt-1">
              Gebruik ## voor koppen, **vet**, *cursief*, [link](url), - voor lijsten
            </p>
          </div>

          {/* Save button */}
          <div className="sticky bottom-0 bg-[#0d1220] border-t border-gray-800 -mx-6 px-6 py-4 mt-8">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 disabled:bg-green-800 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-colors shadow-lg"
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {saving ? 'Publiceren...' : 'Artikel Publiceren'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
