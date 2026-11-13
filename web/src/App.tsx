import { Route, Routes } from 'react-router-dom'
import { Catalogo } from './pages/Catalogo'
import { Detalhes } from './pages/Detalhes'
import { Enviar } from './pages/Enviar'
import { Moderacao } from './pages/Moderacao'
import { RankingJogadores } from './pages/RankingJogadores'
import { RankingJogos } from './pages/RankingJogos'
import './styles.css'

function App() {
  return (
    <Routes>
      <Route path="*" element={<Catalogo />} />
      <Route path="/catalogo" element={<Catalogo />} />
      <Route path="/jogos/:id" element={<Detalhes />} />
      <Route path="/enviar" element={<Enviar />} />
      <Route path="/moderacao" element={<Moderacao />} />
      <Route path="/ranking/jogadores" element={<RankingJogadores />} />
      <Route path="/ranking/jogos" element={<RankingJogos />} />
    </Routes>
  )
}

export default App
