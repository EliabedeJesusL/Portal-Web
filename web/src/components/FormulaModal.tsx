// Explicação da nota ajustada (RF-G08 / RF-G14). O cálculo é feito pela API do G1;
// o Portal apenas explica a fórmula na tela.
export function FormulaModal() {
  return (
    <div className="ranking-explanation">
      <strong>Como a métrica funciona</strong>
      <p>
        A API calcula a nota ajustada pela média ponderada definida pelo
        G1. Com <code>m = 5</code>:
        {' '}
        <code>nota_ajustada = v/(v+m) · R + m/(v+m) · C</code>.
        Empates usam jogadores distintos e depois partidas.
      </p>
    </div>
  )
}
