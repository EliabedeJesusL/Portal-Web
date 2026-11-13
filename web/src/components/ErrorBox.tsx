import { XCircle } from 'lucide-react'

export function ErrorBox({ message }: { message: string }) {
  return (
    <div className="message message--error">
      <XCircle size={22} />
      <div>
        <strong>Não foi possível concluir a operação.</strong>
        <p>{message}</p>
      </div>
    </div>
  )
}
