export const pages = [
    { path: '/', title: 'Plexigent', label: 'Plexigent', prompt: 'Connecting Dots', invitation: 'What if?', next: 1 },
    { path: '/labs/', title: 'Labs', label: 'Plexigent Labs', prompt: 'What happens beyond the obvious?', invitation: 'What if it understood?', next: 2 },
    { path: '/dynamic-ux/', title: 'Dynamic UX', label: 'Plexigent Dynamic UX', prompt: 'What if the interface understood?', invitation: 'What becomes possible?', next: 3 },
    { path: '/engineering-six/', title: 'Engineering SiX', label: 'Plexigent Engineering SiX', prompt: 'What if a constraint became a breakthrough?', invitation: 'What could move itself?', next: 4 },
    { path: '/back-office-six/', title: 'Back Office SiX', label: 'Plexigent Back Office SiX', prompt: 'What if the work moved itself?', invitation: 'What comes next?', next: 0 },
    { path: '/about/', title: 'About Us', label: 'About Us', prompt: 'For now, we are in the chrysalis. Soon, we emerge.', invitation: 'Start a conversation', next: 6 },
    { path: '/contact/', title: 'Contact', label: 'Contact', prompt: 'What are you imagining?', invitation: 'Return to Plexigent', next: 0 },
] as const;
// Unknown paths recover to Home without inserting a history entry.
export function resolvePage(path: string) {
    const normalized = `/${path.split('/').filter(Boolean).join('/')}/`.replace('//', '/');
    const index = pages.findIndex(page => page.path === normalized);
    return { index: Math.max(0, index), known: index !== -1 };
}
export function previousPage(index: number) {
    return index === 6 ? 4 : Math.max(0, index - 1);
}
