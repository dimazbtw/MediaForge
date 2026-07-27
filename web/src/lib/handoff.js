/**
 * Passagem de ficheiros entre páginas.
 *
 * Objetos `File` não cabem num URL nem sobrevivem a serialização, por isso a
 * caixa de arrasto da página inicial deixa-os aqui e o conversor vai buscá-los
 * ao montar. É de leitura única: quem consome, esvazia.
 */
let pending = []

export function stashFiles(files) {
  pending = [...files]
}

export function takeFiles() {
  const files = pending
  pending = []
  return files
}

export function hasPendingFiles() {
  return pending.length > 0
}
