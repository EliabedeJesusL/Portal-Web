import { unzipSync } from 'fflate'
import { describe, expect, it } from 'vitest'
import { extrairZip, validarPacote } from '../src/pacotes/validador.js'
import { manifestoValido, questoesValidas, zipDoGithub } from './support/pacote.js'

function validar(alteracoes: Record<string, unknown | null> = {}) {
  return validarPacote(extrairZip(zipDoGithub(alteracoes)))
}

function erroDe(alteracoes: Record<string, unknown | null>) {
  try {
    validar(alteracoes)
  } catch (err) {
    return err as { codigo: string; message: string }
  }
  throw new Error('Esperava que o pacote fosse rejeitado.')
}

describe('extrairZip', () => {
  it('remove a pasta que o GitHub coloca na raiz', () => {
    const arquivos = extrairZip(zipDoGithub())

    expect([...arquivos.keys()].sort()).toEqual([
      'capa.png',
      'game.json',
      'index.html',
      'js/jogo.js',
      'questoes.json',
    ])
  })

  it('dá PACOTE_INVALIDO para arquivo que não é zip', () => {
    expect(() => extrairZip(new Uint8Array([1, 2, 3]))).toThrow(
      expect.objectContaining({ codigo: 'PACOTE_INVALIDO' }),
    )
  })
})

describe('validarPacote', () => {
  it('aceita um jogo válido e reempacota com o jogo na raiz', () => {
    const pacote = validar()

    expect(pacote.manifesto.id).toBe('quiz-teste')
    expect(pacote.totalQuestoes).toBe(20)
    expect(pacote.sha256).toMatch(/^[0-9a-f]{64}$/)
    expect(Object.keys(unzipSync(pacote.zip))).toContain('index.html')
  })

  it('gera o mesmo sha256 para o mesmo conteúdo', () => {
    expect(validar().sha256).toBe(validar().sha256)
  })

  it('aceita caminhos com ./ no manifesto', () => {
    expect(() => validar({ 'game.json': manifestoValido({ capa: './capa.png' }) })).not.toThrow()
  })

  it('dá SEM_INDEX sem index.html na raiz', () => {
    expect(erroDe({ 'index.html': null }).codigo).toBe('SEM_INDEX')
  })

  it('dá SEM_MANIFESTO sem game.json', () => {
    expect(erroDe({ 'game.json': null }).codigo).toBe('SEM_MANIFESTO')
  })

  it('dá MANIFESTO_INVALIDO para JSON quebrado', () => {
    const erro = erroDe({ 'game.json': '{ "id": ' })

    expect(erro.codigo).toBe('MANIFESTO_INVALIDO')
    expect(erro.message).toContain('game.json não é um JSON válido')
  })

  it('dá MANIFESTO_INVALIDO indicando os campos com problema', () => {
    const erro = erroDe({
      'game.json': manifestoValido({ id: 'Quiz Teste', mecanica: 'puzzle', versao: 'um' }),
    })

    expect(erro.codigo).toBe('MANIFESTO_INVALIDO')
    expect(erro.message).toContain('id:')
    expect(erro.message).toContain('mecanica:')
    expect(erro.message).toContain('versao:')
  })

  it('dá MANIFESTO_INVALIDO quando a capa não existe', () => {
    const erro = erroDe({ 'capa.png': null })

    expect(erro.codigo).toBe('MANIFESTO_INVALIDO')
    expect(erro.message).toContain('capa')
  })

  it('dá MANIFESTO_INVALIDO quando questoes.json tem formato errado', () => {
    const erro = erroDe({ 'questoes.json': questoesValidas(20, { correta: 5 }) })

    expect(erro.codigo).toBe('MANIFESTO_INVALIDO')
    expect(erro.message).toContain('correta')
  })

  it('dá POUCAS_QUESTOES com menos de 20', () => {
    const erro = erroDe({ 'questoes.json': questoesValidas(19) })

    expect(erro.codigo).toBe('POUCAS_QUESTOES')
    expect(erro.message).toContain('19')
  })

  it('dá QUESTAO_SEM_FONTE listando as questões', () => {
    const banco = questoesValidas()
    banco.questoes[2]!.fonte = ''
    delete (banco.questoes[4] as { fonte?: string }).fonte

    const erro = erroDe({ 'questoes.json': banco })

    expect(erro.codigo).toBe('QUESTAO_SEM_FONTE')
    expect(erro.message).toContain('q3, q5')
  })
})
