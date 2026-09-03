import { describe, expect, it } from 'vitest'
import { assertNoError } from './supabase-result'

describe('assertNoError', () => {
  it('laisse passer quand tout a réussi', () => {
    expect(() => assertNoError([{ error: null }, { error: null }], 'bikes')).not.toThrow()
  })

  it('lève dès qu’une requête a échoué', () => {
    const results = [
      { error: null },
      { error: { message: 'TypeError: Failed to fetch' } },
      { error: null },
    ]

    expect(() => assertNoError(results, 'bikes')).toThrow('Failed to fetch')
  })

  it('mentionne l’écran dans le message', () => {
    // Sans ce repère, une erreur en console ne dit pas quel chargeur a échoué :
    // ils lèvent tous le même « Failed to fetch ».
    expect(() => assertNoError([{ error: { message: 'boom' } }], 'cout')).toThrow('[cout]')
  })

  it('ne confond pas un résultat vide avec un échec', () => {
    // Le cas d'un compte neuf : les requêtes réussissent et ne rendent rien.
    // C'est précisément la distinction que le code ne faisait pas.
    expect(() => assertNoError([{ error: null }], 'bikes')).not.toThrow()
  })
})
