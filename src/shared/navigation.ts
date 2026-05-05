const githubPagesBase = '/App-Fidelizacion-Libreria/'

export function appPage(page: 'owner.html' | 'client.html') {
  if (window.location.hostname.endsWith('github.io')) {
    return `${githubPagesBase}${page}`
  }

  return `./${page}`
}
