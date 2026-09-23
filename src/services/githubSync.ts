import { AppSettings, Recipe, SyncStats, GitTreeItem } from '../types/recipe';
import { extractFrontmatter, parseRecipeBody } from './markdownParser';
import {
  getAllRecipesFromDB,
  saveRecipesToDB,
  deleteRecipeFromDB,
  saveSyncStatsToDB
} from './storage';

export interface SyncProgressCallback {
  (message: string, progressPercent?: number): void;
}

const IGNORED_FILES = new Set([
  'readme.md',
  'license',
  'license.md',
  'privacy.md',
  'contributing.md',
  'code_of_conduct.md'
]);

function isRecipeFile(path: string): boolean {
  const lower = path.toLowerCase();
  const filename = lower.split('/').pop() || '';

  if (IGNORED_FILES.has(filename)) return false;
  if (path.startsWith('.') || path.includes('/.')) return false;
  if (path.startsWith('node_modules/') || path.startsWith('mcp-server/')) return false;

  return lower.endsWith('.md') || lower.endsWith('.mcmd');
}

/**
 * Normalizes repository names or paths (e.g. handles redirects like carljmosca/recipes -> marked-recipes/recipes)
 */
export async function fetchWithAuth(url: string, token?: string): Promise<Response> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'MD-Chef-App'
  };

  if (token && token.trim().length > 0) {
    headers['Authorization'] = `token ${token.trim()}`;
  }

  return await fetch(url, { headers });
}

/**
 * Differential Git-aware sync against GitHub repository
 */
export async function syncWithGitHub(
  settings: AppSettings,
  onProgress?: SyncProgressCallback
): Promise<{ stats: SyncStats; updatedRecipes: Recipe[] }> {
  const owner = settings.repoOwner.trim() || 'carljmosca';
  const repo = settings.repoName.trim() || 'recipes';
  const branch = settings.branch.trim() || 'main';
  const token = settings.githubToken?.trim();

  onProgress?.(`Connecting to GitHub: ${owner}/${repo} (${branch})...`, 5);

  // 1. Fetch latest commit for branch
  const commitUrl = `https://api.github.com/repos/${owner}/${repo}/commits/${branch}`;
  const commitRes = await fetchWithAuth(commitUrl, token);

  if (!commitRes.ok) {
    if (commitRes.status === 403) {
      throw new Error(
        'GitHub API rate limit exceeded. Please add a Personal Access Token in Settings for 5,000 requests/hour.'
      );
    }
    if (commitRes.status === 404) {
      throw new Error(`Repository "${owner}/${repo}" or branch "${branch}" was not found.`);
    }
    throw new Error(`Failed to check repository updates: HTTP ${commitRes.status} ${commitRes.statusText}`);
  }

  const commitData = await commitRes.json();
  const latestCommitSha = commitData.sha as string;
  const commitMessage = commitData.commit?.message?.split('\n')[0] || '';
  const authorName = commitData.commit?.author?.name || 'GitHub User';
  const commitDate = commitData.commit?.author?.date || new Date().toISOString();

  onProgress?.(`Found latest commit: ${latestCommitSha.slice(0, 7)} — "${commitMessage}"`, 15);

  // 2. Fetch recursive git tree
  const treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${latestCommitSha}?recursive=1`;
  const treeRes = await fetchWithAuth(treeUrl, token);

  if (!treeRes.ok) {
    throw new Error(`Failed to fetch repository tree: HTTP ${treeRes.status}`);
  }

  const treeData = await treeRes.json();
  const treeItems: GitTreeItem[] = treeData.tree || [];

  // 3. Filter only recipe files
  const recipeTreeBlobs = treeItems.filter((item) => {
    if (item.type !== 'blob') return false;
    if (settings.subdirectory && !item.path.startsWith(settings.subdirectory)) return false;
    return isRecipeFile(item.path);
  });

  onProgress?.(`Inspecting ${recipeTreeBlobs.length} candidate recipe files in repository...`, 25);

  // 4. Compare with local IndexedDB cache
  const localRecipes = await getAllRecipesFromDB();
  const localMap = new Map<string, Recipe>();
  for (const r of localRecipes) {
    localMap.set(r.path, r);
  }

  const remotePaths = new Set<string>();
  const toFetch: GitTreeItem[] = [];
  let unchangedCount = 0;

  for (const remoteItem of recipeTreeBlobs) {
    remotePaths.add(remoteItem.path);
    const local = localMap.get(remoteItem.path);

    if (local && local.sha === remoteItem.sha) {
      // Unchanged! Blob SHA matches exactly.
      unchangedCount++;
    } else {
      // Either newly added or modified blob SHA
      toFetch.push(remoteItem);
    }
  }

  // Detect removed recipes
  const toRemove: string[] = [];
  for (const local of localRecipes) {
    if (!remotePaths.has(local.path)) {
      toRemove.push(local.id);
    }
  }

  onProgress?.(
    `Diff: ${toFetch.length} to download, ${unchangedCount} unchanged, ${toRemove.length} to remove.`,
    40
  );

  // 5. Download only changed/new files
  const downloadedRecipes: Recipe[] = [];
  let fetchedCount = 0;

  for (const item of toFetch) {
    fetchedCount++;
    const progress = Math.round(40 + (fetchedCount / Math.max(1, toFetch.length)) * 50);
    onProgress?.(`Downloading (${fetchedCount}/${toFetch.length}): ${item.path}`, progress);

    let rawMarkdown = '';

    // Prefer raw GitHub usercontent URL first
    try {
      const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${latestCommitSha}/${encodeURI(item.path)}`;
      const rawRes = await fetch(rawUrl);
      if (rawRes.ok) {
        rawMarkdown = await rawRes.text();
      }
    } catch {
      // Fallback to git blob API
    }

    if (!rawMarkdown) {
      // Fallback to Git blob API
      const blobRes = await fetchWithAuth(item.url || `https://api.github.com/repos/${owner}/${repo}/git/blobs/${item.sha}`, token);
      if (blobRes.ok) {
        const blobJson = await blobRes.json();
        if (blobJson.encoding === 'base64') {
          try {
            const binary = atob(blobJson.content.replace(/\s/g, ''));
            const bytes = Uint8Array.from(binary, (m) => m.charCodeAt(0));
            rawMarkdown = new TextDecoder('utf-8').decode(bytes);
          } catch {
            rawMarkdown = atob(blobJson.content.replace(/\s/g, ''));
          }
        }
      }
    }

    // Skip empty files (e.g. empty stub recipes in repo)
    if (!rawMarkdown || rawMarkdown.trim().length === 0) {
      continue;
    }

    // Parse recipe
    const { frontmatter, body } = extractFrontmatter(rawMarkdown);
    const pathParts = item.path.split('/');
    const category = pathParts.length > 1 ? pathParts[0] : 'General';
    const filename = pathParts[pathParts.length - 1];
    const { ingredients, instructions, notes } = parseRecipeBody(body, item.path);

    // Retain favorite state if existed locally
    const existing = localMap.get(item.path);

    const recipe: Recipe = {
      id: item.path,
      path: item.path,
      category,
      filename,
      sha: item.sha,
      frontmatter,
      rawContent: rawMarkdown,
      ingredients,
      instructions,
      notes,
      updatedAt: new Date().toISOString(),
      isFavorite: existing ? existing.isFavorite : false
    };

    downloadedRecipes.push(recipe);
  }

  // 6. Apply database changes
  if (toRemove.length > 0) {
    for (const remId of toRemove) {
      await deleteRecipeFromDB(remId);
      localMap.delete(remId);
    }
  }

  if (downloadedRecipes.length > 0) {
    await saveRecipesToDB(downloadedRecipes);
    for (const d of downloadedRecipes) {
      localMap.set(d.path, d);
    }
  }

  const finalRecipes = Array.from(localMap.values());

  const addedCount = toFetch.filter((f) => !localMap.has(f.path) || !localRecipes.some((lr) => lr.path === f.path)).length;
  const updatedCount = toFetch.length - addedCount;

  const stats: SyncStats = {
    added: Math.max(0, addedCount),
    updated: Math.max(0, updatedCount),
    removed: toRemove.length,
    unchanged: unchangedCount,
    total: finalRecipes.length,
    lastCommitSha: latestCommitSha,
    lastCommitMessage: commitMessage,
    lastCommitAuthor: authorName,
    lastCommitDate: commitDate,
    timestamp: new Date().toISOString()
  };

  await saveSyncStatsToDB(stats);

  onProgress?.(`Sync complete! ${stats.total} total recipes available offline.`, 100);

  return { stats, updatedRecipes: finalRecipes };
}
