import React, { useState, useEffect } from 'react';
import {
  Settings,
  GitBranch,
  Key,
  FolderGit2,
  RefreshCw,
  HardDrive,
  Sun,
  ShieldCheck,
  AlertCircle,
  RotateCcw,
  ExternalLink
} from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { useRecipes } from '../../context/RecipeContext';
import {
  getStorageEstimate,
  requestPersistentStorage,
  clearAllRecipesInDB
} from '../../services/storage';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings, resetSettings } = useSettings();
  const { syncState, triggerSync, recipes } = useRecipes();

  const [formData, setFormData] = useState({
    repoOwner: settings.repoOwner,
    repoName: settings.repoName,
    branch: settings.branch,
    subdirectory: settings.subdirectory,
    githubToken: settings.githubToken || '',
    autoSyncOnLaunch: settings.autoSyncOnLaunch,
    theme: settings.theme,
    keepAwakeInCookingMode: settings.keepAwakeInCookingMode,
    speechVoiceRate: settings.speechVoiceRate || 1.0
  });

  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [storageInfo, setStorageInfo] = useState<{ usageMB: number; quotaMB: number } | null>(null);
  const [isPersisted, setIsPersisted] = useState<boolean>(false);

  useEffect(() => {
    getStorageEstimate().then((est) => setStorageInfo(est));
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persisted) {
      navigator.storage.persisted().then((p) => setIsPersisted(p));
    }
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings(formData);
    setSaveNotice('Settings saved successfully!');
    setTimeout(() => setSaveNotice(null), 2500);
  };

  const handleRequestPersist = async () => {
    const granted = await requestPersistentStorage();
    setIsPersisted(granted);
    if (granted) {
      setSaveNotice('Persistent storage granted by browser!');
    } else {
      setSaveNotice('Browser did not grant persistent storage.');
    }
    setTimeout(() => setSaveNotice(null), 2500);
  };

  const handleClearCacheAndReset = async () => {
    if (
      window.confirm(
        'Are you sure you want to clear your local recipe cache? Default recipes will be re-seeded.'
      )
    ) {
      await clearAllRecipesInDB();
      window.location.reload();
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div>
        <h2 className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <Settings className="w-6 h-6 text-brand-600" />
          <span>Application Settings</span>
        </h2>
        <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
          Configure your recipe source repository, Git differential sync options, and cooking preferences.
        </p>
      </div>

      {saveNotice && (
        <div className="bg-emerald-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl text-center shadow-lg animate-in fade-in">
          {saveNotice}
        </div>
      )}

      {/* Git Differential Sync Card */}
      <section className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 dark:border-stone-800 pb-4">
          <div>
            <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <FolderGit2 className="w-5 h-5 text-brand-600" />
              <span>Git Differential Sync Engine</span>
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Only downloads modified or new recipes by checking Git blob commit SHAs.
            </p>
          </div>

          <button
            onClick={() => triggerSync()}
            disabled={syncState.isSyncing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-xs transition-colors self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncState.isSyncing ? 'animate-spin' : ''}`} />
            <span>{syncState.isSyncing ? 'Syncing...' : 'Sync Now'}</span>
          </button>
        </div>

        {/* Sync Status / Live Log */}
        {syncState.isSyncing && (
          <div className="space-y-2 bg-brand-50/50 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-900/60 p-4 rounded-2xl">
            <div className="flex items-center justify-between text-xs text-brand-800 dark:text-brand-300 font-semibold">
              <span>{syncState.message}</span>
              <span>{syncState.progress}%</span>
            </div>
            <div className="w-full bg-stone-200 dark:bg-stone-800 h-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-600 transition-all duration-300"
                style={{ width: `${syncState.progress}%` }}
              />
            </div>
          </div>
        )}

        {syncState.error && (
          <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 p-4 rounded-2xl text-xs text-rose-800 dark:text-rose-200 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">Sync Failed</strong>
              <span>{syncState.error}</span>
            </div>
          </div>
        )}

        {/* Last Commit & Cache Stats */}
        {syncState.stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            <div className="bg-stone-50 dark:bg-stone-800/60 border border-stone-100 dark:border-stone-800 p-3 rounded-xl">
              <span className="text-[10px] text-stone-400 uppercase tracking-wider font-bold block">
                Last Commit
              </span>
              <a
                href={`https://github.com/${settings.repoOwner}/${settings.repoName}/commit/${syncState.stats.lastCommitSha}`}
                target="_blank"
                rel="noreferrer"
                className="font-mono font-bold text-xs text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 mt-0.5"
              >
                <span>{syncState.stats.lastCommitSha.slice(0, 7)}</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>

            <div className="bg-stone-50 dark:bg-stone-800/60 border border-stone-100 dark:border-stone-800 p-3 rounded-xl">
              <span className="text-[10px] text-stone-400 uppercase tracking-wider font-bold block">
                Cached Offline
              </span>
              <span className="font-bold text-xs text-stone-800 dark:text-stone-200 mt-0.5 block">
                {recipes.length} recipes
              </span>
            </div>

            <div className="bg-stone-50 dark:bg-stone-800/60 border border-stone-100 dark:border-stone-800 p-3 rounded-xl">
              <span className="text-[10px] text-stone-400 uppercase tracking-wider font-bold block">
                Last Diff Status
              </span>
              <span className="font-bold text-xs text-stone-800 dark:text-stone-200 mt-0.5 block">
                {syncState.stats.unchanged} unchanged, {syncState.stats.updated} updated
              </span>
            </div>

            <div className="bg-stone-50 dark:bg-stone-800/60 border border-stone-100 dark:border-stone-800 p-3 rounded-xl">
              <span className="text-[10px] text-stone-400 uppercase tracking-wider font-bold block">
                Sync Time
              </span>
              <span className="font-medium text-xs text-stone-600 dark:text-stone-400 mt-0.5 block truncate">
                {new Date(syncState.stats.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          </div>
        )}
      </section>

      {/* Repository Configuration Form */}
      <form
        onSubmit={handleSave}
        className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 shadow-xs space-y-6"
      >
        <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100 flex items-center gap-2 border-b border-stone-100 dark:border-stone-800 pb-3">
          <GitBranch className="w-5 h-5 text-brand-600" />
          <span>Recipe Repository Source</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
              GitHub Owner / Organization
            </label>
            <input
              type="text"
              value={formData.repoOwner}
              onChange={(e) => setFormData({ ...formData, repoOwner: e.target.value })}
              placeholder="carljmosca or marked-recipes"
              className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
              Repository Name
            </label>
            <input
              type="text"
              value={formData.repoName}
              onChange={(e) => setFormData({ ...formData, repoName: e.target.value })}
              placeholder="recipes"
              className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
              Branch
            </label>
            <input
              type="text"
              value={formData.branch}
              onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
              placeholder="main"
              className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
              Subdirectory / Folder (Optional)
            </label>
            <input
              type="text"
              value={formData.subdirectory}
              onChange={(e) => setFormData({ ...formData, subdirectory: e.target.value })}
              placeholder="e.g. recipes or leave blank for root"
              className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-stone-400" />
              <span>GitHub Personal Access Token (Optional)</span>
            </span>
            <span className="text-[10px] text-stone-400 font-normal">
              Increases rate limit from 60 to 5,000 req/hr
            </span>
          </label>
          <input
            type="password"
            value={formData.githubToken}
            onChange={(e) => setFormData({ ...formData, githubToken: e.target.value })}
            placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
            className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-mono focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="autoSync"
            checked={formData.autoSyncOnLaunch}
            onChange={(e) => setFormData({ ...formData, autoSyncOnLaunch: e.target.checked })}
            className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-stone-300"
          />
          <label htmlFor="autoSync" className="text-xs text-stone-700 dark:text-stone-300 cursor-pointer">
            Automatically check for repository updates on application launch
          </label>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-stone-100 dark:border-stone-800">
          <button
            type="button"
            onClick={resetSettings}
            className="text-xs text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
          >
            Reset to default repo
          </button>

          <button
            type="submit"
            className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-xs transition-colors"
          >
            Save Settings
          </button>
        </div>
      </form>

      {/* Cooking & UI Preferences */}
      <section className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 shadow-xs space-y-5">
        <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100 flex items-center gap-2 border-b border-stone-100 dark:border-stone-800 pb-3">
          <Sun className="w-5 h-5 text-amber-500" />
          <span>Display & Cooking Preferences</span>
        </h3>

        <div className="space-y-4">
          {/* Theme Selector */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-stone-800 dark:text-stone-200 block">
                Theme Appearance
              </span>
              <span className="text-[11px] text-stone-400">
                Choose light, dark, or system preference
              </span>
            </div>

            <div className="flex items-center bg-stone-100 dark:bg-stone-800 p-1 rounded-xl">
              {(['system', 'light', 'dark'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, theme: t });
                    updateSettings({ theme: t });
                  }}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize transition-all ${
                    settings.theme === t
                      ? 'bg-white dark:bg-stone-700 text-brand-600 dark:text-brand-400 shadow-xs'
                      : 'text-stone-500 dark:text-stone-400'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Cooking WakeLock */}
          <div className="flex items-center justify-between pt-2 border-t border-stone-100 dark:border-stone-800">
            <div>
              <span className="text-xs font-bold text-stone-800 dark:text-stone-200 block">
                Keep Screen Awake While Cooking
              </span>
              <span className="text-[11px] text-stone-400">
                Uses the Screen Wake Lock API to prevent phone/tablet screen from dimming
              </span>
            </div>

            <input
              type="checkbox"
              checked={formData.keepAwakeInCookingMode}
              onChange={(e) => {
                const checked = e.target.checked;
                setFormData({ ...formData, keepAwakeInCookingMode: checked });
                updateSettings({ keepAwakeInCookingMode: checked });
              }}
              className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-stone-300"
            />
          </div>
        </div>
      </section>

      {/* Storage & PWA Offline Diagnostics */}
      <section className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 shadow-xs space-y-4">
        <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100 flex items-center gap-2 border-b border-stone-100 dark:border-stone-800 pb-3">
          <HardDrive className="w-5 h-5 text-emerald-600" />
          <span>Local Storage & Offline Database</span>
        </h3>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <span className="font-bold text-stone-800 dark:text-stone-200 block">
              IndexedDB Storage Status
            </span>
            <span className="text-stone-500 dark:text-stone-400">
              {storageInfo
                ? `Using ${storageInfo.usageMB} MB of available ${storageInfo.quotaMB} MB`
                : 'Estimating storage...'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {!isPersisted ? (
              <button
                type="button"
                onClick={handleRequestPersist}
                className="px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-100 text-xs font-semibold"
              >
                Request Persistent Storage
              </button>
            ) : (
              <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                <ShieldCheck className="w-4 h-4" />
                <span>Persistent Storage Active</span>
              </span>
            )}
          </div>
        </div>

        <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex justify-end">
          <button
            type="button"
            onClick={handleClearCacheAndReset}
            className="flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 hover:underline"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Local Cache & Re-seed Defaults</span>
          </button>
        </div>
      </section>
    </div>
  );
};
